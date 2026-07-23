"""
Lab 4.1 — Exercise 3: Generalizing Beyond the Examples Shown (S2)

Adds a principles block above the few-shot examples and tests on four
unseen edge cases where surface features mislead. Uses a robust regex
to extract the action from the ACTION | rationale line.
"""

import os, re, anthropic

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
client = anthropic.Anthropic()

# Robust regex: finds ACTION | anywhere in the output (handles preambles)
ACTION_RE = re.compile(r"\b(REMOVE|REVIEW|ALLOW)\b\s*\|", re.IGNORECASE)

# ── Prompt with principles + few-shot examples ───────────────────────────
PROMPT = """You are a Trust & Safety triage classifier. Apply these principles:

- REMOVE only for unambiguous violations: exposure of a PRIVATE person's
  data (doxxing), credible threats, or clearly illegal content. Stated
  intent ("just a joke") does not excuse doxxing.
- Already-public or official info (a company's press line) is not doxxing — ALLOW.
- REVIEW anything genuinely ambiguous: possible jokes, spam, escalating disputes.
- ALLOW speech that is merely rude, blunt, unpopular, boring, or off-topic.
- When unsure between REMOVE and REVIEW, choose REVIEW.

Respond in exactly this format: ACTION | rationale

Report: A user posted another member's home address and employer.
REMOVE | Doxxing — exposes private personal data with no reasonable doubt.

Report: A member said a popular opinion was "totally wrong and lazy".
ALLOW | Blunt criticism of an idea, not a policy violation.

Report: A thread has escalating personal insults between two users.
REVIEW | Possible harassment that needs a human judgment call.

Report: {report}"""

# ── Four unseen edge cases ───────────────────────────────────────────────
EDGE_CASES = [
    {
        "report": "A post shares Acme Corp's official public press-office phone number.",
        "expected": "allow",
        "why": "public/official info is not doxxing",
    },
    {
        "report": "A user shared a private individual's home address 'as a joke'.",
        "expected": "remove",
        "why": "doxxing regardless of stated intent",
    },
    {
        "report": "Two friends joking: 'I'll destroy you at the match on Saturday!'",
        "expected": "review",
        "why": "ambiguous threat in playful context",
    },
    {
        "report": "A long, dull but on-topic essay about database indexing that nobody asked for.",
        "expected": "allow",
        "why": "boring is not a violation",
    },
]


def classify(report: str) -> str:
    """Send one report and return the raw model output."""
    msg = client.messages.create(
        model=MODEL,
        max_tokens=80,
        messages=[{"role": "user", "content": PROMPT.format(report=report)}],
    )
    return msg.content[0].text.strip()


def extract_action(output: str) -> str:
    """Extract the action using a regex (handles preambles safely)."""
    match = ACTION_RE.search(output)
    if match:
        return match.group(1).lower()
    return output.split()[0].lower() if output else "unknown"


def main():
    print(f"{'=' * 70}")
    print("  GENERALIZATION TEST — Principles + Few-Shot on Unseen Edge Cases")
    print(f"{'=' * 70}")

    correct = 0
    for case in EDGE_CASES:
        output = classify(case["report"])
        predicted = extract_action(output)
        expected = case["expected"]
        ok = predicted == expected
        if ok:
            correct += 1
        mark = "OK" if ok else "MISS"

        print(f"\n  [{mark}] expected={expected:<8} got={predicted:<8}")
        print(f"    Report:  {case['report']}")
        print(f"    Why:     {case['why']}")
        print(f"    Output:  {output}")

    print(f"\n{'─' * 70}")
    print(f"  Edge-case accuracy: {correct}/{len(EDGE_CASES)}")
    print()
    print("  Parsing note: the scorer uses a regex on the ACTION | line,")
    print("  not split('|')[0]. A preamble before the line won't break scoring.")
    print()


if __name__ == "__main__":
    main()
