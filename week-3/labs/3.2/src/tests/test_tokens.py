from __future__ import annotations

from auth.tokens import verify_token


def test_valid_token_is_accepted() -> None:
    assert verify_token("npk_live_abcdef123456") is True


def test_invalid_token_is_rejected() -> None:
    assert verify_token("bad") is False
