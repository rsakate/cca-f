# Lab 4.3 — Scaling Output: Batch Processing & Multi-Pass Review

**Scenario:** News & Media-Monitoring Pipeline (Helix Robotics coverage)

## Quick Start

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # paste your ANTHROPIC_API_KEY
export $(grep -v '^#' .env | xargs)

# Start with Exercise 2 to verify your key/SDK quickly
python exercise_2_parallel.py

# Exercise 1 submits a real batch (may take a few minutes)
python exercise_1_message_batches.py
# If the batch is still processing, re-fetch later:
# python exercise_1_message_batches.py --fetch <batch_id>

python exercise_3_multipass.py
```

## Exercises

| # | File | Section | What it does |
|---|------|---------|--------------|
| 1 | `exercise_1_message_batches.py` | S5 | Build batch requests with `custom_id`; submit, poll, collect by id. Supports `--fetch <batch_id>` |
| 2 | `exercise_2_parallel.py` | S6 | Implement `run_parallel()` with `ThreadPoolExecutor`; compare sequential vs parallel wall-clock |
| 3 | `exercise_3_multipass.py` | S6 | Implement `critique()` and `refine()`; print draft, critique, refined briefing |

---

## Reflection Questions

### Exercise 1 — Message Batches API

1. When is the Message Batches API the right tool, and when is it the wrong one?
2. Why does every request need a `custom_id`? What breaks if you match results back by result order instead?
3. The script polls with a 10-minute deadline and prints a re-fetch hint on timeout. Why design the loop this way instead of waiting forever?

### Exercise 2 — Parallel Processing

4. Why are threads (not processes or async) the right primitive for this workload?
5. What stops the speedup from growing linearly with `workers`? Where does the wall come from?
6. If you were sizing this pool for production, what number would you set `workers` to, and how would you decide?

### Exercise 3 — Multi-Pass Review

7. Why use two separate calls (critique, then refine) instead of one prompt that asks the model to both review and rewrite?
8. The critique prompt explicitly says "Do NOT rewrite — only list issues." What goes wrong if you drop that instruction?
9. This lab uses the same model for all three passes. When would you want a **different** model (or a different instance) to run the critique?

---

## Self-Check Questions (Answer Without Looking Back)

| # | Question |
|---|----------|
| 1 | When is the Message Batches API the right choice over real-time calls — and when is it the wrong one? |
| 2 | Why must every batch request have a `custom_id`, and what is the polling contract (which status, how often, when to give up)? |
| 3 | Why is a thread pool (not a process pool, not `asyncio`) the right primitive for parallel Claude calls, and what caps the speedup? |
| 4 | Why split a multi-pass review into separate generate/critique/refine calls instead of asking one prompt to do all three? |
| 5 | Which of the three patterns (batch / parallel / multi-pass) fits which job in the pipeline, and what does mixing them up cost you? |
