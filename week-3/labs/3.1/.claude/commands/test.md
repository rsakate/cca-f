---
description: Run the pytest suite and summarize results
allowed-tools: Bash(python:*), Bash(pytest:*)
argument-hint: "[optional pytest flags]"
---

Run the test suite with `python -m pytest -q $ARGUMENTS`.

Report:
1. Total tests passed / failed / skipped.
2. If any test failed, name the failing test and explain the likely cause.
3. Do **not** edit any files — only report results.
