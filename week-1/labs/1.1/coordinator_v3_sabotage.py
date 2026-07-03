# =============================================================================
# coordinator_v3_sabotage.py — Exercise 4, Step 3 (Prove the Gate Blocks)
# =============================================================================
# PURPOSE:
#   Identical to coordinator_v3.py but with ONE deliberate sabotage line:
#     ctx.severity = None
#   inserted AFTER the classifier populates ctx but BEFORE Gate 1 runs.
#
#   This proves that the programmatic gate catches the missing field and
#   STOPS the pipeline with a clear error — rather than allowing a draft
#   to be generated with incomplete classification data.
#
# CCA-F EXAM CONCEPTS:
#
#   1. WHAT TO OBSERVE WHEN RUNNING:
#      - PipelineGateError is raised immediately at Gate 1
#      - The error message names "severity" as the missing field
#      - Steps 2, 3, and 4 NEVER execute
#      - No hallucinated draft is produced — the pipeline fails safely
#
#   2. WHY THIS MATTERS:
#      Without gates (coordinator.py or coordinator_v2.py), setting
#      ctx.severity = None would NOT stop the pipeline. The drafter would
#      proceed and either hallucinate a severity or ignore it entirely.
#      The validator might catch it, or might not — it's unreliable.
#
#      With gates (coordinator_v3.py), the pipeline STOPS at the exact
#      point of failure and reports exactly what went wrong.
#
#   3. PRODUCTION SCENARIO:
#      This simulates what happens when a classifier API call returns
#      partial data (e.g., network timeout mid-response, model returns
#      only 2 of 3 fields). The gate catches it before any downstream
#      step receives incorrect input.
#
#   EXAM TIP: After running this, run coordinator_v3.py (without sabotage)
#   to confirm the clean pipeline still works end-to-end.
# =============================================================================

from context import TicketContext
from gates import PipelineGateError, gate_classification, gate_draft, gate_enrichment
from subagents import run_classifier, run_crm_enricher, run_drafter, run_validator

ctx = TicketContext(
    ticket_id="TKT-1042",
    raw_ticket=(
        "Hi, I was charged twice for my last invoice and the payment gateway keeps "
        "throwing a 500 error when I try to view the receipt. Please help!"
    ),
    customer_email="jane.doe@acmecorp.com",
)

try:
    print("=" * 60)
    print("STEP 1: Classification")
    print("=" * 60)
    classification = run_classifier(ctx.raw_ticket)
    ctx.product_area = classification["product_area"]
    ctx.severity = classification["severity"]
    ctx.intent = classification["intent"]
    print(classification)

    # =========================================================================
    # SABOTAGE: Simulate a missing classifier field.
    # In production, this could happen if:
    #   - The classifier API timed out mid-response
    #   - The model returned JSON with only 2 of 3 fields
    #   - A parsing error dropped one field
    # The gate below MUST catch this and stop the pipeline.
    # =========================================================================
    ctx.severity = None  # SABOTAGE: simulate a missing classifier field

    # GATE 1: This will FAIL because severity is None
    # Expected output: PipelineGateError naming "severity" as missing
    gate_classification(ctx)
    print("Gate 1 passed")  # This line will NOT execute

    # ---- Steps 2-4 will NEVER execute due to the gate failure above ----------
    print("\n" + "=" * 60)
    print("STEP 2: CRM Enrichment")
    print("=" * 60)
    crm = run_crm_enricher(ctx.customer_email, classification)
    ctx.account_tier = crm["account_tier"]
    ctx.sla_tier = crm["sla_tier"]
    ctx.account_manager = crm["account_manager"]
    print(crm)

    gate_enrichment(ctx)
    print("Gate 2 passed")

    print("\n" + "=" * 60)
    print("STEP 3: Draft Response")
    print("=" * 60)
    draft = run_drafter(ctx.raw_ticket, classification, crm)
    ctx.draft_response = draft
    print(draft)

    gate_draft(ctx)
    print("Gate 3 passed")

    print("\n" + "=" * 60)
    print("STEP 4: Validation")
    print("=" * 60)
    validation = run_validator(ctx.draft_response, classification, crm)
    ctx.validation_result = validation
    print(validation)

    print("\n" + "=" * 60)
    print("FINAL CONTEXT")
    print("=" * 60)
    print(ctx)

except PipelineGateError as e:
    # Gate 1 catches the sabotage and reports the missing field.
    # The pipeline stops here — no incorrect draft is ever generated.
    print(f"\n[PIPELINE BLOCKED] {e}")
