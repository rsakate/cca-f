# Lab 2.2 — Connecting the Ecosystem: MCP Servers & Built-in Claude Code Tools

## Reflection Questions (Exercise 1 — MCP Servers)

### 1. Why is declaring two MCP servers better than pasting the order JSON and the returns doc into the chat yourself — what do you gain across a long session?

Declaring two MCP servers (northpeak-orders and northpeak-docs) is better than manual copy-pasting for several reasons:

- **Always-fresh data:** MCP servers fetch live data on every call. If an order's status changes from "shipped" to "delivered" mid-session, `get_order` returns the current state automatically. Pasted JSON is a stale snapshot — it goes out of date the moment anything changes, and you would have to re-paste it every time.

- **Context window efficiency:** In a long session the context window is a finite resource. Pasting raw JSON and full policy documents eats into that budget whether or not the agent needs them for the current question. MCP tools pull in only the specific data requested (one order, one doc) and only when needed, keeping the window free for the actual conversation.

- **Scales without human effort:** With two servers declared once in `.mcp.json`, the agent can handle any combination question — any order ID against any policy doc — without the user having to anticipate which data to paste. Over a 20-question support session, the user would otherwise have to locate, copy, and paste data dozens of times. The servers make every future query self-service for the agent.

- **Reduced human error:** Manual pasting risks copying the wrong order, an outdated version of a policy, or truncating a document. The MCP server is the single source of truth, eliminating that class of mistakes entirely.

---

### 2. The agent chose `get_order` for the order and `read_doc` for the policy. What in each tool's name and description makes that routing obvious — and how does this connect to the "strong tool interface" idea from Lab 2.1?

**`get_order`** — The name itself says "get an order." Its description says it returns a single order by ID including status, items, tracking number, and customer email. When the question mentions "order NP-100190," the agent sees a direct noun match: the question is about an *order*, and there is a tool called *get_order* that accepts an *order_id*. The routing is nearly mechanical.

**`read_doc`** — The name says "read a document." Its description says it returns the full text of a policy doc by name. The question asks about return window and condition rules — those are *policy* concepts, not order data. The agent already knew (or could discover via `search_docs("return")`) that a doc called "returns-policy" exists, so it called `read_doc("returns-policy")` to retrieve the authoritative policy text.

**Connection to "strong tool interface" (Lab 2.1):** A strong tool interface means each tool has a clear, single-purpose name, a precise description of what it returns, and well-typed parameters. This is exactly what makes the routing obvious here:
- Tool names are verb-noun pairs (`get_order`, `read_doc`) that match the user's intent directly.
- Descriptions list the exact fields returned, so the agent knows *before calling* whether the tool will have the data it needs.
- Parameters are minimal and typed (an order ID string, a doc name string), leaving no ambiguity about what input to provide.

If the tools were vaguely named (e.g., `fetch_data`, `lookup`) or had fuzzy descriptions, the agent would have to guess which tool serves which purpose. Strong interfaces eliminate that guesswork — the model can route confidently based on name and description alone, without trial and error.

---

### 3. If the agent had only the returns doc (no orders server), what would it have to do — and where would that go wrong?

Without the orders server, the agent would **not know what items are in order NP-100190**. It would have to take one of these fallback paths, all of which are problematic:

- **Ask the user to provide the order details:** The agent would have to say "What items are in this order?" and wait for the user to look it up manually and paste it in. This defeats the purpose of automation, slows down the interaction, and reintroduces the risk of human error (wrong order, typos, incomplete data).

- **Guess or hallucinate the items:** Without access to the order data, the agent might try to answer the return policy question generically ("here are the rules for all item categories...") without knowing which specific rules actually apply. Worse, it might hallucinate item details based on patterns in its training data. In our case, the correct answer depends critically on knowing the order contains `BOOT-GTX-M` (footwear — must be unworn) and `FILT-PMP` (water filter — seal must be intact). A generic answer would miss these item-specific condition rules entirely.

- **Give an incomplete answer:** The agent could accurately state the 30-day return window (since that only requires the delivery date, which the user mentioned), but it could not evaluate the condition rules — those are SKU-dependent. The answer would be half-right at best, which in a customer support context is potentially worse than no answer, because it gives false confidence.

**The core problem:** The returns policy is *conditional on item type* (footwear has different rules than filters, which have different rules than general gear). Without the orders server providing the structured item list with SKU prefixes, the agent cannot match items to their applicable condition rules. The two servers are complementary — the orders server provides the *what* (which items are in this order), and the docs server provides the *rules* (what conditions apply to each item type). Removing either half breaks the reasoning chain.

---

## Reflection Questions (Exercise 2 — Built-in Tools Refactor)

### 1. You used Glob, then Grep, then Read, then Edit — in that order. What would you have lost by skipping straight to "read every file in sample_codebase" before changing anything?

Skipping to "read everything" loses three things:

- **Precision of scope:** Glob mapped the project shape first (which files exist, where tests live vs. source). This told us *where to look* before we looked. Reading every file treats the whole codebase as equally relevant, when in reality only 2 out of 5 files needed changes. In a real project with hundreds of files, reading everything would flood the context window with irrelevant code.

- **Confidence in completeness:** Grep gave us an exhaustive, machine-verified list of every `logEvent(` occurrence across the entire `src/` directory — four call sites, two files. If we had just read files top-to-bottom, we'd be relying on the model's attention to catch every occurrence, which is error-prone in large files. Grep is a guarantee; reading is a best-effort scan.

- **Context window budget:** Each file read consumes tokens from the finite context window. The Glob-then-Grep approach let us read only `analytics.ts` (to learn the `track()` signature) before editing. We never needed to read `notifications.ts` or `orders.ts` in full — Grep already told us the exact lines to change and Edit operates on string matches. In a long session with many refactors, this efficiency compounds significantly.

- **Auditability:** The Glob → Grep → Read → Edit pipeline creates a clear trail: "here's the project shape, here are all the matches, here's the target signature, here are the edits." Dumping the whole repo into context and saying "fix it" produces no such trail — you can't verify whether the agent actually found everything or just got lucky.

---

### 2. The migration changed both the call (`logEvent(…)` → `track(…)`) and the import. Why is updating the import part of the same minimal edit, and what breaks if you change the call but forget the import?

The import and the call are a **single semantic unit** — changing one without the other leaves the code in a broken state:

- **If you change the calls but leave `import { logEvent }`:** The file now imports `logEvent` (which it no longer uses) and calls `track` (which it never imported). TypeScript will throw two errors: `'logEvent' is declared but its value is never read` and `Cannot find name 'track'`. The code won't compile at all.

- **Why it's "minimal":** A minimal edit is not about touching the fewest possible lines — it's about making the smallest *complete* change. The import and the call sites form a dependency: the import makes the function available, the call sites use it. Updating both together is the atomic unit of correctness. Splitting them into separate edits would leave the codebase in a broken intermediate state between edits.

- **Practical principle:** When migrating a function, always change the import and all call sites in the same file as one logical edit. This ensures the file goes from "compiles with old API" directly to "compiles with new API" with no broken intermediate state.

---

### 3. Grep found four call sites across two files. How does Grep-before-Edit change your confidence that you have migrated everything, compared with reading files top to bottom looking for calls?

Grep-before-Edit changes confidence from *probabilistic* to *deterministic*:

- **Grep is exhaustive:** `grep -rn "logEvent(" src/` searches every byte of every file in the directory. It will find matches in files you didn't expect, in comments, in strings, in generated code — everywhere. It gives you a complete census. When the final verification grep returned only the deprecated definition in `analytics.ts`, that's a machine-verified guarantee that zero live call sites remain.

- **Reading top-to-bottom is attention-dependent:** A human or model scanning files might miss an occurrence buried in a long function, skip a file they assumed was irrelevant, or lose focus in a large codebase. This is especially risky when the deprecated function appears in files you wouldn't expect (e.g., a utility file, a test helper, a config script).

- **Grep enables a clean verification loop:** The workflow becomes: (1) Grep to find all matches, (2) Edit to fix each one, (3) Grep again to confirm zero remaining. This is a closed loop — the same tool that found the problem verifies the fix. Without Grep, verification is just "I think I got them all," which is not something you want to stake a production migration on.

- **Grep catches edge cases:** What if `logEvent` were also called in a test file, a type definition, or a re-export? Top-to-bottom reading of source files would miss those. Grep across the whole directory wouldn't.

---

### 4. You used Edit to change existing files and Write to create MIGRATION.md. Why is reaching for Write (whole new file) the wrong tool for a two-line change in an existing file?

Edit and Write serve fundamentally different purposes, and using the wrong one has real costs:

- **Write replaces the entire file contents.** To use Write on an existing file, you must first Read the whole file, reproduce every unchanged line perfectly, and include your two-line change somewhere in the middle. If the file is 200 lines long, you're rewriting 198 unchanged lines — any accidental whitespace change, missing line, or encoding difference silently corrupts the file. Edit, by contrast, targets only the specific string being replaced and leaves everything else byte-identical.

- **Edit is surgical, Write is a sledgehammer.** For a two-line import+call change, Edit says "find this exact string, replace it with this exact string." The scope of possible damage is limited to the matched string. Write says "throw away everything in this file and replace it with this blob" — the scope of possible damage is the entire file.

- **Write is the right tool for MIGRATION.md** because that file didn't exist before. There's nothing to preserve, no existing content to accidentally corrupt. Creating a brand-new file from scratch is exactly what Write is for.

- **The principle:** Use Edit when modifying existing files (minimal, targeted, safe). Use Write when creating new files (no existing content to protect). This mirrors the real-world difference between `patch` (apply a diff) and `cat >` (overwrite from scratch).

---

## Reflection Questions (Exercise 3 — Incremental Exploration)

### 1. A one-letter rename and a whole-repo read produce the same final diff. For a real monorepo, why does the path you take to that diff matter as much as the diff itself?

The final diff is identical — one character changes from `order_cancelled` to `order_canceled`. But in a real monorepo with thousands of files, the *path* to that diff has massive consequences:

- **Token and time cost:** Reading every file in a monorepo might mean loading hundreds of thousands of lines into the context window. For a one-letter rename, 99.99% of those tokens are wasted. Grep found the single occurrence in seconds without reading any file contents. In a production setting, this is the difference between a 2-second operation and one that takes minutes, hits context limits, or costs significantly more in API usage.

- **Risk of unintended changes:** The more code the agent reads, the more opportunities it has to "notice" things and make unsolicited changes — fixing a typo here, refactoring a pattern there. A whole-repo read invites scope creep. The Grep → Read-one-file → Edit path keeps the agent's attention narrowly focused on the one change requested.

- **Reliability at scale:** In a monorepo, a whole-repo read might hit context window limits and silently truncate files, causing the agent to miss occurrences that appeared in the truncated portion. Grep has no such limit — it searches the actual filesystem, not a context window. The path that uses Grep scales to any repo size; the path that reads everything has a ceiling.

- **Reviewability:** When a teammate reviews the change, they see the same one-line diff regardless. But if something goes wrong and they need to understand *how* the change was made, the Grep-based path produces a clear audit trail ("searched for X, found it in one place, changed it"). The whole-repo path produces no such trail — it's opaque whether the agent actually verified completeness or just happened to find the right spot.

---

### 2. Grep located the event name in one place. When would "read the whole file" (or several files) genuinely be the right call, and how do you tell that case apart from this one?

Reading whole files is the right call when **understanding context matters more than finding a string**. The key question is: "Do I need to *find* something, or do I need to *understand* something?"

**When to Grep (find):**
- You know the exact string you're looking for (`order_cancelled`, `logEvent(`, an import path).
- The change is mechanical — rename, replace, delete — and doesn't depend on surrounding code.
- You need to verify completeness ("are there any other occurrences?").
- This exercise is a textbook Grep case: known string, mechanical rename, completeness check.

**When to Read whole files (understand):**
- You're refactoring a function and need to understand how its return value is used downstream — Grep finds the call sites, but you need to read the surrounding code to know if the refactor is safe.
- You're fixing a bug and need to trace control flow through a function to understand how data transforms from input to output.
- You're adding a new feature and need to understand the existing patterns in a file (error handling conventions, state management, naming patterns) to write code that fits in.
- You're reviewing whether a change is *semantically* correct, not just syntactically correct — e.g., does renaming this event break a downstream analytics dashboard that filters on the old name?

**The distinguishing signal:** If the change can be fully described as "replace string A with string B everywhere," Grep is sufficient. If the change requires judgment about the surrounding code ("is this safe?", "does this fit the pattern?", "what else might break?"), you need to Read.

---

### 3. Across all three exercises you gave the agent good sources (MCP) and then acted with precise tools. How do those two halves reinforce each other — what goes wrong if you have one without the other?

The two halves — **good sources (MCP servers)** and **precise tools (Glob/Grep/Read/Edit)** — form a feedback loop. Each makes the other more effective, and removing either half degrades the whole system:

**MCP without precise tools (good context, imprecise actions):**
- The agent knows *exactly* what items are in order NP-100190 and *exactly* what the returns policy says — but if it can only act by dumping entire files, making broad rewrites, or asking the user to make changes manually, that knowledge goes to waste. Imagine the agent correctly identifies that `logEvent` needs to become `track`, but instead of surgical Edit calls, it rewrites entire files from memory — introducing subtle whitespace errors, dropping lines, or missing occurrences. Good sources tell the agent *what* to do; precise tools let it do it *safely and completely*.

**Precise tools without MCP (precise actions, bad context):**
- The agent can Grep flawlessly and Edit with surgical precision — but if it doesn't have access to the orders server, it can't look up what items are in an order. It might grep the codebase perfectly for `logEvent(` but have no idea what signature `track()` expects because it can't access the analytics documentation. Precise tools tell the agent *how* to act; good sources tell it *what's true*. Without MCP, the agent would have to ask the user to paste data, hallucinate facts, or give generic answers — all of which we saw in the Exercise 1 reflection.

**Together, they create a virtuous cycle:**
1. MCP servers provide **authoritative data** (order status, policy rules, function signatures) so the agent reasons from facts, not guesses.
2. Precise tools let the agent **act on that data minimally** — touching only the files and lines that matter, verifying completeness with Grep, and leaving everything else untouched.
3. Because the tools are precise, the agent uses **less context window** on each action, leaving more room for MCP to bring in additional data for the next question.
4. Because MCP data is fetched on demand, the agent **doesn't waste context** storing information "just in case" — it queries when needed and acts precisely on what it gets.

**The takeaway:** Wiring up good sources but then acting imprecisely wastes the knowledge. Acting precisely but without good sources means acting precisely on *wrong information*. The lab demonstrates that the combination — authoritative context + surgical action — is what makes an agent reliable across a long session.
