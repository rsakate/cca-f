"""
sample_report.py — Mock quarterly financial report

A plain-text report with one statement per line.  Lines are 1-indexed
to match how a human reads a document.  Several lines contain
deliberate compliance issues for the reviewer to flag.

get_numbered_report()  returns the full text with line numbers (for the prompt).
get_quote(line_number)  returns the exact text of a single line (for provenance).
"""

REPORT_LINES = [
    "Q4 2024 Financial Report — Acme Corp",
    "Prepared by: Finance Department",
    "",
    "Revenue increased 12% year-over-year to $48.3M.",
    "Operating expenses rose 18% due to expanded headcount.",
    "Net income declined 5% to $6.1M.",
    "",
    "Cash and equivalents: $22.7M (down from $31.2M in Q3).",
    "Accounts receivable increased 40% — no explanation provided.",
    "Inventory write-downs of $3.2M were recorded but not disclosed in the notes.",
    "",
    "The company entered a related-party transaction with Acme Ventures LLC.",
    "Details of the related-party transaction terms were not disclosed.",
    "Board approved a $5M share buyback; no shareholder vote was recorded.",
    "",
    "Depreciation method changed from straight-line to accelerated.",
    "The change in depreciation method was not accompanied by a disclosure note.",
    "Prior-period figures were not restated to reflect the new method.",
    "",
    "Outlook: management expects 8-10% revenue growth in Q1 2025.",
    "No risk factors or forward-looking-statement disclaimers were included.",
]


def get_numbered_report() -> str:
    """Return the full report with 1-based line numbers, ready for the prompt."""
    lines = []
    for i, line in enumerate(REPORT_LINES, 1):
        lines.append(f"{i}: {line}")
    return "\n".join(lines)


def get_quote(line_number: int) -> str | None:
    """Return the exact text of a single line, or None if out of range.

    This is the provenance function — the model never copies the text;
    we attach it locally from OUR data so the citation can't be
    hallucinated.
    """
    if line_number < 1 or line_number > len(REPORT_LINES):
        return None
    return REPORT_LINES[line_number - 1]
