# Lab 3.3 — From Refinement to Pipeline: Iterative Workflows & CI/CD Integration

## Reflection Questions & Answers

### Exercise 1 — Iterative Refinement (S5)

**1. Why write the failing test first — what does watching it fail (red) actually prove?**

It proves the test actually exercises the new behaviour. If a test passes before you write the implementation, it's not testing anything meaningful — it might be asserting the wrong thing, hitting a code path that accidentally returns the right value, or not running at all. Seeing red confirms the test is wired up correctly and will only go green when the real logic exists.

**2. The `opened` parameter defaults to `False`. Why does that matter for existing tests and callers?**

Every existing call to `refund_amount(price, days)` continues to work unchanged — they never pass `opened`, so it defaults to `False` and the original full-refund path runs. This makes the new behaviour purely additive. If the parameter were required, every caller and every existing test would break immediately, violating the rule that existing tests must stay green.

**3. CLAUDE.md says "never weaken or delete a test to go green — fix the code." Why is that essential to a TDD loop?**

The test *is* the spec. If you edit a test to match buggy code, you've changed the spec to match the bug — you've defined the bug as correct. The TDD loop only works if the test is the fixed reference point and the implementation is the thing that moves. Weakening a test breaks that contract and lets regressions slip through permanently.

---

### Exercise 2 — Headless Claude in CI (S6)

**1. What does `claude -p` change versus an interactive session, and why is that necessary for CI?**

`claude -p` (print/headless mode) runs once, produces a single output, and exits — no REPL, no human prompts, no interactive approval. CI has no terminal to type into. A GitHub Actions runner needs a command that starts, does its work, and finishes with an exit code. An interactive session would hang forever waiting for input.

**2. The workflow diffs `origin/<base>...HEAD` and reviews only the diff. Why — and why is `fetch-depth: 0` needed?**

Reviewing only the diff focuses Claude on *what changed in this PR*, not the entire codebase. This keeps the review relevant, fast, and within token limits. `fetch-depth: 0` is needed because a shallow clone doesn't have the base branch's history — without it, `git diff origin/main...HEAD` fails because Git can't find the merge-base commit.

**3. The key is supplied as an Actions secret rather than committed. Why?**

A committed key leaks to anyone with read access to the repo — forks, clones, and public mirrors all expose it. Once leaked, it can't be un-leaked; you'd have to rotate it. An Actions secret is injected at runtime, never written to disk in the repo, never visible in logs, and can be revoked independently. It follows the principle of least privilege.

---

### Exercise 3 — Structured JSON Gate (S6)

**1. Why have Claude emit a strict `{decision, issues}` JSON object instead of a prose review?**

Machines gate on structure, not prose. A free-text review saying "I'd suggest some changes" is ambiguous — is that a pass or fail? A JSON object with `"decision": "request_changes"` is deterministic. You can write a three-line script to parse it and produce an exit code. Prose requires NLP to interpret, which adds another layer of unreliability to your CI gate.

**2. The gate accepts both a bare review object and the `--output-format json` envelope, and strips code fences. Why build in that tolerance?**

Claude's output shape depends on how it's invoked. With `--output-format json`, the verdict is wrapped in `{"type": "result", "result": "..."}`. Without it, you get the bare object. Claude might also wrap JSON in markdown fences. Building tolerance for all three formats means the gate works regardless of how the review was generated — locally during development, in CI with `--output-format json`, or pasted from a Claude conversation.

**3. The gate maps `approve` to exit 0 and `request_changes` to exit 1. How does an exit code become a PR gate?**

CI systems (GitHub Actions, Jenkins, etc.) treat exit code 0 as "step passed" and any non-zero exit as "step failed." A failed step fails the job, and a failed required job blocks the PR from merging. So `exit 1` from `review_gate.py` propagates up: failed step -> failed job -> blocked merge. Exit codes are the universal interface between any script and any CI system — no API integration needed.

---

### Debrief Self-Check

**1. What are the four steps of a test-driven loop, and why must the test fail first?**

Write-test -> Run (red) -> Implement -> Run (green). The test must fail first to prove it's actually testing the new behaviour. A test that never fails never proves anything.

**2. Why does a default parameter keep the suite green, and why does the "never edit a test" rule matter?**

A default means existing callers don't pass the argument and get the old behaviour — zero code changes required outside the new feature. The "never edit a test" rule ensures tests remain an independent specification. If you bend tests to match code, you lose the ability to catch regressions.

**3. What does `claude -p` do, and why is it required for CI?**

It runs Claude in headless/print mode — one prompt in, one result out, no interactive session. CI has no human to type in a REPL, so headless mode is the only option.

**4. Why review the diff (not the whole repo), and why is the API key a secret?**

The diff is the only thing that changed — reviewing the full repo wastes tokens and dilutes focus. The API key is a secret because committing it exposes it to everyone with repo access, and a leaked key can't be uncommitted.

**5. How does a structured JSON verdict become a pass/fail gate, and why exit codes?**

The gate script parses the `decision` field and maps it to exit 0 or 1. CI systems universally treat non-zero exits as failures, which block merges on required checks. Exit codes are the simplest, most portable interface between a script and a CI runner — no SDK, no API, just a number.
