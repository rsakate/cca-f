"""
Lab 4.2 — Exercise 1: Force Structured Output with tool_use + JSON Schema (S3)

Defines EVALUATE_TOOL with an input_schema describing the target record
{name, recommendation, score, reason}, forces tool_choice to the named
tool, and runs it on three candidates. The tool's arguments ARE the
structured object — no prose parsing needed.
"""

import os, json, anthropic

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
client = anthropic.Anthropic()

# ── The tool definition with full input_schema ───────────────────────────
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

# ── Three test candidates ────────────────────────────────────────────────
CANDIDATES = [
    "Alex Park, 10 years backend experience, led a re-architecture of a "
    "payment system serving 2M users, strong system design skills.",
    "Jordan Lee, recent bootcamp graduate, built two personal projects in "
    "React, enthusiastic but no production experience.",
    "Sam Rivera, 4 years as a data analyst, transitioning to engineering, "
    "completed three ML courses, contributed to an open-source ETL tool.",
]


def evaluate(candidate: str) -> dict:
    """Call Claude with the tool schema and return the structured payload."""
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


def main():
    print(f"{'=' * 70}")
    print("  EXERCISE 1 — tool_use + JSON Schema (Structured Output)")
    print(f"{'=' * 70}")

    for i, candidate in enumerate(CANDIDATES, 1):
        payload = evaluate(candidate)
        print(f"\n  Candidate {i}:")
        print(f"  {json.dumps(payload, indent=2)}")

    print()


if __name__ == "__main__":
    main()
