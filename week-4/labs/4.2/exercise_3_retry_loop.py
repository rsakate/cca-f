"""
Lab 4.2 — Exercise 3: Retry-and-Feedback Loop That Self-Corrects (S4)

Wraps the tool call + validate() in a retry loop. On validation failure,
appends the assistant's turn and a tool_result with is_error=True carrying
the error string, so the model sees what went wrong and corrects itself.
Capped at max_attempts to guarantee termination.

Run with --demo for an offline simulation (no API key needed).
"""

import os, sys, json, anthropic

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
RECS = {"strong_hire", "hire", "no_hire"}
MAX_ATTEMPTS = 3

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

CANDIDATE = (
    "Alex Park, 10 years backend experience, led a re-architecture of a "
    "payment system serving 2M users, strong system design skills."
)


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

    if rec == "strong_hire" and is_int and score < 8:
        errors.append("a 'strong_hire' must score >= 8")
    if rec == "no_hire" and is_int and score > 4:
        errors.append("a 'no_hire' must score <= 4")

    return (len(errors) == 0), errors


# ── Retry loop (live) ────────────────────────────────────────────────────
def assess_with_retry(candidate: str, max_attempts: int = MAX_ATTEMPTS):
    """Loop up to max_attempts, feeding validation errors back via tool_result."""
    client = anthropic.Anthropic()
    user_prompt = f"Evaluate this candidate:\n{candidate}"
    messages = [{"role": "user", "content": user_prompt}]

    last_payload = {}
    last_errors = []

    for attempt in range(1, max_attempts + 1):
        resp = client.messages.create(
            model=MODEL,
            max_tokens=300,
            tools=[EVALUATE_TOOL],
            tool_choice={"type": "tool", "name": "record_evaluation"},
            messages=messages,
        )

        tool_use = next((b for b in resp.content if b.type == "tool_use"), None)
        if tool_use is None:
            print(f"  attempt {attempt}: no tool_use block found")
            break

        payload = tool_use.input
        ok, errors = validate(payload)
        last_payload = payload
        last_errors = errors

        if ok:
            print(f"  attempt {attempt}: valid")
            return payload, []

        print(f"  attempt {attempt}: invalid -> {errors}")

        # Feed the error back
        messages.append({"role": "assistant", "content": resp.content})
        messages.append({
            "role": "user",
            "content": [{
                "type": "tool_result",
                "tool_use_id": tool_use.id,
                "is_error": True,
                "content": (
                    "Validation failed: " + "; ".join(errors) +
                    ". Call record_evaluation again with corrected values."
                ),
            }],
        })

    return last_payload, last_errors


# ── Demo mode (offline simulation) ───────────────────────────────────────
def run_demo():
    """Simulate two attempts: attempt 1 fails policy, attempt 2 passes."""
    print(f"{'=' * 70}")
    print("  DEMO MODE — offline retry simulation (no API calls)")
    print(f"{'=' * 70}")

    # Attempt 1: strong_hire with score 5 (policy violation)
    attempt_1 = {"name": "Alex Park", "recommendation": "strong_hire", "score": 5, "reason": "Good experience."}
    ok, errors = validate(attempt_1)
    print(f"\n  attempt 1: invalid -> {errors}")
    print(f"  payload: {json.dumps(attempt_1)}")

    error_msg = (
        "Validation failed: " + "; ".join(errors) +
        ". Call record_evaluation again with corrected values."
    )
    print(f"\n  tool_result (is_error=True):")
    print(f"    {error_msg}")

    # Attempt 2: corrected — score raised to 9
    attempt_2 = {"name": "Alex Park", "recommendation": "strong_hire", "score": 9, "reason": "Strong system design skills."}
    ok, errors = validate(attempt_2)
    print(f"\n  attempt 2: valid")
    print(f"  payload: {json.dumps(attempt_2)}")
    print()


# ── Live mode ────────────────────────────────────────────────────────────
def run_live():
    print(f"{'=' * 70}")
    print("  LIVE RUN — retry loop with tool_result feedback")
    print(f"{'=' * 70}\n")

    payload, errors = assess_with_retry(CANDIDATE)

    print(f"\n  Final payload: {json.dumps(payload, indent=2)}")
    if errors:
        print(f"  Remaining errors (cap reached): {errors}")
    print()


def main():
    if "--demo" in sys.argv:
        run_demo()
    else:
        run_live()


if __name__ == "__main__":
    main()
