# Lab 5.1 — Managing Context: Preservation, Optimization & Escalation

**Module:** M5 — Context Management & Reliability  
**Sections:** S1 (Context Preservation & Optimization), S2 (Escalation & Ambiguity Resolution)  
**Scenario:** An E-commerce Customer Support Agent (multi-turn, multi-order session)

## Overview

This lab applies three production techniques to a single e-commerce support agent so the same code works at turn three and turn thirty:

| Demo | Technique | Core Idea |
|------|-----------|-----------|
| Demo 1 | Persistent case facts | Pin identity in a `CaseFacts` store; re-inject as `[CASE FACTS]` block in system prompt every turn |
| Demo 2 | Tool output optimization | Route every tool result through `optimize(tool, raw)` with a per-tool whitelist |
| Demo 3 | Ambiguity escalation | System prompt instructs the agent to ASK when a request maps to multiple records |

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # paste your key into .env
python main.py
```

## File Inventory

| File | Role | Purpose |
|------|------|---------|
| `main.py` | entry | Chat loop, tool dispatch, three labelled demos |
| `case_facts.py` | D1 | The `CaseFacts` store and its `as_system_block()` renderer |
| `tool_optimizer.py` | D2 | The `RELEVANT_FIELDS` whitelist and the `optimize()` function |
| `sample_data.py` | data | Mock `CUSTOMERS`/`ORDERS` dicts (Aarti Sharma, C-1001, three orders) plus lookup helpers |

## Reflection Questions

### Demo 1 — Persistent Case Facts (S1)

1. **Why put case facts in the system prompt rather than as an early user/assistant turn or as a tool response?**
   - The system prompt is always visible to the model regardless of context-window trimming. Early user/assistant turns can be evicted from the context window as the conversation grows, causing the model to "forget" who it is talking to. The system prompt is never trimmed, making it the only reliable place for facts that must persist across all turns.

2. **Every token in `as_system_block()` is paid for on every API call. Which kinds of facts belong here, and which kinds belong in normal turns or tools?**
   - Only identity-class facts belong in the system block: customer ID, tier, active order — things that define "who is this session about." Transient data like order line items, shipping updates, or conversation-specific details belong in tool results or chat history because they are large, change frequently, and are only relevant to specific turns.

3. **How would you decide which facts to evict from the block over a session that has been running for an hour?**
   - Keep facts that are needed for routing decisions or that the model will need on every turn (customer ID, tier). Evict facts that were relevant to a completed sub-task (e.g., an order ID after that issue is resolved). A good heuristic: if the fact hasn't been referenced in the last N turns and isn't needed for disambiguation, it can be removed.

### Demo 2 — Tool Output Optimization (S1)

4. **Why is the whitelist keyed on tool name rather than on the model's intent? When would you want it keyed on intent instead?**
   - Tool name is stable and predictable — you know exactly which function was called. Intent-based filtering would be fragile because the model's inferred intent can be wrong. However, intent-based filtering becomes useful when the same tool serves multiple purposes (e.g., `get_order_details` might need different fields for "check status" vs. "process return").

5. **What goes wrong if you whitelist too few fields? Too many?**
   - Too few: the model lacks data it needs to answer the question, producing incomplete or wrong responses. Too many: you burn tokens, bury the signal under noise, and risk pushing the [CASE FACTS] block (and earlier turns) out of the context window — defeating Demo 1's preservation technique.

6. **The optimizer is content-blind — it trims by field name. When would you reach for content-aware summarization (e.g. summarizing a long text field) on top of this?**
   - When a whitelisted field itself contains large text (e.g., a product description, customer notes, or a long address). Field-name filtering removes entire columns but cannot shrink a single large value. Content-aware summarization handles that — e.g., truncating a 500-word product description to a one-line summary.

### Demo 3 — Ambiguity Escalation (S2)

7. **Why is the escalation rule in the system prompt rather than enforced in code (e.g. a guard around the cancel tool)?**
   - A code guard catches one tool; the model still picks the wrong order for other operations (refunds, returns, address changes). Putting the rule in the system prompt makes it apply to every ambiguous intent across all tools. It is a behavioral policy, not a per-tool check, and lives where the model reads policies — the system prompt.

8. **What other ambiguous-request shapes should this trigger on (refunds, address changes, returns)? How would you list them without making the system prompt sprawl?**
   - Rather than listing every case, use a general principle: "If the customer's request could apply to more than one open order, ASK which order they mean." This single sentence covers cancellations, refunds, returns, address changes, and any future operation without growing the prompt.

9. **If the customer ignores the clarifying question and just says "the second one", how should the agent disambiguate that — and what role do the case facts play?**
   - The agent should use the order list it retrieved (from the tool call) to resolve "the second one" to a specific order ID. Case facts provide the customer ID so the agent can look up orders without re-asking, but the order disambiguation itself relies on the conversation history where the agent listed the options.
