from __future__ import annotations

from orders.service import count_items, place_order


def test_place_order_succeeds_with_valid_token() -> None:
    result = place_order("npk_live_abcdef123456", [{"sku": "HAT-01"}])
    assert result["status"] == "placed"
    assert result["item_count"] == 1


def test_count_items_returns_length() -> None:
    assert count_items([{"sku": "HAT-01"}, {"sku": "BOOT-02"}]) == 2


def test_count_items_empty_list() -> None:
    assert count_items([]) == 0


def test_count_items_rejects_non_list() -> None:
    try:
        count_items("not a list")  # type: ignore[arg-type]
        assert False, "should have raised"
    except ValueError:
        pass
