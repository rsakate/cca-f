# =============================================================================
# gates.py — Exercise 4 (S4: Programmatic Step Enforcement)
# =============================================================================
# PURPOSE:
#   Defines programmatic GATE FUNCTIONS that enforce step ordering in the
#   pipeline. Each gate checks a precondition before allowing the next step
#   to execute. If the precondition fails, a PipelineGateError is raised
#   with an INFORMATIVE error message naming the specific missing fields.
#
# CCA-F EXAM CONCEPTS:
#
#   1. PROMPT RULE vs. PROGRAMMATIC GATE:
#      Prompt rule: "Don't draft until you have classified."
#        → Advice the model CAN IGNORE under token pressure, ambiguous input,
#          or model drift. Works most of the time, fails silently.
#
#      Programmatic gate: if not ctx.classification_complete(): raise PipelineGateError(...)
#        → A HARD STOP enforced by the Python runtime. Cannot be ignored.
#          If the gate fails, the pipeline STOPS with a clear, named error.
#
#      EXAM TIP: "Use gates for ordering in any pipeline where wrong-order
#      execution produces incorrect data rather than an obvious crash."
#
#   2. WHY NAMED EXCEPTIONS instead of bare assert statements?
#      - PipelineGateError names the MISSING FIELDS in its message
#      - A bare assert gives: "AssertionError" — no context on what failed
#      - Named exceptions can be caught selectively (try/except PipelineGateError)
#      - The error message instructs the caller what to DO (rerun the Classifier)
#      - In production, named exceptions enable retry logic, alerting, and metrics
#
#   3. GATE DESIGN PRINCIPLES:
#      - Each gate returns None on success (pipeline continues)
#      - Each gate raises PipelineGateError on failure (pipeline stops)
#      - Error messages are ACTIONABLE: they name missing fields AND say
#        which step to rerun
#
#   4. PARTIAL DATA HANDLING (gate_enrichment):
#      Gate 2 checks for PARTIAL CRM data — account_tier present but sla_tier
#      missing. Partial data is UNSAFE because the drafter would reference an
#      incomplete picture. The gate explicitly calls out which fields are
#      present vs. missing, so the operator knows the exact state.
#
#   EXAM TIP: "In a production system, should a gate failure automatically
#   retry the failed step, or immediately alert a human?"
#   → Depends on the failure mode. Classifier timeout → retry. CRM API down
#   → alert. The gate gives you a clear signal to build either path.
# =============================================================================


class PipelineGateError(Exception):
    """Raised when a pipeline precondition is not met.

    Using a named exception (not bare assert) provides:
    - Selective catching: except PipelineGateError vs. except Exception
    - Descriptive messages naming specific missing fields
    - Clear separation from programming errors (TypeError, ValueError)
    """
    pass


def gate_classification(ctx):
    """Gate 1: Block pipeline if classification is incomplete.

    Checks: product_area, severity, intent — ALL must be non-None.
    If any are missing, raises PipelineGateError naming the specific fields.

    Called AFTER Step 1 (Classifier) and BEFORE Step 2 (CRM Enricher).
    """
    missing = []
    if ctx.product_area is None:
        missing.append("product_area")
    if ctx.severity is None:
        missing.append("severity")
    if ctx.intent is None:
        missing.append("intent")
    if missing:
        raise PipelineGateError(
            f"Classification incomplete — missing fields: {', '.join(missing)}. "
            f"Rerun the Classifier before proceeding."
        )


def gate_enrichment(ctx):
    """Gate 2: Block pipeline if CRM enrichment is incomplete or partial.

    Checks: account_tier AND sla_tier must both be non-None.

    SPECIAL CASE — Partial data:
    If account_tier is present but sla_tier is None (or vice versa), the
    error message explicitly says "partial data" and lists both present
    and missing fields. Partial CRM data is UNSAFE for drafting — the
    drafter would produce a response referencing incomplete account info.

    Called AFTER Step 2 (CRM Enricher) and BEFORE Step 3 (Drafter).
    """
    missing = []
    if ctx.account_tier is None:
        missing.append("account_tier")
    if ctx.sla_tier is None:
        missing.append("sla_tier")
    # Detect partial data — some fields present, some missing
    present = [f for f in ["account_tier", "sla_tier"] if f not in missing]
    if missing and present:
        raise PipelineGateError(
            f"CRM enrichment returned partial data — present: {', '.join(present)}; "
            f"missing: {', '.join(missing)}. "
            f"Partial CRM data is unsafe for drafting. Rerun the CRM Enricher."
        )
    if missing:
        raise PipelineGateError(
            f"CRM enrichment incomplete — missing fields: {', '.join(missing)}. "
            f"Rerun the CRM Enricher before proceeding."
        )


def gate_draft(ctx):
    """Gate 3: Block pipeline if draft has not been generated.

    Checks: draft_response must be non-None.
    The validator needs a draft to check — without one, validation is meaningless.

    Called AFTER Step 3 (Drafter) and BEFORE Step 4 (Validator).
    """
    if ctx.draft_response is None:
        raise PipelineGateError(
            f"Draft incomplete — draft_response is None. "
            f"Rerun the Drafter before proceeding."
        )
