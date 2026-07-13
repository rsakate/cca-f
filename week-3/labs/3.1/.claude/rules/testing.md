# Testing Rules

- Every behaviour change must have a test.
- Use sentence-style test names that describe the expected outcome (e.g., `test_premium_member_gets_ten_percent_off`).
- Cover the boundary and both sides: zero, typical, and edge-case inputs.
- `pytest -q` must pass before any change is considered complete.
- Place tests in `src/tests/` alongside the source tree.
