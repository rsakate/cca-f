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
