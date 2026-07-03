# =============================================================================
# tools.py — Exercise 1 (S1: Agentic Loop)
# =============================================================================
# PURPOSE:
#   Simulated classification tool that the agentic loop calls via Claude's
#   tool_use mechanism. In production, this would be a real ML classifier or
#   rules engine. Here we use random selection to focus on the TOOL INTERFACE
#   CONTRACT — the function signature and return shape matter more than the
#   classification logic itself.
#
# CCA-F EXAM CONCEPTS:
#   - Tool functions must accept the EXACT arguments declared in the JSON schema
#     (ticket_text: str, fields_needed: list[str])
#   - Return type must match what the agentic loop expects (dict with field values)
#   - The tool is STATELESS — it does not remember previous calls. The agentic
#     loop must manage state by accumulating results across iterations.
#   - Claude decides WHICH fields to request via fields_needed; the tool only
#     returns what was asked for.
# =============================================================================

import random


# Valid values for each classification field.
# These mirror an enterprise ticket taxonomy:
#   product_area: which team/product the ticket relates to
#   severity:     P1 (outage) through P4 (cosmetic) — drives SLA timelines
#   intent:       what the customer is trying to accomplish
FIELD_OPTIONS = {
    "product_area": ["Billing", "Platform", "Integrations", "Security", "Onboarding"],
    "severity": ["P1-Critical", "P2-High", "P3-Medium", "P4-Low"],
    "intent": ["Bug", "Question", "Feature Request", "Billing Dispute"],
}


def classify_ticket(ticket_text: str, fields_needed: list[str]) -> dict:
    """Simulate ticket classification by randomly selecting values.

    Args:
        ticket_text:    Full text of the support ticket (unused in simulation,
                        but required by the tool schema — a real classifier would
                        analyze this).
        fields_needed:  Which fields Claude wants classified. Claude may request
                        all three at once, or one at a time across multiple tool
                        calls — the agentic loop handles both patterns.

    Returns:
        Dict containing only the requested fields. Example:
        {"product_area": "Billing", "severity": "P1-Critical"}

    KEY INSIGHT FOR EXAM:
        The function only returns fields that were REQUESTED and that EXIST in
        FIELD_OPTIONS. This guards against hallucinated field names from Claude.
        If Claude requests "urgency" (not in our vocabulary), it's silently
        skipped — the loop will keep iterating until the three real fields appear.
    """
    return {
        field: random.choice(FIELD_OPTIONS[field])
        for field in fields_needed
        if field in FIELD_OPTIONS
    }
