"""
agents.py — The StageResult dataclass and three subagents (Demo 1, S3)

Every subagent MUST return a StageResult and MUST NOT raise.
The coordinator inspects result.ok and decides how to react — log,
retry, escalate — but it always knows what happened and why.

Pipeline: INTAKE -> VALIDATION -> ADJUDICATION

  - run_intake   calls Claude to extract structured fields (the only
                  stage that calls the API; has a bare except Exception)
  - run_validation  checks policy rules; deterministic Python
  - run_adjudication  makes the approve/hold/deny decision; deterministic
"""

import json
import os

from dataclasses import dataclass, asdict
from typing import Any

from dotenv import load_dotenv
import anthropic

from sample_claims import COVERED_PROCEDURES

load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME", "claude-sonnet-4-5")

_client = anthropic.Anthropic()

INTAKE_SYSTEM = (
    "You are a claims intake agent. Extract structured fields from the "
    "raw claim and return ONLY a JSON object with these keys: "
    "claim_id, member_id, procedure_code, diagnosis, amount, "
    "date_of_service. No extra text."
)


@dataclass
class StageResult:
    """Envelope every subagent must return.  Failures are first-class."""
    stage: str
    ok: bool
    data: Any = None
    error: str | None = None

    def to_dict(self) -> dict:
        return asdict(self)


# ---------------------------------------------------------------------------
# Stage 1: Intake — call Claude, catch everything, return a StageResult
# ---------------------------------------------------------------------------
def run_intake(claim: dict) -> StageResult:
    """Call Claude to produce a clean structured summary of the claim."""
    try:
        response = _client.messages.create(
            model=MODEL_NAME, max_tokens=400, system=INTAKE_SYSTEM,
            messages=[{"role": "user", "content": json.dumps(claim)}],
        )
        text = "".join(b.text for b in response.content if b.type == "text").strip()
        if text.startswith("```"):
            text = text.strip("`").strip()
            if text.startswith("json"):
                text = text[4:].strip()
        parsed = json.loads(text)
        return StageResult(stage="intake", ok=True, data=parsed)
    except Exception as exc:
        return StageResult(stage="intake", ok=False,
                           error=f"{type(exc).__name__}: {exc}")


# ---------------------------------------------------------------------------
# Stage 2: Validation — deterministic policy checks
# ---------------------------------------------------------------------------
def run_validation(claim: dict) -> StageResult:
    """Check policy rules.  Fail fast and loudly."""
    if not claim.get("member_active", False):
        return StageResult(stage="validation", ok=False,
                           error="member_not_active")
    if claim.get("procedure_code") not in COVERED_PROCEDURES:
        return StageResult(stage="validation", ok=False,
                           error=f"procedure_not_covered:{claim.get('procedure_code')}")
    return StageResult(stage="validation", ok=True, data={"checks_passed": True})


# ---------------------------------------------------------------------------
# Stage 3: Adjudication — deterministic decision
# ---------------------------------------------------------------------------
def run_adjudication(claim: dict) -> StageResult:
    """Decide: approve, hold-for-review, or deny based on amount."""
    amount = claim.get("amount", 0)
    if amount <= 100:
        decision = "approve"
    elif amount <= 500:
        decision = "hold_for_review"
    else:
        decision = "deny"
    return StageResult(
        stage="adjudication", ok=True,
        data={"decision": decision, "amount": amount},
    )
