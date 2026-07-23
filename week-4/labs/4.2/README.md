# Lab 4.2 — Enforcing Structure: tool_use Schemas with Validation & Retry

**Scenario:** Recruiting Candidate-Screening Evaluator (strong_hire / hire / no_hire)

## Quick Start

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # paste your ANTHROPIC_API_KEY
export $(grep -v '^#' .env | xargs)

# Offline checks first (no API key needed)
python exercise_2_validation.py --check
python exercise_3_retry_loop.py --demo

# Live runs
python exercise_1_tool_schema.py
python exercise_2_validation.py
python exercise_3_retry_loop.py
```

## Exercises

| # | File | Section | What it does |
|---|------|---------|--------------|
| 1 | `exercise_1_tool_schema.py` | S3 | Define `EVALUATE_TOOL.input_schema`; force `tool_choice`; read `block.input` |
| 2 | `exercise_2_validation.py` | S4 | Implement `validate()`; runs `--check` offline and live |
| 3 | `exercise_3_retry_loop.py` | S4 | Wrap in retry loop with `tool_result(is_error=True)` feedback; runs `--demo` offline |

---

## Reflection Questions

### Exercise 1 — tool_use + JSON Schema

1. Why is a tool's `input_schema` plus `tool_choice` more reliable for structured output than asking the model to "reply in JSON"?
2. The enum `["strong_hire", "hire", "no_hire"]` lives in the schema, while `strong_hire => score >= 8` does not. What kinds of rules belong in a JSON Schema, and what kinds don't?
3. If you removed `"required": ["name", "recommendation", "score", "reason"]`, how would downstream code break, and what would still work?

### Exercise 2 — Schema + Semantic Validation

4. Why is `strong_hire => score >= 8` enforced in `validate()` instead of in the JSON Schema?
5. The validator returns `(ok, errors)` instead of raising. Why is a tuple a better contract here than an exception?
6. Why test `not isinstance(score, bool)` even though we already test `isinstance(score, int)`?

### Exercise 3 — Retry-and-Feedback Loop

7. Why is the validation error returned as a `tool_result` with `is_error=True` rather than as a normal user message describing the problem?
8. Why do you need to append the assistant's previous `resp.content` to `messages` before adding the `tool_result`?
9. Why cap the retries instead of looping until the output is valid? What is the failure mode of an uncapped loop?

---

## Self-Check Questions (Answer Without Looking Back)

| # | Question |
|---|----------|
| 1 | How does a tool `input_schema` combined with `tool_choice` force structured output, and why is reading `block.input` safer than parsing prose? |
| 2 | Which kinds of rules belong in a JSON Schema (syntax) versus in your validator (semantics / cross-field policy)? |
| 3 | Why does `validate()` return `(ok, errors)` instead of raising, and how does that shape the retry loop? |
| 4 | What goes into the `tool_result` turn that lets the model self-correct, and why `is_error=True`? |
| 5 | Why cap `max_attempts`, and what should the function return when the cap is hit? |
