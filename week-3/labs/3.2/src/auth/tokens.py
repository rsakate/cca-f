from __future__ import annotations

import re

TOKEN_PATTERN = re.compile(r"^npk_[a-z]+_[a-f0-9]{12,}$")


def verify_token(token: str) -> bool:
    """Return True if the token matches the required format."""
    if not isinstance(token, str):
        raise ValueError("token must be a string")
    return bool(TOKEN_PATTERN.match(token))
