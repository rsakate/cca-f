from __future__ import annotations

from auth.tokens import verify_token


def place_order(token: str, items: list[dict]) -> dict:
    """Place an order after verifying the caller's token."""
    if not isinstance(token, str):
        raise ValueError("token must be a string")
    if not isinstance(items, list):
        raise ValueError("items must be a list")
    if not verify_token(token):
        raise PermissionError("invalid token")
    return {"status": "placed", "item_count": len(items)}


def count_items(items: list[dict]) -> int:
    """Return the number of items."""
    if not isinstance(items, list):
        raise ValueError("items must be a list")
    return len(items)
