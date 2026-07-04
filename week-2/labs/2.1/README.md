# Lab 2.1 — Designing Reliable Tools: Interfaces, Errors & Selection Control

## Scenario
AI Customer-Support Agent for NorthPeak Outfitters (online outdoor-gear store).

## Exercises

| Exercise | Section | Core Concept |
|----------|---------|--------------|
| Ex 1 | S1 — Tool Interfaces | Selection reliability is an interface problem, not a model-size problem |
| Ex 2 | S2 — Structured Errors & Retries | Return failures as data (`isError`/`isRetryable`), never exceptions |
| Ex 3 | S3 — Selection Control | `tool_choice` scopes a turn: `auto` vs `any` vs forced single tool |

---

## Exercise 1: Tool Interfaces — Reflection Q&A

### Q1: The weak and strong runs use the same model. If accuracy jumps from 3/6 to 6/6, what does that tell you about where tool-selection reliability actually comes from — and what does it tell you about "just use a bigger model" as a fix?

It proves tool-selection reliability comes from the **interface design** (name, description, schema), not the model's reasoning power. The model didn't get smarter between runs — it got better inputs to decide from. "Just use a bigger model" is the wrong fix because:
- A bigger model with vague, overlapping tool definitions still has nothing to disambiguate on.
- A smaller model with precise names, explicit "when to use / when NOT to use" descriptions, and typed parameters can route correctly.
- Upgrading the model costs more tokens and latency; fixing the interface is free.

### Q2: The strong order tool adds `"pattern": "^NP-[0-9]{6}$"` to order_id. What does that pattern buy you beyond helping the model route — what should happen to a malformed id like 100245 at call time?

The regex pattern serves **two purposes**:

1. **Routing signal (model-side):** When the model sees "NP-100245" in the question and the schema says `pattern: "^NP-[0-9]{6}$"`, it's a strong signal to pick `get_order_status`.

2. **Input validation (code-side):** At call time, a malformed ID like `100245` (missing `NP-` prefix) should be **rejected before the tool executes**. Your code validates the argument against the pattern and returns a structured error telling the model to ask the customer for a properly formatted order ID. This prevents a wasted API/database call with a bad ID — the schema acts as a contract enforced at the boundary.

### Q3: Every strong description ends with "Do NOT use this … use the other tool instead." Why is that explicit negative contrast more reliable than two good positive descriptions that leave the boundary implicit?

Two positive-only descriptions can still **overlap** — the model has to infer where one tool's scope ends and the other begins. Explicit negative contrast ("Do NOT use this for X — use Y instead") draws a **hard boundary** the model doesn't have to guess. It turns an ambiguous overlap into a clear partition. The model reads both descriptions and sees each tool explicitly deferring the other's use case.

---

## Exercise 2: Structured Errors & Retries — Reflection Q&A

### Q1: The tool returns errors as data instead of raising. What specifically breaks if a tool raises a Python exception mid-loop — and why can't the model recover from that the way it recovers from a tool_result marked is_error?

If a tool raises a Python exception, the **agentic loop crashes**. The `client.messages.create()` call never receives a `tool_result`, so:
- The messages array is left in a broken state (assistant turn with a `tool_use` block but no corresponding `tool_result`).
- The model never sees the error — it has zero opportunity to reason about what went wrong or respond to the customer.
- The conversation is dead.

With a `tool_result` marked `is_error`, the model **receives the failure as data**. It reads the error message (e.g., "Order not found" or "Malformed ID"), understands what happened, and composes an intelligent customer-facing response. The error message in the structured envelope effectively acts as a prompt — the model uses it to decide what to say next.

### Q2: run_with_retry uses exponential backoff (0.2s -> 0.4s -> 0.8s) and a hard cap of four attempts. What goes wrong in production if you drop the cap? What goes wrong if you keep the cap but drop the backoff?

**Drop the cap (no max attempts):**
- A persistent 503 (service down for maintenance, misconfigured upstream) retries **forever**. The agent hangs, the customer gets no response, and you're burning compute and adding load to an already-struggling service. In a multi-tenant system, one stuck retry loop can starve other requests.

**Drop the backoff (immediate retries with cap):**
- All retries fire as fast as possible — 4 rapid requests in under a second. If the service is struggling under load (429, 503), rapid retries make it **worse** (thundering herd effect). Backoff gives the service time to recover between attempts. The exponential curve (0.2s → 0.4s → 0.8s) means each successive retry waits longer, spreading the load.

You need **both**: the cap prevents infinite loops, the backoff prevents overwhelming the service.

### Q3: 404 and 400 are both non-retryable but mean different things to the customer. Should the agent phrase them identically? Sketch how the structured error could carry enough information for the model to respond differently to "not found" vs "malformed id."

No — they should **not** be phrased identically. The customer needs different guidance:
- **404 (not found):** "We couldn't find an order with that ID. Could you double-check the number?"
- **400 (malformed):** "That doesn't look like a valid order ID. Our order IDs are in the format NP-XXXXXX."

The structured envelope already carries enough information for the model to distinguish them:
```json
{"isError": true, "isRetryable": false, "status": 400, "error": "Malformed order ID: '100245'. Expected format: NP-XXXXXX."}
{"isError": true, "isRetryable": false, "status": 404, "error": "Order NP-999999 not found."}
```

The `status` field (400 vs 404) and the `error` message give the model two signals to differentiate. The model reads the error string — which includes the reason AND the expected format — and uses it to compose the right customer response. The `error` field is essentially a prompt to the model: write it like you're telling a colleague what went wrong and what to do next.
