---
description: Review current changes against the checklist
allowed-tools: Bash(git diff:*), Bash(git status:*), Read, Grep
argument-hint: "[optional path or scope]"
---

Review the uncommitted changes (focus: $ARGUMENTS) against this checklist.
Do **not** edit files — only report findings.

## Checklist

1. **Tests**: Every behaviour change has a corresponding test.
2. **Type hints**: All public functions have parameter and return type annotations.
3. **Input validation**: Public functions validate their inputs and raise `ValueError` for bad data.
4. **Docstrings**: Every public function has a one-line docstring.
5. **Pure functions**: Functions avoid global state and side effects; use `round()` for monetary values.

## Output format

Group findings as:
- **Blocker** — must fix before merge.
- **Suggestion** — recommended improvement.
- **Nit** — minor style or readability note.

End with a one-line verdict: `Looks good` or `Needs changes: <count>`.
