"""
Lab 4.1 — Exercise 2: Few-Shot Examples to Lock Consistent Output (S2)

Compares a zero-shot instruction (describes the format) against a few-shot
prompt (demonstrates the format with three labeled examples). Scores format
compliance with a strict regex on four test reports.
"""

import os, re, anthropic

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
client = anthropic.Anthropic()

# Strict format regex: ACTION | rationale
FORMAT_RE = re.compile(r"^(REMOVE|REVIEW|ALLOW) \| .+")

# ── Test reports ─────────────────────────────────────────────────────────
TEST_REPORTS = [
    "A user says 'I hope you get fired' during a heated debate about remote work.",
    "A post includes a screenshot of someone's private DMs without consent.",
    "Someone writes a 500-word rant about how pineapple ruins pizza.",
    "A user reports a thread where two people are exchanging racial slurs.",
]

# ── Zero-shot instruction (describes the format but doesn't show it) ─────
ZERO_SHOT_PROMPT = """Decide the moderation action (REMOVE, REVIEW, or ALLOW) and give one
short rationale. Respond in exactly this format: 'ACTION | rationale'.

Report: {report}"""

# ── Few-shot prompt (demonstrates the exact format) ──────────────────────
FEW_SHOT_PROMPT = """Decide the moderation action (REMOVE, REVIEW, or ALLOW) and give one
short rationale. Respond in exactly this format: 'ACTION | rationale'.

Report: A user posted another member's home address and employer.
REMOVE | Doxxing — exposes private personal data with no reasonable doubt.

Report: A member said a popular opinion was "totally wrong and lazy".
ALLOW | Blunt criticism of an idea, not a policy violation.

Report: A thread has escalating personal insults between two users.
REVIEW | Possible harassment that needs a human judgment call.

Report: {report}"""


def classify(prompt_template: str, report: str) -> str:
    """Send one report and return the raw model output."""
    msg = client.messages.create(
        model=MODEL,
        max_tokens=60,
        messages=[{"role": "user", "content": prompt_template.format(report=report)}],
    )
    return msg.content[0].text.strip()


def score_format(prompt_template: str, label: str) -> dict:
    """Run all test reports and score format compliance."""
    results = []
    compliant = 0

    for report in TEST_REPORTS:
        output = classify(prompt_template, report)
        matches = bool(FORMAT_RE.match(output))
        if matches:
            compliant += 1
        results.append((report[:60], output, matches))

    return {
        "results": results,
        "compliance": compliant / len(TEST_REPORTS),
        "compliant_count": compliant,
    }


def print_results(name: str, data: dict):
    print(f"\n{'=' * 70}")
    print(f"  {name}")
    print(f"{'=' * 70}")
    for snippet, output, ok in data["results"]:
        mark = "FORMAT OK" if ok else "FORMAT FAIL"
        print(f"  [{mark}]")
        print(f"    Report:  {snippet}...")
        print(f"    Output:  {output}")
    print(f"\n  Format compliance: {data['compliance']:.0%} ({data['compliant_count']}/{len(TEST_REPORTS)})")


def main():
    print("Running zero-shot prompt...")
    zero_data = score_format(ZERO_SHOT_PROMPT, "zero-shot")
    print_results("ZERO-SHOT (instruction only)", zero_data)

    print("\nRunning few-shot prompt...")
    few_data = score_format(FEW_SHOT_PROMPT, "few-shot")
    print_results("FEW-SHOT (3 labeled examples)", few_data)

    print(f"\n{'─' * 70}")
    print("  COMPARISON")
    print(f"{'─' * 70}")
    print(f"  Format compliance: {zero_data['compliance']:.0%} (zero-shot) → {few_data['compliance']:.0%} (few-shot)")
    print()


if __name__ == "__main__":
    main()
