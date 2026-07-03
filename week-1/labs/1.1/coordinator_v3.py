# =============================================================================
# coordinator_v3.py — Exercise 4 (S4: Programmatic Step Enforcement)
# =============================================================================
# PURPOSE:
#   Final coordinator with ALL THREE programmatic gates wired between steps.
#   The pipeline is wrapped in try/except PipelineGateError so any gate failure
#   produces a clear [PIPELINE BLOCKED] message instead of a silent wrong output.
#
# CCA-F EXAM CONCEPTS:
#
#   1. GATE PLACEMENT — gates go BETWEEN steps, not inside them:
#      Step 1 (Classify) → gate_classification(ctx) → Step 2 (Enrich)
#      Step 2 (Enrich)   → gate_enrichment(ctx)     → Step 3 (Draft)
#      Step 3 (Draft)    → gate_draft(ctx)           → Step 4 (Validate)
#
#   2. TRY/EXCEPT PATTERN:
#      The entire pipeline is wrapped in try/except PipelineGateError.
#      If ANY gate fails, execution jumps to the except block and prints
#      a clear error message. Steps AFTER the failed gate never execute.
#
#   3. GATE CONFIRMATION:
#      After each gate passes, we print "Gate N passed" for visibility.
#      In production, this would be a structured log or metric.
#
#   4. COMPARISON WITH coordinator_v2.py:
#      v2 has the same pipeline but NO gates. If the classifier returns
#      incomplete data, v2 continues to the drafter with partial context.
#      v3 STOPS at gate_classification and reports the missing fields.
#
#   EXAM TIP: "Your team lead says: Just put DO NOT DRAFT BEFORE CLASSIFYING
#   in the system prompt — that's the same as a gate. How do you respond?"
#   → A prompt instruction is advice the model can ignore under pressure.
#   A gate is enforced by the Python runtime — it CANNOT be skipped.
#   Use gates when wrong-order execution produces incorrect data.
#
# SEE ALSO: coordinator_v3_sabotage.py — deliberately triggers Gate 1
#           to prove the gate blocks.
# =============================================================================

from context import TicketContext
from gates import PipelineGateError, gate_classification, gate_draft, gate_enrichment
from subagents import run_classifier, run_crm_enricher, run_drafter, run_validator

# Construct context with required fields
ctx = TicketContext(
    ticket_id="TKT-1042",
    raw_ticket=(
        "Hi, I was charged twice for my last invoice and the payment gateway keeps "
        "throwing a 500 error when I try to view the receipt. Please help!"
    ),
    customer_email="jane.doe@acmecorp.com",
)

# =============================================================================
# PIPELINE WITH GATES
# Wrapped in try/except so any PipelineGateError stops execution cleanly.
# =============================================================================
try:
    # ---- STEP 1: Classification ---------------------------------------------
    print("=" * 60)
    print("STEP 1: Classification")
    print("=" * 60)
    classification = run_classifier(ctx.raw_ticket)
    ctx.product_area = classification["product_area"]
    ctx.severity = classification["severity"]
    ctx.intent = classification["intent"]
    print(classification)

    # GATE 1: All classifier fields must be populated before enrichment
    gate_classification(ctx)
    print("Gate 1 passed")

    # ---- STEP 2: CRM Enrichment ---------------------------------------------
    print("\n" + "=" * 60)
    print("STEP 2: CRM Enrichment")
    print("=" * 60)
    crm = run_crm_enricher(ctx.customer_email, classification)
    ctx.account_tier = crm["account_tier"]
    ctx.sla_tier = crm["sla_tier"]
    ctx.account_manager = crm["account_manager"]
    print(crm)

    # GATE 2: CRM data must be complete (no partial data) before drafting
    gate_enrichment(ctx)
    print("Gate 2 passed")

    # ---- STEP 3: Draft Response ---------------------------------------------
    print("\n" + "=" * 60)
    print("STEP 3: Draft Response")
    print("=" * 60)
    draft = run_drafter(ctx.raw_ticket, classification, crm)
    ctx.draft_response = draft
    print(draft)

    # GATE 3: Draft must exist before validation
    gate_draft(ctx)
    print("Gate 3 passed")

    # ---- STEP 4: Validation -------------------------------------------------
    print("\n" + "=" * 60)
    print("STEP 4: Validation")
    print("=" * 60)
    validation = run_validator(ctx.draft_response, classification, crm)
    ctx.validation_result = validation
    print(validation)

    # ---- FINAL CONTEXT ------------------------------------------------------
    print("\n" + "=" * 60)
    print("FINAL CONTEXT")
    print("=" * 60)
    print(ctx)

except PipelineGateError as e:
    # Any gate failure lands here with a descriptive error message.
    # Steps AFTER the failed gate never execute.
    print(f"\n[PIPELINE BLOCKED] {e}")
