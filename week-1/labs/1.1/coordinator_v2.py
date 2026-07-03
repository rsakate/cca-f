# =============================================================================
# coordinator_v2.py — Exercise 3 (S3: Explicit Context Passing)
# =============================================================================
# PURPOSE:
#   Refactored coordinator that uses TicketContext (from context.py) to carry
#   ALL pipeline state in a single typed object. Replaces the raw variables
#   from coordinator.py with structured, self-documenting state management.
#
# CCA-F EXAM CONCEPTS:
#
#   1. TYPED CONTEXT vs. RAW VARIABLES:
#      coordinator.py:    classification = run_classifier(ticket)
#      coordinator_v2.py: ctx.product_area = classification["product_area"]
#
#      The v2 approach writes results back into ctx fields, making it explicit
#      which fields are populated at each pipeline stage.
#
#   2. PASS SPECIFIC FIELDS, NOT THE ENTIRE CTX:
#      Each subagent receives ONLY the fields it needs:
#      - run_classifier(ctx.raw_ticket)         → just the ticket text
#      - run_crm_enricher(ctx.customer_email, classification) → email + classification
#      - run_drafter(ctx.raw_ticket, classification, crm)     → ticket + classification + CRM
#      Do NOT pass the entire ctx object — subagents don't need all fields.
#
#   3. COMPLETION CHECKS:
#      After each step, we print ctx.classification_complete(), etc.
#      These booleans are the foundation for Exercise 4's programmatic gates.
#
#   4. FINAL CONTEXT:
#      At the end, printing the full ctx object shows all populated fields —
#      a complete audit trail of what happened in the pipeline.
#
#   EXAM TIP: "The helper methods (classification_complete, enrichment_complete,
#   draft_complete) return bool. How will you use these in Exercise 4?"
#   → They become the preconditions for gate functions. If a helper returns
#   False, the gate raises PipelineGateError and blocks the pipeline.
# =============================================================================

from context import TicketContext
from subagents import run_classifier, run_crm_enricher, run_drafter, run_validator

# ---- Construct the context object -------------------------------------------
# ticket_id, raw_ticket, and customer_email are REQUIRED (no defaults).
# Omitting any of these raises TypeError immediately at construction time.
# This is the "fail loudly at the Python level" the lab emphasizes.
ctx = TicketContext(
    ticket_id="TKT-1042",
    raw_ticket=(
        "Hi, I was charged twice for my last invoice and the payment gateway keeps "
        "throwing a 500 error when I try to view the receipt. Please help!"
    ),
    customer_email="jane.doe@acmecorp.com",
)

# ---- STEP 1: Classification ------------------------------------------------
# Pass only ctx.raw_ticket to the classifier.
# Write results BACK INTO ctx so the state is centralized.
print("=" * 60)
print("STEP 1: Classification")
print("=" * 60)
classification = run_classifier(ctx.raw_ticket)
ctx.product_area = classification["product_area"]
ctx.severity = classification["severity"]
ctx.intent = classification["intent"]
print(classification)
print(f"classification_complete: {ctx.classification_complete()}")

# ---- STEP 2: CRM Enrichment ------------------------------------------------
# Pass ctx.customer_email (from ctx) + classification dict to enricher.
# Write CRM results back into ctx.
print("\n" + "=" * 60)
print("STEP 2: CRM Enrichment")
print("=" * 60)
crm = run_crm_enricher(ctx.customer_email, classification)
ctx.account_tier = crm["account_tier"]
ctx.sla_tier = crm["sla_tier"]
ctx.account_manager = crm["account_manager"]
print(crm)
print(f"enrichment_complete: {ctx.enrichment_complete()}")

# ---- STEP 3: Draft Response ------------------------------------------------
# Pass ticket + classification + CRM — all the context the drafter needs.
# Write the draft back into ctx.draft_response.
print("\n" + "=" * 60)
print("STEP 3: Draft Response")
print("=" * 60)
draft = run_drafter(ctx.raw_ticket, classification, crm)
ctx.draft_response = draft
print(draft)
print(f"draft_complete: {ctx.draft_complete()}")

# ---- STEP 4: Validation ----------------------------------------------------
# Pass the draft + classification + CRM for ground-truth validation.
# Write the validation result back into ctx.
print("\n" + "=" * 60)
print("STEP 4: Validation")
print("=" * 60)
validation = run_validator(ctx.draft_response, classification, crm)
ctx.validation_result = validation
print(validation)

# ---- FINAL CONTEXT ----------------------------------------------------------
# Print the complete ctx object — all fields should be populated.
# This is the full audit trail of the pipeline execution.
print("\n" + "=" * 60)
print("FINAL CONTEXT")
print("=" * 60)
print(ctx)
