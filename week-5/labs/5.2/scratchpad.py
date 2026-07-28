"""
scratchpad.py — Disk-backed audit trail and checkpoint (Demo 2/3, S4)

A tiny JSON-on-disk store keyed by claim_id.  Two responsibilities:
  1. Record every finding for audit (intake output, validation result,
     adjudication decision).
  2. Hold each claim's status (new, in_progress, done, failed).

One file does both jobs because they share the same key — and writing
to it after every mutation is cheap at lab scale.

Every mutation flushes to disk immediately — that is the contract
that makes crash recovery work.
"""

import json
from pathlib import Path


class Scratchpad:
    """A tiny JSON-on-disk store keyed by claim_id."""

    def __init__(self, path: str = "scratchpad.json"):
        self.path = Path(path)
        self._data: dict = {}
        if self.path.exists():
            try:
                self._data = json.loads(self.path.read_text())
            except json.JSONDecodeError:
                self._data = {}

    def status(self, claim_id: str) -> str:
        """Return the current status of a claim: new, in_progress, done, or failed."""
        return self._data.get(claim_id, {}).get("status", "new")

    def log(self, claim_id: str, stage: str, payload) -> None:
        """Record what happened in a given stage for a given claim."""
        entry = self._data.setdefault(claim_id,
                                       {"status": "in_progress", "findings": []})
        entry["findings"].append({"stage": stage, "payload": payload})
        self._flush()

    def mark_done(self, claim_id: str) -> None:
        """Mark a claim as successfully completed."""
        self._data[claim_id]["status"] = "done"
        self._flush()

    def mark_failed(self, claim_id: str, reason: str) -> None:
        """Mark a claim as failed with a structured reason."""
        entry = self._data.setdefault(claim_id, {"findings": []})
        entry["status"] = "failed"
        entry["failure_reason"] = reason
        self._flush()

    def _flush(self) -> None:
        """Write the full state to disk — called after every mutation."""
        self.path.write_text(json.dumps(self._data, indent=2))
