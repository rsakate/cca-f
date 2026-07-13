# Orders Module Rules

This module handles order placement — low-stakes application code.

## Rules

- Verify the token before processing any order (token check first, then business logic).
- Use `Decimal` for monetary values where precision matters.
- Keep functions small, typed, and tested.
