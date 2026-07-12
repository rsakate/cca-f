# Style Rules

- Keep functions pure: no global state, no side effects.
- Validate all public-function inputs; raise `ValueError` for invalid arguments.
- Use type hints on every function signature (parameters and return type).
- Add a one-line docstring to every public function.
- Use `from __future__ import annotations` at the top of each module.
- Prefer `round()` for monetary values to avoid floating-point drift.
