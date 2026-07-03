# =============================================================================
# coordinator.py — Exercise 2 (S2: Coordinator & Subagents)
# =============================================================================
# PURPOSE:
#   First version of the coordinator (hub-and-spoke pattern). Calls all four
#   subagents in sequence: Classifier → CRM Enricher → Drafter → Validator.
#   After each call, prints the subagent name and its output for visibility.
#
# CCA-F EXAM CONCEPTS:
#
#   1. HUB-AND-SPOKE ORCHESTRATION:
#      - This file IS the hub (coordinator). It does NOT call the Claude API
#        itself — it delegates every API call to the subagent functions.
#      - The coordinator owns ALL state: ticket text, classification results,
#        CRM data, draft, and validation result.
#      - Each subagent is stateless and isolated — it only sees what the
#        coordinator explicitly passes as function arguments.
#
#   2. SEQUENTIAL PIPELINE:
#      Classifier → CRM Enricher → Drafter → Validator
#      Each step's output feeds into the next step's input.
#      The coordinator is responsible for wiring these dependencies.
#
#   3. NO CONTEXT OBJECT YET:
#      This version passes raw variables (ticket, classification, crm, draft).
#      Exercise 3 (coordinator_v2.py) introduces a typed TicketContext object
#      to make the state explicit and self-documenting.
#
#   4. MEMORY ISOLATION EXPERIMENT (from lab PDF):
#      If you modify run_drafter to only receive the ticket (removing
#      classification and crm), the draft will hallucinate product area and
#      SLA tier. This proves that subagents have NO memory of previous calls
#      — they only know what you pass them.
# =============================================================================

from subagents import run_classifier, run_crm_enricher, run_drafter, run_validator

# Test ticket — same across all exercises
ticket = (
    "Hi, I was charged twice for my last invoice and the payment gateway keeps "
    "throwing a 500 error when I try to view the receipt. Please help!"
)
customer_email = "jane.doe@acmecorp.com"

# ---- STEP 1: Classification ------------------------------------------------
# The classifier receives ONLY the raw ticket text.
# It returns a dict: {product_area, severity, intent}
print("=" * 60)
print("STEP 1: Classification")
print("=" * 60)
classification = run_classifier(ticket)
print(classification)

# ---- STEP 2: CRM Enrichment ------------------------------------------------
# The enricher receives the customer email AND the classification.
# It returns: {account_tier, sla_tier, account_manager, contract_value}
print("\n" + "=" * 60)
print("STEP 2: CRM Enrichment")
print("=" * 60)
crm = run_crm_enricher(customer_email, classification)
print(crm)

# ---- STEP 3: Draft Response ------------------------------------------------
# The drafter receives ALL upstream context: ticket + classification + CRM.
# This is EXPLICIT CONTEXT PASSING — the drafter doesn't guess or hallucinate.
print("\n" + "=" * 60)
print("STEP 3: Draft Response")
print("=" * 60)
draft = run_drafter(ticket, classification, crm)
print(draft)

# ---- STEP 4: Validation ----------------------------------------------------
# The validator checks the draft AGAINST the classification and CRM data.
# Without these, it would have no ground truth to validate against.
print("\n" + "=" * 60)
print("STEP 4: Validation")
print("=" * 60)
validation = run_validator(draft, classification, crm)
print(validation)
