from __future__ import annotations


def member_discount(total: float, is_premium: bool) -> float:
    """Return the discount amount for a member based on membership tier."""
    if not isinstance(total, (int, float)):
        raise ValueError("total must be a number")
    if total < 0:
        raise ValueError("total must be non-negative")
    if not isinstance(is_premium, bool):
        raise ValueError("is_premium must be a boolean")
    if is_premium:
        return round(total * 0.10, 2)
    return round(total * 0.05, 2)


def shipping_cost(weight_kg: float) -> float:
    """Return the shipping cost based on package weight in kilograms."""
    if not isinstance(weight_kg, (int, float)):
        raise ValueError("weight_kg must be a number")
    if weight_kg < 0:
        raise ValueError("weight_kg must be non-negative")
    if weight_kg == 0:
        return 0.0
    if weight_kg <= 5:
        return 5.99
    return round(5.99 + (weight_kg - 5) * 1.50, 2)


def gift_wrap_fee(price: float) -> float:
    """Return the gift-wrap fee for an item based on its price."""
    if not isinstance(price, (int, float)):
        raise ValueError("price must be a number")
    if price < 0:
        raise ValueError("price must be non-negative")
    return round(price * 0.05, 2)


def order_total(subtotal: float, is_premium: bool, weight_kg: float) -> float:
    """Return the final order total after discount and shipping."""
    if not isinstance(subtotal, (int, float)):
        raise ValueError("subtotal must be a number")
    if subtotal < 0:
        raise ValueError("subtotal must be non-negative")
    discount = member_discount(subtotal, is_premium)
    shipping = shipping_cost(weight_kg)
    return round(subtotal - discount + shipping, 2)
