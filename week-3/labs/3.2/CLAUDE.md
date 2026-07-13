# NorthPeak Outfitters Backend

General rules for all modules. Path-specific CLAUDE.md files add stricter rules under sensitive directories.

## How path-specific rules work

A `CLAUDE.md` inside a folder applies only when editing files under that folder. Claude layers the root rules with the nearest directory's rules — the more specific file takes precedence on conflict.

## Module layout

- `src/auth/` — SECURITY-CRITICAL: token verification. See `src/auth/CLAUDE.md`.
- `src/orders/` — order placement, low-stakes. See `src/orders/CLAUDE.md`.
- `src/payments/` — MONEY-CRITICAL: charges real money. See `src/payments/CLAUDE.md`.

## General rules

- Use `from __future__ import annotations` at the top of each module.
- Use type hints on every function signature.
- Add a one-line docstring to every public function.
- Validate all public-function inputs; raise `ValueError` for invalid arguments.
- Every behaviour change must have a test in `src/tests/`.
- `pytest -q` must pass before any change is considered complete.
