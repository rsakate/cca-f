# Lab 4.1 — Precision Prompting: Explicit Criteria & Few-Shot Consistency

**Scenario:** Trust & Safety Moderation Triage Classifier (REMOVE / REVIEW / ALLOW)

## Quick Start

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # paste your ANTHROPIC_API_KEY
export $(grep -v '^#' .env | xargs)

python exercise_1_explicit_criteria.py
python exercise_2_few_shot.py
python exercise_3_generalization.py
```

## Exercises

| # | File | Section | What it does |
|---|------|---------|--------------|
| 1 | `exercise_1_explicit_criteria.py` | S1 | Vague vs explicit criteria; scores accuracy + false 'remove' calls |
| 2 | `exercise_2_few_shot.py` | S2 | Zero-shot vs few-shot; scores exact-format compliance |
| 3 | `exercise_3_generalization.py` | S2 | Principles + examples; tests four unseen edge cases |

---

## Reflection Questions

### Exercise 1 — Explicit Criteria

1. Why does a vague "remove / review / allow" prompt over-fire `remove`, and how do explicit definitions cut false positives?
2. The explicit prompt says "if unsure between remove and review, choose review." Why bake in that tie-breaker, and what cost asymmetry does it encode?
3. Accuracy and the false-"remove" count are tracked separately. Why measure the false-positive count, not just overall accuracy?

### Exercise 2 — Few-Shot Consistency

4. The instruction already says "respond as `ACTION | rationale`." Why do few-shot examples lock the format better than the instruction alone?
5. How many examples should you use, and what should they cover to be most useful?
6. Format compliance is scored with a strict regex, separate from whether the decision is correct. Why measure format independently?

### Exercise 3 — Generalization

7. The examples teach the format; what does the short "principles" block add, and why is it needed for unseen cases?
8. The "public press number = allow" but "private address as a joke = remove" cases hinge on context the examples never showed. How do the principles get them right?
9. The scorer extracts the action with a regex on the `ACTION |` line rather than `split("|")[0]`. Why does robust parsing matter here?

---

## Self-Check Questions (Answer Without Looking Back)

| # | Question |
|---|----------|
| 1 | What makes a classification prompt's criteria explicit, and how does that cut false positives? |
| 2 | Why measure wrongful 'remove' calls separately from overall accuracy? |
| 3 | When do few-shot examples help, how many do you use, and what should they cover? |
| 4 | Why score output format with a strict regex, independent of decision correctness? |
| 5 | What does a principles block add over examples, and how do you make behaviour generalize to unseen cases? |
