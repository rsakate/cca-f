from __future__ import annotations

from auth.tokens import verify_token


def charge(token: str, amount: float) -> dict:
    """Charge the given amount after verifying the caller's token."""
    if not isinstance(token, str):
        raise ValueError("token must be a string")
    if not isinstance(amount, (int, float)):
        raise ValueError("amount must be a number")
    if amount <= 0:
        raise ValueError("amount must be positive")
    if amount > 10_000:
        raise ValueError("amount must not exceed $10,000")
    if not verify_token(token):
        raise PermissionError("invalid token")
    return {"status": "charged", "amount": round(amount, 2)}
