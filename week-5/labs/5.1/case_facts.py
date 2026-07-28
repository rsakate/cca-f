"""
case_facts.py — Persistent case facts (Demo 1, S1)

A tiny key-value store of facts that must survive every turn.
The as_system_block() method renders the facts into a single chunk
of text that is re-injected into the system prompt on every API call,
so the model never has to dig through history to remember who it is
talking to — even after the early messages are trimmed.

Keep it short — every token here is paid for on every API call.
"""


class CaseFacts:
    """A tiny key-value store of facts that must survive every turn."""

    def __init__(self):
        self._facts: dict[str, str] = {}

    def set(self, key: str, value: str) -> None:
        self._facts[key] = value

    def as_system_block(self) -> str:
        """Render facts as a [CASE FACTS] block for the system prompt.

        Returns an empty string when there are no facts yet, so the
        system prompt stays clean on the very first turn.
        """
        if not self._facts:
            return ""
        lines = ["[CASE FACTS - these are confirmed and must be preserved]"]
        for k, v in self._facts.items():
            lines.append(f"- {k}: {v}")
        return "\n".join(lines)
