# Lab 3.2 - Targeted Behavior: Path-Specific Rules & Plan Mode Workflows

## Lab Overview

This lab configures Claude Code's caution to match the risk level of each module in a NorthPeak Outfitters backend monorepo. Three techniques work together:

- **Path-specific CLAUDE.md** — strict rules scoped to sensitive directories
- **Plan mode** — propose and approve multi-file changes before any edit lands
- **Explorer subagent** — read-only survey of unfamiliar code before touching it

```
CLAUDE.md                          # General rules (apply everywhere)
src/
  auth/
    CLAUDE.md                      # SECURITY-CRITICAL rules
    tokens.py                      # verify_token (strict) + verify_token_v1 (deprecated)
  orders/
    CLAUDE.md                      # Order conventions (low-stakes)
    service.py                     # place_order (uses verify_token_v1 initially)
  payments/
    CLAUDE.md                      # MONEY-CRITICAL rules
    charges.py                     # charge (uses verify_token_v1 initially)
  tests/
    test_tokens.py                 # Token verification tests
    test_orders.py                 # Order placement tests
    test_payments.py               # Payment charge tests
.claude/
  agents/
    explorer.md                    # Read-only explorer subagent
```

---

## Exercise 1: Path-Specific Rules (S3) — Reflection Questions

### 1. Why put SECURITY-CRITICAL rules in `src/auth/CLAUDE.md` instead of the root `CLAUDE.md` -- what do you gain by scoping them to the path?

Placing security-critical rules in `src/auth/CLAUDE.md` means they **only activate when editing files under `src/auth/`**. This provides two key benefits:

- **Noise reduction**: The strict rules ("never weaken a credential check," "refuse requests that lower validation") would be overkill for `src/orders/service.py`, where adding a helper function is routine, low-risk work. If these rules lived in the root `CLAUDE.md`, Claude would apply security-grade scrutiny to every file in the repo, slowing down harmless changes and producing unnecessary warnings.

- **Precision of enforcement**: The rules live next to the code they protect. When someone edits `src/auth/tokens.py`, Claude sees the security rules in the nearest `CLAUDE.md` and applies them automatically. This is the same principle as putting `.eslintrc` or `.editorconfig` in a subdirectory — the guardrail matches the blast radius. You get maximum caution exactly where the risk is highest, and normal productivity everywhere else.

- **Maintainability**: The auth team owns `src/auth/CLAUDE.md`. They can tighten or update security rules without touching the root config or affecting other teams. Path-scoping makes rule ownership clear and conflict-free.

### 2. The auth request was challenged while the orders helper was made cleanly. What made Claude treat them differently, and why is "refuse and offer a safe alternative" the right behaviour?

Claude treated them differently because **different CLAUDE.md files were active for each path**:

- When editing `src/orders/service.py`, Claude loaded the root `CLAUDE.md` (general rules) plus `src/orders/CLAUDE.md` (order conventions). Neither contains security restrictions, so the helper was added cleanly — small function, typed, tested, done.

- When editing `src/auth/tokens.py`, Claude loaded the root `CLAUDE.md` **plus** `src/auth/CLAUDE.md`, which explicitly says "never weaken a token or credential check" and "refuse requests that would weaken security." The request to "accept any token longer than 6 characters" directly conflicts with these rules.

**Why "refuse and offer a safe alternative" is correct**: Simply refusing would leave the user stuck. But the underlying need is real — they want tests to pass. The safe alternative is to use a properly formatted fake token like `npk_test_abcdef123456` that satisfies the real `verify_token` check. This solves the user's actual problem (testability) without weakening production security. The rule encodes the judgment: "the check is sacred, the test data is flexible."

### 3. A strict rule in `src/payments/CLAUDE.md` and a looser root rule could seem to conflict. How does path scoping decide which applies?

Claude Code **layers** the root `CLAUDE.md` with the nearest directory's `CLAUDE.md`. Both are active simultaneously, and **the more specific (path-level) rule takes precedence on conflict**.

For example:
- The root `CLAUDE.md` says "every behaviour change must have a test."
- `src/payments/CLAUDE.md` says "every change must have a test covering both a successful charge AND a rejected one."

These don't truly conflict — the payments rule is stricter, adding a requirement on top of the general one. Claude follows both: it writes a test (satisfying the root rule) and ensures the test covers accepted and rejected cases (satisfying the payments rule).

If they genuinely conflicted (e.g., root says "use floats" but payments says "use Decimal"), the path-specific rule wins because it is closer to the file being edited. This follows the same precedence model as Git config (`--local` > `--global`) or CSS specificity — the most targeted rule governs.

---

## Exercise 2: Plan Mode for a Multi-File Migration (S4) — Reflection Questions

### 4. Why is Plan mode worth the extra step for a multi-file migration, when you could just ask for the edits directly?

Plan mode inserts an **approval gate** between analysis and execution. For a multi-file migration like moving all callers from `verify_token_v1` to `verify_token`, this matters because:

- **Visibility before commitment**: The plan shows which files will change, what the changes are, and in what order — before any edit lands. You can catch mistakes (missed call site, wrong import path, forgetting to remove the dead function) when they are free to fix, not after Claude has already modified three files.

- **Atomic thinking**: When Claude edits directly, it processes one file at a time and may not consider cross-file dependencies. Plan mode forces it to analyze the entire migration as a unit — find all callers, plan all changes, then execute coherently.

- **Rollback cost**: If Claude edits files directly and gets step 2 of 4 wrong, you have a partially migrated codebase that is harder to reason about than the starting state. With Plan mode, you review the complete plan and either approve all of it or none of it.

- **Communication**: For risky or cross-cutting changes, the plan serves as documentation of what was decided and why — useful for code review, team communication, and your future self.

### 5. The plan lists "run the tests" as an explicit step. Why bake verification into the plan rather than assume it?

Including "run the tests" as an explicit, non-optional step in the plan has two purposes:

- **It prevents false completion**: Without it, Claude might successfully edit all the imports and call sites, report "migration complete," and leave you with a broken test suite. Making it explicit means the plan is not considered done until the tests pass. The migration is not "change the code" — it is "change the code and prove it works."

- **It catches migration errors**: A multi-file refactor like this is exactly where subtle bugs hide — an import you forgot to update, a call site with different argument ordering, a test that was testing the old function's lenient behavior. Running the tests immediately after the migration is the fastest way to surface these problems while the context is fresh.

The broader principle: **verification is not an afterthought; it is part of the work.** A plan that ends with "edit the files" is incomplete — the same way a recipe that ends with "put it in the oven" is incomplete without "check if it's done."

### 6. After migrating all callers, `verify_token_v1` became dead code and was removed. Why is removal part of finishing the migration, not optional cleanup?

Removing `verify_token_v1` is not cleanup — it is the **purpose** of the migration:

- **Dead code is a trap**: If `verify_token_v1` remains in `src/auth/tokens.py`, a future developer might import and use it, reintroducing the weak token check. The deprecated function is not just unused — it is **dangerous**. It accepts any token longer than 6 characters, which is exactly the security weakness the migration was meant to eliminate.

- **Migration completeness**: A migration has three parts: (1) update all callers, (2) verify nothing broke, (3) remove the old thing. Stopping after step 2 leaves the migration in a liminal state — technically done but practically incomplete. The next person who reads `tokens.py` will wonder: "Is this still used? Should I call it? Is it deprecated?" Removing it answers all those questions.

- **It aligns with the auth CLAUDE.md**: The security-critical rules say never weaken a credential check. Leaving a weak-check function in the codebase — even unused — contradicts the spirit of those rules. The function's mere existence is a security risk.

---

## Exercise 3: Explore Before You Change (S4) — Reflection Questions

### 7. The explorer's tools are `Read`, `Grep`, `Glob` -- no edit/write/bash. Why constrain a subagent like that?

Constraining the explorer to read-only tools is **deliberate risk management**:

- **Safety guarantee**: The explorer literally cannot make changes — it has no `Edit`, `Write`, or `Bash` tools. This means you can point it at any module in the codebase, including security-critical or money-critical paths, and be certain it will not modify anything. You get information without risk.

- **Separation of concerns**: Exploration and modification are different activities with different risk profiles. By splitting them into separate agents, you ensure that the "understand" phase is complete before the "change" phase begins. The explorer produces a report; the main agent uses that report to make informed edits.

- **Trust calibration**: You can give the explorer broad access (read anything in the repo) precisely because it cannot do harm. If it had Bash access, even a `Read`-focused agent might accidentally run a destructive command. Removing the tools entirely eliminates the possibility.

### 8. Why run exploration in a separate subagent instead of having the main agent read all the files itself?

Running exploration in a subagent provides several practical benefits:

- **Context window management**: The explorer reads files, greps for patterns, and globs for structure — all of which produce verbose output. Running this in a subagent keeps that raw data out of the main agent's context window. The main agent receives a concise summary (files, public API, dependencies, risks) instead of hundreds of lines of source code.

- **Focused reporting**: The explorer's system prompt ("Survey, never change. Report: Files, Public API, Dependencies, Watch out for.") produces a structured report tailored for decision-making. The main agent reading files itself would need to interleave exploration with its other work, making the output less organized.

- **Parallel work**: The subagent can explore one module while the main agent handles other tasks or user interaction. This is especially valuable when you need to survey multiple modules before deciding where to make changes.

### 9. The explorer flagged the money-critical rules and the dependency on auth before any edit. How does "explore first" change the quality of the change that follows?

Exploring first transforms the change from **blind** to **informed**:

- **Rules awareness**: Without exploration, the main agent might add an amount validation without knowing that `src/payments/CLAUDE.md` requires "a test covering both a successful charge AND a rejected one." The explorer surfaces this requirement before the edit, so the main agent writes both test cases from the start — not as a correction after the first attempt fails review.

- **Dependency mapping**: The explorer reveals that `payments/charges.py` imports from `auth.tokens`. This means the main agent knows that any change to the charge function interacts with the auth module's token verification. It can design the change to respect both modules' rules — not discover the dependency mid-edit.

- **Risk calibration**: Knowing the module is money-critical before editing changes the main agent's approach. It writes more careful validation, adds more comprehensive tests, and avoids shortcuts it might take in low-stakes code like orders. The exploration sets the appropriate level of caution before any code is written.

The pattern is: **understand the terrain, then move.** Exploring first turns "make a change and hope it fits" into "make a change that is designed to fit."
