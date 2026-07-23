"""
Lab 4.2 — Exercise 2: Schema + Semantic Validation (S4)

Implements validate(payload) -> (ok: bool, errors: list[str]) that checks
basic shape (type, range, enum) AND cross-field policy rules the JSON
Schema cannot express (strong_hire => score >= 8, no_hire => score <= 4).

Run with --check for offline validation against three fixtures (no API key
needed), or without flags for a live run on real model output.
"""

import os, sys, json, anthropic

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
RECS = {"strong_hire", "hire", "no_hire"}

EVALUATE_TOOL = {
    "name": "record_evaluation",
    "description": "Record a structured screening evaluation for one job candidate.",
    "input_schema": {
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "Candidate name."},
            "recommendation": {
                "type": "string",
                "enum": ["strong_hire", "hire", "no_hire"],
                "description": "Screening recommendation.",
            },
            "score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 10,
                "description": "Overall fit, 0 (poor) to 10 (excellent).",
            },
            "reason": {"type": "string", "description": "One-sentence justification."},
        },
        "required": ["name", "recommendation", "score", "reason"],
    },
}

CANDIDATES = [
    "Alex Park, 10 years backend experience, led a re-architecture of a "
    "payment system serving 2M users, strong system design skills.",
    "Jordan Lee, recent bootcamp graduate, built two personal projects in "
    "React, enthusiastic but no production experience.",
    "Sam Rivera, 4 years as a data analyst, transitioning to engineering, "
    "completed three ML courses, contributed to an open-source ETL tool.",
]


# ── Validator ────────────────────────────────────────────────────────────
def validate(payload):
    """Return (ok: bool, errors: list[str])."""
    errors = []

    if not isinstance(payload, dict):
        return False, ["payload is not an object"]

    name = payload.get("name")
    if not isinstance(name, str) or not name.strip():
        errors.append("name must be a non-empty string")

    rec = payload.get("recommendation")
    if rec not in RECS:
        errors.append(f"recommendation must be one of {sorted(RECS)}")

    score = payload.get("score")
    is_int = isinstance(score, int) and not isinstance(score, bool)
    if not is_int:
        errors.append("score must be an integer")
    elif not (0 <= score <= 10):
        errors.append("score must be between 0 and 10")

    reason = payload.get("reason")
    if not isinstance(reason, str) or not reason.strip():
        errors.append("reason must be a non-empty string")

    # Cross-field policy rules
    if rec == "strong_hire" and is_int and score < 8:
        errors.append("a 'strong_hire' must score >= 8")
    if rec == "no_hire" and is_int and score > 4:
        errors.append("a 'no_hire' must score <= 4")

    return (len(errors) == 0), errors


# ── Offline check mode ───────────────────────────────────────────────────
def run_check():
    """Three fixtures: good record, bad shape, policy violation."""
    print(f"{'=' * 70}")
    print("  OFFLINE CHECK — three test fixtures")
    print(f"{'=' * 70}")

    # Fixture 1: valid record
    good = {"name": "Alex Park", "recommendation": "strong_hire", "score": 9, "reason": "Excellent fit."}
    ok, errs = validate(good)
    assert ok and not errs, f"Fixture 1 (good) failed: {errs}"
    print(f"\n  Fixture 1 (good record):    valid: {ok}  errors: {errs}")

    # Fixture 2: structurally bad (empty name, invalid enum, score out of range)
    bad = {"name": "", "recommendation": "maybe", "score": 15, "reason": ""}
    ok, errs = validate(bad)
    assert not ok and len(errs) >= 3, f"Fixture 2 (bad) failed: ok={ok}, errors={errs}"
    print(f"  Fixture 2 (bad shape):      valid: {ok}  errors: {errs}")

    # Fixture 3: structurally valid but policy-violating (strong_hire with score 4)
    policy = {"name": "Sam Rivera", "recommendation": "strong_hire", "score": 4, "reason": "Promising."}
    ok, errs = validate(policy)
    assert not ok and "strong_hire" in errs[0], f"Fixture 3 (policy) failed: ok={ok}, errors={errs}"
    print(f"  Fixture 3 (policy breach):  valid: {ok}  errors: {errs}")

    print(f"\n  All 3 assertions passed!")
    print()


# ── Live mode ────────────────────────────────────────────────────────────
def evaluate(candidate: str) -> dict:
    client = anthropic.Anthropic()
    msg = client.messages.create(
        model=MODEL,
        max_tokens=300,
        tools=[EVALUATE_TOOL],
        tool_choice={"type": "tool", "name": "record_evaluation"},
        messages=[{"role": "user", "content": f"Evaluate this candidate:\n{candidate}"}],
    )
    for block in msg.content:
        if block.type == "tool_use":
            return block.input
    return {}


def run_live():
    print(f"{'=' * 70}")
    print("  LIVE RUN — tool_use + validate()")
    print(f"{'=' * 70}")

    for i, candidate in enumerate(CANDIDATES, 1):
        payload = evaluate(candidate)
        ok, errs = validate(payload)
        status = "valid" if ok else f"invalid -> {errs}"
        print(f"\n  Candidate {i}: {status}")
        print(f"  {json.dumps(payload, indent=2)}")

    print()


def main():
    if "--check" in sys.argv:
        run_check()
    else:
        run_live()


if __name__ == "__main__":
    main()
