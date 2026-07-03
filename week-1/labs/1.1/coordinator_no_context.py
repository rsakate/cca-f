# =============================================================================
# coordinator_no_context.py — Exercise 2 (S2: Memory Isolation Experiment)
# =============================================================================
# PURPOSE:
#   Coordinator that uses subagents_no_context.py instead of subagents.py.
#   The key difference: run_drafter(ticket) receives ONLY the ticket text,
#   without classification or CRM data. This proves that subagents have
#   NO shared memory — the drafter hallucinates SLA tier and product area.
#
# CCA-F EXAM CONCEPT:
#   Run this file and compare its STEP 3 (Draft Response) output with
#   coordinator.py's output. Specifically look for:
#   - Does the draft reference the CORRECT product area from the classifier?
#   - Does the draft reference the CORRECT SLA tier from the CRM enricher?
#   - If not, the drafter is hallucinating — this is the memory isolation failure.
#
#   This is the failure mode that EXPLICIT CONTEXT PASSING prevents.
#   The fix: pass classification and CRM dicts to the drafter (as in subagents.py).
# =============================================================================

from subagents_no_context import run_classifier, run_crm_enricher, run_drafter, run_validator

ticket = (
    "Hi, I was charged twice for my last invoice and the payment gateway keeps "
    "throwing a 500 error when I try to view the receipt. Please help!"
)
customer_email = "jane.doe@acmecorp.com"

print("=" * 60)
print("STEP 1: Classification")
print("=" * 60)
classification = run_classifier(ticket)
print(classification)

print("\n" + "=" * 60)
print("STEP 2: CRM Enrichment")
print("=" * 60)
crm = run_crm_enricher(customer_email, classification)
print(crm)

# ---- STEP 3: BROKEN — drafter only gets ticket, not classification/crm ------
# Compare this output with coordinator.py's STEP 3 to see hallucination.
print("\n" + "=" * 60)
print("STEP 3: Draft Response (NO CONTEXT — will hallucinate SLA/product area)")
print("=" * 60)
draft = run_drafter(ticket)  # Missing: classification, crm
print(draft)

print("\n" + "=" * 60)
print("STEP 4: Validation")
print("=" * 60)
validation = run_validator(draft, classification, crm)
print(validation)
