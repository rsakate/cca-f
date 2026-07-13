from __future__ import annotations

from payments.charges import charge


def test_charge_succeeds_with_valid_token_and_amount() -> None:
    result = charge("npk_live_abcdef123456", 49.99)
    assert result["status"] == "charged"
    assert result["amount"] == 49.99


def test_charge_rejects_amount_over_10000() -> None:
    try:
        charge("npk_live_abcdef123456", 10_001)
        assert False, "should have raised"
    except ValueError as e:
        assert "10,000" in str(e)
