#!/usr/bin/env python3
"""Parse a Claude review JSON verdict and exit 0 (approve) or 1 (request_changes)."""
from __future__ import annotations

import json
import re
import sys


def strip_code_fences(text: str) -> str:
    """Remove markdown code fences wrapping JSON."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*\n?", "", text)
    text = re.sub(r"\n?```\s*$", "", text)
    return text.strip()


def load_verdict(path: str) -> dict:
    """Load and unwrap a review verdict from a file."""
    with open(path) as f:
        raw = f.read()

    raw = strip_code_fences(raw)
    data = json.loads(raw)

    if "result" in data and "type" in data:
        inner = data["result"]
        if isinstance(inner, str):
            inner = strip_code_fences(inner)
            inner = json.loads(inner)
        data = inner

    return data


def main() -> None:
    """Entry point: read verdict file, exit 0 for approve, 1 for request_changes."""
    if len(sys.argv) < 2:
        print("Usage: review_gate.py <verdict.json>")
        sys.exit(2)

    verdict = load_verdict(sys.argv[1])
    decision = verdict.get("decision", "")

    issues = verdict.get("issues", [])
    for issue in issues:
        severity = issue.get("severity", "unknown")
        message = issue.get("message", "")
        print(f"[{severity}] {message}")

    if decision == "approve":
        print("PASS: approved")
        sys.exit(0)
    else:
        print(f"FAIL: {decision}")
        sys.exit(1)


if __name__ == "__main__":
    main()
