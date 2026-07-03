# =============================================================================
# subagents_no_context.py — Exercise 2 (S2: Memory Isolation Experiment)
# =============================================================================
# PURPOSE:
#   Modified version of subagents.py where run_drafter receives ONLY the raw
#   ticket text — WITHOUT classification or CRM data. This demonstrates the
#   MEMORY ISOLATION problem: subagents have no shared memory, so without
#   explicit context passing, the drafter HALLUCINATES product area and SLA tier.
#
# CCA-F EXAM CONCEPTS:
#
#   1. MEMORY ISOLATION:
#      - Each subagent is a separate client.messages.create() call.
#      - There is NO shared conversation history between subagents.
#      - The drafter's messages array contains only its OWN system prompt
#        and user message — it has ZERO knowledge of what the classifier
#        or CRM enricher returned.
#
#   2. HALLUCINATION RISK:
#      - When the drafter's system prompt says "Reference their SLA tier"
#        but no SLA tier is provided, Claude will INVENT one.
#      - The draft may say "Enterprise SLA" when the customer is actually
#        on a "Basic" tier — a dangerous error in production.
#      - This is the failure mode that explicit context passing (Ex 3) prevents.
#
#   3. COMPARE WITH subagents.py:
#      - subagents.py:            run_drafter(ticket, classification, crm)
#      - subagents_no_context.py: run_drafter(ticket)  ← MISSING CONTEXT
#      - Run coordinator_no_context.py and compare the draft output with
#        coordinator.py to see the hallucination in action.
#
# EXAM TIP:
#   "Could you pass the entire messages list from the Exercise 1 loop to each
#   subagent instead of structured results?"
#   → You COULD, but: (1) wastes tokens on irrelevant context, (2) higher cost,
#   (3) may confuse the subagent with tool_use history it doesn't need.
#   Pass ONLY the specific fields each subagent needs.
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
    """Strip markdown code fences before parsing JSON (same as subagents.py)."""
    cleaned = re.sub(r"```(?:json)?\s*", "", text).strip().rstrip("`")
    return json.loads(cleaned)


def run_classifier(ticket: str) -> dict:
    """Same as subagents.py — classifier is unchanged."""
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


def run_crm_enricher(customer_email: str, classification: dict) -> dict:
    """Same as subagents.py — CRM enricher is unchanged (hardcoded)."""
    return {
        "account_tier": "Gold",
        "sla_tier": "Enterprise",
        "account_manager": "Sarah Chen",
        "contract_value": 125000,
    }


# =============================================================================
# DELIBERATELY BROKEN: run_drafter only receives the ticket text.
# No classification dict, no CRM dict. The drafter WILL hallucinate
# product area and SLA tier because it has no ground truth to reference.
# =============================================================================
def run_drafter(ticket: str) -> str:
    """Draft a response WITHOUT classification or CRM context.

    This demonstrates the memory isolation failure. The system prompt still
    says "Reference their SLA tier and acknowledge the issue classification"
    but no SLA tier or classification is provided — Claude will make one up.

    COMPARE: subagents.py run_drafter() receives (ticket, classification, crm)
    and composes all three into the user message content.
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
                # ONLY the ticket — no classification, no CRM data
                "content": f"Original ticket:\n{ticket}",
            }
        ],
    )
    return response.content[0].text


def run_validator(draft: str, classification: dict, crm: dict) -> str:
    """Same as subagents.py — validator is unchanged."""
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
