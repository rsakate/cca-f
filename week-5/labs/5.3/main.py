"""
Lab 5.3 — Trust & Traceability: Human Review, Confidence & Provenance

Scenario: An AI Compliance Reviewer for Quarterly Financial Reports

This lab builds a command-line compliance reviewer that scans a quarterly
financial report and produces findings a compliance officer will act on —
and makes each finding trustworthy three ways:

  Demo 1 (S5) — Confidence calibration & routing
      Score each finding 0..1; route by a threshold to auto-clear or
      human review.

  Demo 2 (S6) — Provenance
      Attach the exact source line + quote locally to every finding.

  Demo 3 (S5+S6) — Confirmed vs. contested
      Run two passes; confirm on agreement, contest on disagreement.

Run:  python main.py
"""

from sample_report import get_numbered_report
from reviewer import review
from confidence import bucket, CONFIDENCE_THRESHOLD


def print_findings(label: str, findings: list[dict]) -> None:
    """Pretty-print a bucket of findings."""
    print(f"\n{'─' * 60}")
    print(f"  {label}  ({len(findings)} finding(s))")
    print(f"{'─' * 60}")
    if not findings:
        print("  (none)")
        return
    for f in findings:
        line = f.get("line", "?")
        quote = f.get("quote", "")
        conf = f.get("confidence_avg", f.get("confidence", "?"))
        flag_a = f.get("flag_pass_a", f.get("flag", ""))
        flag_b = f.get("flag_pass_b", "")
        print(f"  Line {line}: \"{quote}\"")
        print(f"    Pass A flag: {flag_a}")
        print(f"    Pass B flag: {flag_b}")
        print(f"    Confidence:  {conf}")
        print()


def main():
    print("Lab 5.3 — Trust & Traceability: Human Review, Confidence & Provenance")
    print("=" * 70)
    print(f"Confidence threshold: {CONFIDENCE_THRESHOLD}")
    print()

    # Load the report
    report_text = get_numbered_report()
    print("--- Sample Report ---")
    print(report_text)
    print("--- End of Report ---\n")

    # Run two independent review passes with different prompts
    print("Running Pass A (strict compliance reviewer)...")
    pass_a = review(report_text, mode="strict")
    print(f"  Pass A found {len(pass_a)} finding(s)")

    print("Running Pass B (general financial reviewer)...")
    pass_b = review(report_text, mode="general")
    print(f"  Pass B found {len(pass_b)} finding(s)")

    # Bucket the findings
    buckets = bucket(pass_a, pass_b)

    # Print results
    print_findings("AUTO-CLEAR (confirmed, high confidence)", buckets["auto_clear"])
    print_findings("HUMAN REVIEW (confirmed, low confidence)", buckets["human_review"])
    print_findings("CONTESTED (one pass only — needs human judgment)", buckets["contested"])

    # Summary
    print("\n" + "=" * 70)
    print("Summary:")
    print(f"  Auto-clear:   {len(buckets['auto_clear'])} findings")
    print(f"  Human review: {len(buckets['human_review'])} findings")
    print(f"  Contested:    {len(buckets['contested'])} findings")
    print(f"  Threshold:    {CONFIDENCE_THRESHOLD}")
    print("=" * 70)


if __name__ == "__main__":
    main()
