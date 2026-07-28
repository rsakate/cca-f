# Lab 5.2 — Resilient Systems: Error Propagation & Large Codebase Exploration

**Module:** M5 — Context Management & Reliability  
**Sections:** S3 (Error Propagation in Multi-Agent Systems), S4 (Context Management in Large Codebase Exploration)  
**Scenario:** A Healthcare Claims Processing Pipeline (Intake -> Validation -> Adjudication)

## Overview

Multi-agent pipelines in production fail two ways: silently (when a subagent raises an exception and the coordinator catches nothing useful) and catastrophically (when the process dies and the restart re-does all finished work). This lab fixes both with three composable pieces:

| Demo | Technique | Core Idea |
|------|-----------|-----------|
| Demo 1 | StageResult error envelope (S3) | Every subagent returns `StageResult(stage, ok, data, error)` — never raises. The coordinator inspects `result.ok` and reacts. |
| Demo 2 | Disk-backed scratchpad (S4) | Every stage's finding is logged to `scratchpad.json`; `mark_done`/`mark_failed` set per-claim status. |
| Demo 3 | Crash-recovery skip rule (S4) | On restart, skip claims already `done` or `failed`. Re-runs do only unfinished work. |

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # paste your key into .env
python main.py          # first run — processes all three claims
python main.py          # second run — skips already-finished claims
rm scratchpad.json      # manual reset
```

## File Inventory

| File | Role | Purpose |
|------|------|---------|
| `main.py` | entry | The coordinator: walks each claim through three stages, logs every finding, marks terminal status, and on restart skips already-finished claims |
| `agents.py` | D1 (S3) | The `StageResult` dataclass and the three subagents (`run_intake`, `run_validation`, `run_adjudication`). Intake calls Claude; the others are deterministic. |
| `scratchpad.py` | D2/3 (S4) | The `Scratchpad` class: per-mutation flush of an audit-log + checkpoint JSON file (`status`, `findings`, `failure_reason`) |
| `sample_claims.py` | data | Three mock claims (CLM-001 passes, CLM-002 is for an inactive member, CLM-003 passes) plus the `COVERED_PROCEDURES` policy set |

## Reflection Questions

### Demo 1 — StageResult Error Envelope (S3)

1. **Why force every subagent to return a `StageResult` rather than letting exceptions bubble up?**
   - A bare `except Exception` in the coordinator collapses every failure into a vague "something went wrong" — you lose the stage, the input, the type of failure. The `StageResult` envelope makes failures first-class data: the coordinator always knows which stage failed, what the input was, and what kind of error occurred. This lets it make informed decisions (log, retry, escalate) instead of catching a generic exception.

2. **The intake error string is `f"{type(exc).__name__}: {exc}"`, validation errors are short codes like `"member_not_active"`. When is each style appropriate?**
   - The intake subagent catches arbitrary exceptions (API timeouts, JSON parse errors, rate limits), so it needs the exception type and message for debugging. Validation errors are domain-specific, predictable failure modes — short codes like `"member_not_active"` let the coordinator branch on them programmatically (retry? alert? human handoff?). Free-text messages from the model belong in `data`, not `error`.

3. **How would you extend `StageResult` to support a retry-local-then-escalate policy, and what would the coordinator's logic look like?**
   - Add a `retryable: bool` field to `StageResult`. The coordinator checks `if not result.ok and result.retryable: retry up to N times`. After N failures, escalate to a human queue. Non-retryable errors (like `member_not_active`) skip retry and go straight to `mark_failed`. The scratchpad would log each retry attempt for audit.

### Demo 2 — Scratchpad as Audit Trail (S4)

4. **Why does `_flush()` run after EVERY mutation, instead of batching writes? When would batching be the right trade-off?**
   - Per-mutation flush guarantees that if the process crashes between two stages, the scratchpad accurately reflects what actually happened. Batching saves I/O but creates a window where the disk state is behind memory — a crash in that window means the audit trail lies. At production scale (thousands of claims), you'd move to SQLite or a database with proper transactions, but keep the write-immediately contract.

5. **The corrupted-file branch starts fresh but does NOT delete the bad file. Why is keeping it the safer default in a real system?**
   - A corrupted file may still contain partial data that an engineer can recover manually. Deleting it destroys evidence of what went wrong. Starting fresh in memory means the current run continues without crashing, while the bad file stays on disk for post-mortem investigation. In production, you'd also alert on corruption.

6. **How would the scratchpad need to change to support concurrent coordinators (e.g. two workers consuming the same claims list)?**
   - You'd need atomic read-modify-write operations — either file locking, or moving to a database (SQLite with WAL mode, or Postgres). Each worker would claim a claim with a CAS (compare-and-swap) style update, and the scratchpad would need to handle concurrent writes without data loss. The per-mutation flush contract stays, but the implementation moves from file I/O to database transactions.

### Demo 3 — Crash Recovery Skip Rule (S4)

7. **Why does the coordinator skip on `done` AND `failed` — wouldn't you want failed claims to be retried automatically?**
   - Re-running a `failed` claim risks masking a real issue. If CLM-002 failed because the member is inactive, retrying won't fix it. Letting humans decide which failures to retry (by deleting the scratchpad entry) keeps the system honest. Automatic retry is appropriate for transient errors (timeouts, rate limits) but not for business-logic failures.

8. **An `in_progress` claim gets re-run from stage 1 on restart. When is that safe, and when does it cause double-billing or other side-effect problems?**
   - It's safe when all stages are idempotent — running intake twice on the same claim produces the same output. It causes problems when stages have side effects (sending a payment, notifying a provider). For non-idempotent stages, the scratchpad should record which stages completed so the re-run can resume from the last successful stage rather than starting over.

9. **The lab never deletes `scratchpad.json` from code — the user resets manually. What goes wrong if you make the reset automatic ("delete the file if it's older than 24 hours")?**
   - A paused job that resumes after 25 hours would find its scratchpad gone and re-process all claims, causing duplicate work (and potentially duplicate payments). Staleness-based deletion also creates a race condition across time zones and clock skew. The reset should be a deliberate human action, not an automatic one.
