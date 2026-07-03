# =============================================================================
# context.py — Exercise 3 (S3: Explicit Context Passing)
# =============================================================================
# PURPOSE:
#   Defines the TicketContext dataclass — a typed object that carries ALL
#   pipeline state through the coordinator. Replaces the raw variables
#   (ticket, classification, crm, draft) used in coordinator.py with a
#   single, self-documenting object.
#
# CCA-F EXAM CONCEPTS:
#
#   1. WHY A TYPED CONTEXT OBJECT instead of raw dicts/variables?
#      - Self-documenting: fields and types are visible in the class definition
#      - Enforces required fields at CONSTRUCTION TIME (TypeError if missing)
#      - Makes partial-completion state visible (which fields are None vs populated)
#      - In a plain dict, a missing key is discovered at RUNTIME when you access
#        it — possibly much later in the pipeline. A dataclass catches it early.
#
#   2. FIELD GROUPS (structured in pipeline order):
#      Group 1 - REQUIRED at intake (no defaults, no Optional):
#        ticket_id, raw_ticket, customer_email
#        → These MUST be provided at construction. Missing = TypeError immediately.
#
#      Group 2 - Populated by CLASSIFIER (default None):
#        product_area, severity, intent
#        → Optional[str] because they start as None and get filled by the classifier.
#
#      Group 3 - Populated by CRM ENRICHER (default None):
#        account_tier, sla_tier, account_manager
#        → Filled after CRM lookup.
#
#      Group 4 - Populated by DRAFTER and VALIDATOR (default None):
#        draft_response, validation_result
#        → Filled in the final pipeline steps.
#
#   3. HELPER METHODS — used by gates (Exercise 4) to enforce step ordering:
#      - classification_complete() → True only if ALL classifier fields are non-None
#      - enrichment_complete()     → True only if account_tier AND sla_tier are non-None
#      - draft_complete()          → True only if draft_response is non-None
#
#   EXAM TIP: "The dataclass TypeError is raised at construction time. When
#   would a missing key in a plain dict be discovered?" → At access time,
#   possibly deep in the pipeline. Fail-fast at construction is safer for
#   pipelines that run unattended (e.g., overnight batch processing).
# =============================================================================

from dataclasses import dataclass
from typing import Optional


@dataclass
class TicketContext:
    # --- GROUP 1: Required at intake (must be provided, no defaults) ----------
    # Attempting to construct TicketContext without these raises TypeError.
    # This is the "fail loudly at the Python level" behavior the lab emphasizes.
    ticket_id: str
    raw_ticket: str
    customer_email: str

    # --- GROUP 2: Populated by Classifier (default None) ---------------------
    # These start as None and are filled after run_classifier() returns.
    # classification_complete() checks that ALL three are non-None.
    product_area: Optional[str] = None
    severity: Optional[str] = None
    intent: Optional[str] = None

    # --- GROUP 3: Populated by CRM Enricher (default None) -------------------
    # Filled after run_crm_enricher() returns.
    # enrichment_complete() checks account_tier AND sla_tier.
    account_tier: Optional[str] = None
    sla_tier: Optional[str] = None
    account_manager: Optional[str] = None

    # --- GROUP 4: Populated by Drafter and Validator (default None) -----------
    # draft_response is set by run_drafter().
    # validation_result is set by run_validator().
    draft_response: Optional[str] = None
    validation_result: Optional[str] = None

    def classification_complete(self) -> bool:
        """Returns True only if ALL classifier fields are populated.

        Used by gate_classification() in gates.py to block the pipeline
        if the classifier failed to populate any field. Checking all()
        ensures no partial classifications slip through.
        """
        return all(v is not None for v in [self.product_area, self.severity, self.intent])

    def enrichment_complete(self) -> bool:
        """Returns True only if account_tier AND sla_tier are populated.

        Note: account_manager is NOT checked here — it's nice-to-have,
        not required for drafting. Only the fields needed by downstream
        subagents are gated.
        """
        return all(v is not None for v in [self.account_tier, self.sla_tier])

    def draft_complete(self) -> bool:
        """Returns True only if a draft response has been generated.

        The validator needs a draft to check — if draft_response is None,
        the validator would have nothing to validate.
        """
        return self.draft_response is not None
