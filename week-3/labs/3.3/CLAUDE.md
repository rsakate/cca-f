# NorthPeak Outfitters — Refunds Pipeline

## Working style

- Test-driven: write the failing test first, then implement just enough to make it pass.
- Never weaken or delete a test to go green — fix the code.
- Use `from __future__ import annotations` at the top of each module.
- Type hints on every function signature.
- One-line docstring on every public function.
- Validate all public-function inputs; raise `ValueError` for invalid arguments.
- Every behaviour change must have a test in `src/tests/`.
- `pytest -q` must pass before any change is considered complete.
