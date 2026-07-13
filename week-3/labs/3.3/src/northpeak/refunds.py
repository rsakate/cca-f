from __future__ import annotations

RETURN_WINDOW_DAYS = 30
RESTOCKING_FEE_RATE = 0.15


def within_return_window(days_since_delivery: int) -> bool:
    """Return True if the delivery is still within the return window."""
    if not isinstance(days_since_delivery, int):
        raise ValueError("days_since_delivery must be an integer")
    if days_since_delivery < 0:
        raise ValueError("days_since_delivery must not be negative")
    return days_since_delivery <= RETURN_WINDOW_DAYS


def refund_amount(price: float, days_since_delivery: int, opened: bool = False) -> float:
    """Calculate the refund amount for a returned item."""
    if not isinstance(price, (int, float)):
        raise ValueError("price must be a number")
    if price < 0:
        raise ValueError("price must not be negative")
    if not isinstance(days_since_delivery, int):
        raise ValueError("days_since_delivery must be an integer")
    if days_since_delivery < 0:
        raise ValueError("days_since_delivery must not be negative")
    if not within_return_window(days_since_delivery):
        return 0.0
    if opened:
        return round(price * (1 - RESTOCKING_FEE_RATE), 2)
    return round(price, 2)
