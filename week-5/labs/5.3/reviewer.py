"""
reviewer.py — Claude review pass with provenance (Demo 2, S6)

Runs a single compliance review pass against the financial report.
The model returns JSON findings with line numbers and confidence scores;
this module attaches the exact quoted text locally from sample_report.py
so the citation can never be hallucinated.

Two modes:
  "strict"  — a strict compliance reviewer prompt
  "general" — a general financial reviewer prompt

A tolerant JSON parser strips markdown fences and returns [] on parse
failure rather than crashing — a bad model response degrades to zero
findings, not a pipeline crash.
"""

import json
import os

from dotenv import load_dotenv
import anthropic

from sample_report import get_quote

load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME", "claude-sonnet-4-5")

_client = anthropic.Anthropic()

# ---------------------------------------------------------------------------
# Two prompts for the two-pass review (Demo 3)
# ---------------------------------------------------------------------------
PROMPT_STRICT = (
    "You are a strict compliance reviewer for quarterly financial reports. "
    "Review the report below and flag every line that has a compliance issue: "
    "missing disclosures, undisclosed related-party transactions, accounting "
    "method changes without notes, missing risk disclaimers, unexplained "
    "material changes. "
    "Return ONLY a JSON array of objects, each with: "
    '"line" (1-based line number), "flag" (short snake_case label), '
    '"confidence" (0.0 to 1.0). '
    "Do NOT include the quote text — only the line number. "
    "Example: [{\"line\": 5, \"flag\": \"missing_disclosure\", \"confidence\": 0.9}]"
)

PROMPT_GENERAL = (
    "You are a general financial reviewer looking at a quarterly report. "
    "Identify any lines that seem problematic from a regulatory or "
    "transparency standpoint — things an auditor or regulator would "
    "question. "
    "Return ONLY a JSON array of objects, each with: "
    '"line" (1-based line number), "flag" (short snake_case label), '
    '"confidence" (0.0 to 1.0). '
    "Do NOT include the quote text — only the line number. "
    "Example: [{\"line\": 5, \"flag\": \"missing_disclosure\", \"confidence\": 0.9}]"
)


def _parse_json_array(text: str) -> list:
    """Tolerant JSON parser: strip markdown fences, return [] on failure.

    A parse failure becomes a safe, low-confidence skip rather than
    crashing the run.
    """
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`").strip()
        if text.startswith("json"):
            text = text[4:].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return []


def review(report_text: str, mode: str = "strict") -> list[dict]:
    """Run one review pass and return findings with locally-attached provenance.

    The model returns only line numbers and flags — the quote is attached
    locally from get_quote() so the citation can't be hallucinated.
    Findings with out-of-range line numbers are dropped (unverifiable).
    """
    prompt = PROMPT_STRICT if mode == "strict" else PROMPT_GENERAL

    response = _client.messages.create(
        model=MODEL_NAME,
        max_tokens=1024,
        system=prompt,
        messages=[{"role": "user", "content": report_text}],
    )

    raw_text = "".join(b.text for b in response.content if b.type == "text")
    raw_findings = _parse_json_array(raw_text)

    cleaned = []
    for f in raw_findings:
        if not isinstance(f, dict):
            continue
        line = f.get("line")
        if not isinstance(line, int):
            continue
        quote = get_quote(line)
        if not quote:
            continue
        cleaned.append({
            "line": line,
            "quote": quote,
            "flag": str(f.get("flag", "unspecified")),
            "confidence": float(f.get("confidence", 0.0)),
        })

    return cleaned
