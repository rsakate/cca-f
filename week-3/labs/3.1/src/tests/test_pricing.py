from __future__ import annotations

import pytest

from northpeak.pricing import member_discount, order_total, shipping_cost


def test_premium_member_gets_ten_percent_off() -> None:
    assert member_discount(100.0, True) == 10.0


def test_standard_member_gets_five_percent_off() -> None:
    assert member_discount(100.0, False) == 5.0


def test_shipping_is_free_for_zero_weight() -> None:
    assert shipping_cost(0) == 0.0


def test_order_total_combines_discount_and_shipping() -> None:
    # subtotal=100, premium=True (10% off = 10), weight=3kg (5.99 shipping)
    assert order_total(100.0, True, 3.0) == 95.99
