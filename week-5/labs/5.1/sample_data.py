"""
Mock customer and order data for the e-commerce support agent.

One fictional customer (Aarti Sharma, C-1001) with three orders:
  O-9001  Delivered
  O-9002  Shipped
  O-9003  Processing

All values are dummy — no PII, no real account data.
"""

CUSTOMERS = {
    "C-1001": {
        "customer_id": "C-1001",
        "name": "Aarti Sharma",
        "tier": "Gold",
        "email": "aarti.sharma@example.com",
        "phone": "+1-555-0101",
        "address": "42 Elm Street, Springfield, IL 62704",
    },
}

ORDERS = {
    "O-9001": {
        "order_id": "O-9001",
        "customer_id": "C-1001",
        "status": "Delivered",
        "placed_on": "2025-03-10",
        "total": 129.99,
        "items": [
            {"sku": "SKU-A100", "name": "Wireless Mouse", "qty": 1, "price": 29.99},
            {"sku": "SKU-B200", "name": "Mechanical Keyboard", "qty": 1, "price": 89.99},
            {"sku": "SKU-C300", "name": "USB-C Hub", "qty": 1, "price": 10.01},
        ],
    },
    "O-9002": {
        "order_id": "O-9002",
        "customer_id": "C-1001",
        "status": "Shipped",
        "placed_on": "2025-04-01",
        "total": 49.95,
        "items": [
            {"sku": "SKU-D400", "name": "Laptop Stand", "qty": 1, "price": 49.95},
        ],
    },
    "O-9003": {
        "order_id": "O-9003",
        "customer_id": "C-1001",
        "status": "Processing",
        "placed_on": "2025-04-15",
        "total": 214.50,
        "items": [
            {"sku": "SKU-E500", "name": "Noise-Cancelling Headphones", "qty": 1, "price": 199.00},
            {"sku": "SKU-F600", "name": "3.5mm Audio Cable", "qty": 1, "price": 15.50},
        ],
    },
}


def get_orders_for_customer(customer_id: str) -> list[dict]:
    """Return all orders for a given customer id."""
    return [o for o in ORDERS.values() if o["customer_id"] == customer_id]


def get_open_orders_for_customer(customer_id: str) -> list[dict]:
    """Return orders that are NOT Delivered (i.e. still open / actionable)."""
    return [
        o for o in ORDERS.values()
        if o["customer_id"] == customer_id and o["status"] != "Delivered"
    ]
