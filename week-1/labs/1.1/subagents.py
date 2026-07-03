# =============================================================================
# subagents.py — Exercise 2 (S2: Coordinator & Subagents)
# =============================================================================
# PURPOSE:
#   Defines four specialist subagent functions that each make exactly ONE
#   Claude API call. The coordinator (coordinator.py) calls these in sequence:
#     Classifier → CRM Enricher → Drafter → Validator
#
# CCA-F EXAM CONCEPTS:
#
#   1. HUB-AND-SPOKE PATTERN:
#      - The coordinator is the HUB — it owns the state and decides ordering.
#      - Each subagent is a SPOKE — it has NO shared memory with other subagents.
#      - A subagent only knows what the coordinator EXPLICITLY passes to it
#        in that call's messages array. If context is missing, the subagent
#        will guess or hallucinate (see subagents_no_context.py for this failure).
#
#   2. WHY FOUR SEPARATE SUBAGENTS instead of one giant prompt?
#      - Classification errors silently contaminate the draft in a single prompt.
#      - CRM data is missing and nobody flags it.
#      - The validator has no clear contract to check against.
#      - Separating concerns makes each step TESTABLE, RETRYABLE, and REPLACEABLE.
#
#   3. MODEL SELECTION:
#      - Coordinator (orchestrator): claude-opus-4-6 — highest reasoning for routing
#      - Subagents (Classifier, Enricher, Drafter, Validator): claude-haiku-4-5
#        — fast and cost-efficient for focused, single-responsibility tasks.
#      - In this lab, all subagents use claude-sonnet-4-6 for simplicity.
#
#   4. DEFENSIVE JSON PARSING:
#      - LLMs occasionally wrap JSON in markdown fences (```json ... ```)
#      - _parse_json() strips these before calling json.loads()
#      - Always parse defensively; never assume well-formed JSON from an LLM.
# =============================================================================

import json
import os
import re

import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = "claude-sonnet-4-6"


def _parse_json(text: str) -> dict:
    """Strip markdown code fences and parse JSON from LLM output.

    LLMs sometimes return JSON wrapped in ```json ... ``` fences.
    This helper removes them before parsing. In production, you'd also
    handle trailing commas, missing quotes, etc.

    EXAM TIP: "Always strip and parse defensively; gate on parse failure."
    This is listed as a Common Mistake in the lab debrief (Section 5.2).
    """
    cleaned = re.sub(r"```(?:json)?\s*", "", text).strip().rstrip("`")
    return json.loads(cleaned)


# =============================================================================
# SUBAGENT 1: CLASSIFIER
# Input:  raw ticket text (str)
# Output: dict with product_area, severity, intent
# System prompt constrains output to JSON-only with specific enum values.
# =============================================================================
def run_classifier(ticket: str) -> dict:
    """Classify a support ticket into product_area, severity, and intent.

    The system prompt lists all valid enum values for each field, constraining
    Claude's output vocabulary. "Respond only in JSON" prevents narrative text
    that would break downstream parsing.

    EXAM TIP: The classifier is the ONLY subagent that returns structured data
    (dict). All others return strings. This matters for how the coordinator
    passes results downstream.
    """
    response = client.messages.create(
        model=MODEL,
        max_tokens=256,
        system=(
            "Classify the support ticket into product_area, severity, and intent. "
            "product_area is one of: Billing, Platform, Integrations, Security, Onboarding. "
            "severity is one of: P1-Critical, P2-High, P3-Medium, P4-Low. "
            "intent is one of: Bug, Question, Feature Request, Billing Dispute. "
            "Respond only in JSON."
        ),
        messages=[{"role": "user", "content": ticket}],
    )
    return _parse_json(response.content[0].text)


# =============================================================================
# SUBAGENT 2: CRM ENRICHER
# Input:  customer email + classification dict
# Output: dict with account_tier, sla_tier, account_manager, contract_value
#
# HARDCODED for this lab. In production, this would call a CRM API via MCP tool.
# The classification dict is accepted as input so the CRM lookup could vary
# based on severity or product area (e.g., priority routing for P1 tickets).
# =============================================================================
def run_crm_enricher(customer_email: str, classification: dict) -> dict:
    """Simulate a CRM lookup. Returns hardcoded account data.

    In production, this would query Salesforce/HubSpot via an MCP tool.
    Must return at least: account_tier, sla_tier, account_manager, contract_value.

    EXAM TIP: Even though this is hardcoded, the function SIGNATURE matters.
    The coordinator must pass customer_email and classification explicitly —
    the enricher has NO access to the coordinator's local variables.
    """
    return {
        "account_tier": "Gold",
        "sla_tier": "Enterprise",
        "account_manager": "Sarah Chen",
        "contract_value": 125000,
    }


# =============================================================================
# SUBAGENT 3: DRAFTER
# Input:  raw ticket (str), classification (dict), CRM data (dict)
# Output: str (the draft email)
#
# KEY DESIGN: The drafter receives ALL THREE arguments — ticket, classification,
# and CRM data. This is EXPLICIT CONTEXT PASSING. Without classification and
# CRM data, the drafter would hallucinate the product area and SLA tier.
# See subagents_no_context.py → run_drafter(ticket) for this failure mode.
# =============================================================================
def run_drafter(ticket: str, classification: dict, crm: dict) -> str:
    """Draft a professional first-response email using full context.

    The user message composes ALL THREE inputs into a single context string.
    This is the explicit context handoff — each arrow in the pipeline flow:
      Inbound Ticket → Classifier → CRM Enricher → [Drafter] → Validator

    EXAM TIP: "What exact data do you pass to the Drafter, and why not the
    entire conversation history?" → Pass only the specific fields each subagent
    needs. Passing the full message history wastes tokens, leaks irrelevant
    context, and may confuse the subagent.
    """
    response = client.messages.create(
        model=MODEL,
        max_tokens=512,
        system=(
            "Draft a professional first-response email to the customer. "
            "Reference their SLA tier and acknowledge the issue classification. "
            "Be empathetic and provide a clear next step."
        ),
        messages=[
            {
                "role": "user",
                "content": (
                    f"Original ticket:\n{ticket}\n\n"
                    f"Classification:\n{json.dumps(classification, indent=2)}\n\n"
                    f"CRM info:\n{json.dumps(crm, indent=2)}"
                ),
            }
        ],
    )
    return response.content[0].text


# =============================================================================
# SUBAGENT 4: VALIDATOR
# Input:  draft email (str), classification (dict), CRM data (dict)
# Output: str ("APPROVED" or list of issues)
#
# The validator checks the draft against a CONTRACT: does it reference the
# correct product area, match the SLA tier, and maintain professional tone?
# It needs classification + CRM data to have something concrete to validate
# against — without these, it has no ground truth.
# =============================================================================
def run_validator(draft: str, classification: dict, crm: dict) -> str:
    """QA-review the draft email against classification and CRM data.

    Checks: (1) correct product area, (2) SLA tier match, (3) tone.
    Returns "APPROVED" or a list of specific issues.

    EXAM TIP: The Validator never uses tools — it always returns text via
    end_turn. This means stop_reason will always be "end_turn", which
    simplifies the coordinator's handling code (no tool_use loop needed).

    EXAM TIP: SLA tier and account tier are passed in the user message so
    the validator has a CONCRETE CONTRACT to check against, not just the
    draft in isolation.
    """
    response = client.messages.create(
        model=MODEL,
        max_tokens=256,
        system=(
            "You are a QA reviewer. Check the draft email for: "
            "1) correct product area reference, "
            "2) SLA tier match with CRM data, "
            "3) professional and empathetic tone. "
            "Reply APPROVED if all checks pass, or list the specific issues."
        ),
        messages=[
            {
                "role": "user",
                "content": (
                    f"Draft email:\n{draft}\n\n"
                    f"Classification:\n{json.dumps(classification, indent=2)}\n\n"
                    f"Account tier: {crm['account_tier']}\n"
                    f"SLA tier: {crm['sla_tier']}\n"
                    f"Account manager: {crm['account_manager']}\n"
                    f"Contract value: {crm['contract_value']}"
                ),
            }
        ],
    )
    return response.content[0].text
