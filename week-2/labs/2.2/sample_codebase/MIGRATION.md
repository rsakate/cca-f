# Migration Notes

- Replaced deprecated logEvent(name, payload) with track({ name, props })
  across src/notifications.ts and src/orders.ts; imports updated.
- Next (Exercise 3): rename analytics event order_cancelled -> order_canceled (one
  L).
