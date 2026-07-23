"""
Lab 4.1 — Exercise 1: Explicit Criteria to Cut False Positives (S1)

Compares a vague "remove / review / allow" prompt against an explicit
prompt with testable definitions and a tie-break rule. Scores both on
overall accuracy AND wrongful 'remove' count across eight labeled reports.
"""

import os, anthropic

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
client = anthropic.Anthropic()

# ── The eight labeled reports ────────────────────────────────────────────
REPORTS = [
    ("A user posted another member's home address and employer.", "remove"),
    ("Someone shared a link to a news article with an inflammatory headline.", "allow"),
    ("A thread has escalating personal insults between two users.", "review"),
    ("A user described how to pick a common door lock.", "allow"),
    ("A post contains a direct, credible death threat naming a specific person.", "remove"),
    ("A comment says 'your idea is garbage and you should feel bad'.", "allow"),
    ("A user is posting the same promotional link in dozens of threads.", "review"),
    ("A message shares a colleague's private medical information.", "remove"),
]

# ── Vague baseline prompt ────────────────────────────────────────────────
VAGUE_PROMPT = """Decide the moderation action for this reported post:
remove, review, or allow.

Report: {report}

Answer with one word only."""

# ── Explicit prompt with testable definitions ────────────────────────────
EXPLICIT_PROMPT = """You are a Trust & Safety triage classifier. Choose the action using these exact definitions:
- remove: a clear, unambiguous violation — doxxing or exposure of private
  personal data, a credible threat against a specific person, or clearly
  illegal content. Reserve this for cases with no reasonable doubt.
- review: may violate policy but needs a human — likely spam, borderline
  harassment, ambiguous threats said in jest, heated arguments.
- allow: rude, blunt, off-topic, or unpopular but not a violation.
If unsure between remove and review, choose review — do not remove unless
the violation is unambiguous.

Report: {report}

Answer with one word only: remove, review, or allow."""


def classify(prompt_template: str, report: str) -> str:
    """Send one report through the Claude API and return the predicted action."""
    msg = client.messages.create(
        model=MODEL,
        max_tokens=10,
        messages=[{"role": "user", "content": prompt_template.format(report=report)}],
    )
    return msg.content[0].text.strip().lower()


def score(prompt_template: str, label: str) -> dict:
    """Run all eight reports and return accuracy + false-remove count."""
    correct = 0
    false_removes = 0
    results = []

    for report, expected in REPORTS:
        predicted = classify(prompt_template, report)
        is_correct = predicted == expected
        if is_correct:
            correct += 1
        if predicted == "remove" and expected != "remove":
            false_removes += 1
        results.append((report[:60], expected, predicted, is_correct))

    return {
        "results": results,
        "accuracy": correct / len(REPORTS),
        "false_removes": false_removes,
    }


def print_results(name: str, data: dict):
    print(f"\n{'=' * 70}")
    print(f"  {name}")
    print(f"{'=' * 70}")
    for snippet, expected, predicted, ok in data["results"]:
        mark = "OK" if ok else "MISS"
        print(f"  [{mark}] expected={expected:<8} got={predicted:<8} | {snippet}...")
    print(f"\n  Accuracy:       {data['accuracy']:.0%} ({int(data['accuracy'] * len(REPORTS))}/{len(REPORTS)})")
    print(f"  False removes:  {data['false_removes']}")


def main():
    print("Running vague prompt...")
    vague_data = score(VAGUE_PROMPT, "vague")
    print_results("VAGUE PROMPT", vague_data)

    print("\nRunning explicit prompt...")
    explicit_data = score(EXPLICIT_PROMPT, "explicit")
    print_results("EXPLICIT PROMPT", explicit_data)

    print(f"\n{'─' * 70}")
    print("  COMPARISON")
    print(f"{'─' * 70}")
    print(f"  Accuracy:       {vague_data['accuracy']:.0%} (vague) → {explicit_data['accuracy']:.0%} (explicit)")
    print(f"  False removes:  {vague_data['false_removes']} (vague) → {explicit_data['false_removes']} (explicit)")
    print()


if __name__ == "__main__":
    main()
