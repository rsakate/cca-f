# MONEY-CRITICAL — Payments Module Rules

This module charges real money. A slip here could mis-charge customers.

## Rules

- **Always verify the token** before processing any charge.
- **Reject bad amounts**: amount must be positive and must not exceed $10,000 per charge.
- **Every change must have a test** covering both a successful charge AND a rejected one.
- Use `round()` for all monetary calculations to avoid floating-point drift.
- Never silently swallow errors — raise clear exceptions for invalid inputs.
