from __future__ import annotations

from northpeak.refunds import refund_amount, within_return_window


def test_full_refund_within_window() -> None:
    assert refund_amount(100.0, 10) == 100.0


def test_zero_refund_outside_window() -> None:
    assert refund_amount(100.0, 45) == 0.0


def test_boundary_day_30_is_within_window() -> None:
    assert within_return_window(30) is True
    assert refund_amount(50.0, 30) == 50.0


def test_boundary_day_31_is_outside_window() -> None:
    assert within_return_window(31) is False
    assert refund_amount(50.0, 31) == 0.0


def test_negative_price_rejected() -> None:
    try:
        refund_amount(-10.0, 5)
        assert False, "should have raised"
    except ValueError:
        pass


def test_negative_days_rejected() -> None:
    try:
        refund_amount(100.0, -1)
        assert False, "should have raised"
    except ValueError:
        pass


def test_opened_item_restocking_fee() -> None:
    assert refund_amount(100.0, 10, opened=True) == 85.0


def test_opened_item_outside_window_still_zero() -> None:
    assert refund_amount(100.0, 45, opened=True) == 0.0
