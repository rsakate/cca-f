"""
Lab 5.1 — Managing Context: Preservation, Optimization & Escalation

Scenario: An E-commerce Customer Support Agent (multi-turn, multi-order session)

This lab applies three production techniques to a single e-commerce support
agent so the same code works at turn three and turn thirty:

  Demo 1 (S1) — Persistent case facts
      Pin identity in a CaseFacts store and append it as a [CASE FACTS]
      block to the system prompt every turn.

  Demo 2 (S1) — Tool output optimization
      Wrap raw tool results through optimize(tool, raw) so only the
      relevant fields reach the model.

  Demo 3 (S2) — Ambiguity escalation
      Set the system prompt to ASK a clarifying question when the
      user's request maps to more than one record.

Run:  python main.py
"""

import json
import os

from dotenv import load_dotenv
import anthropic

from case_facts import CaseFacts
from tool_optimizer import optimize
from sample_data import (
    CUSTOMERS,
    ORDERS,
    get_orders_for_customer,
    get_open_orders_for_customer,
)

load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME", "claude-sonnet-4-5")

_client = anthropic.Anthropic()

# ---------------------------------------------------------------------------
# System prompt — includes the ambiguity-escalation rule (Demo 3)
# ---------------------------------------------------------------------------
SYSTEM_BASE = (
    "You are a helpful support agent for an online retail company. "
    "Be concise. If a request is ambiguous (e.g. the customer has multiple "
    "open orders and didn't specify which), ASK a clarifying question "
    "instead of guessing. Always rely on the [CASE FACTS] block - those "
    "values are authoritative and you do not need to ask for them again."
)

# ---------------------------------------------------------------------------
# Tool definitions exposed to Claude
# ---------------------------------------------------------------------------
TOOLS = [
    {
        "name": "lookup_orders",
        "description": "Look up all orders for a customer by customer_id.",
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {
                    "type": "string",
                    "description": "The customer ID to look up orders for.",
                }
            },
            "required": ["customer_id"],
        },
    },
    {
        "name": "get_order_details",
        "description": "Get full details for a specific order by order_id.",
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "string",
                    "description": "The order ID to retrieve details for.",
                }
            },
            "required": ["order_id"],
        },
    },
]


# ---------------------------------------------------------------------------
# Tool execution — calls the mock DB, then optimizes the result
# ---------------------------------------------------------------------------
def run_tool(name: str, args: dict) -> str:
    """Execute a tool, optimize the result, return JSON for the model."""
    if name == "lookup_orders":
        raw = get_orders_for_customer(args["customer_id"])
    elif name == "get_order_details":
        raw = ORDERS.get(args["order_id"]) or {}
    else:
        raw = {"error": f"unknown tool {name}"}
    trimmed = optimize(name, raw)
    return json.dumps(trimmed)


# ---------------------------------------------------------------------------
# Chat — re-injects the [CASE FACTS] block on every call
# ---------------------------------------------------------------------------
def chat(messages: list, facts: CaseFacts) -> str:
    """Send messages to Claude with case facts pinned in the system prompt."""
    system_prompt = SYSTEM_BASE
    facts_block = facts.as_system_block()
    if facts_block:
        system_prompt = system_prompt + "\n\n" + facts_block

    response = _client.messages.create(
        model=MODEL_NAME,
        max_tokens=1024,
        system=system_prompt,
        tools=TOOLS,
        messages=messages,
    )

    # Handle tool-use loop
    while response.stop_reason == "tool_use":
        tool_use_block = next(
            b for b in response.content if b.type == "tool_use"
        )
        tool_name = tool_use_block.name
        tool_input = tool_use_block.input
        tool_result = run_tool(tool_name, tool_input)

        print(f"  [tool] {tool_name}({json.dumps(tool_input)}) -> {tool_result[:120]}...")

        messages.append({"role": "assistant", "content": response.content})
        messages.append(
            {
                "role": "user",
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": tool_use_block.id,
                        "content": tool_result,
                    }
                ],
            }
        )

        response = _client.messages.create(
            model=MODEL_NAME,
            max_tokens=1024,
            system=system_prompt,
            tools=TOOLS,
            messages=messages,
        )

    text = "".join(b.text for b in response.content if b.type == "text")
    return text


# ═══════════════════════════════════════════════════════════════════════════
# Demo 1: Preserve persistent case facts (Preservation, S1)
# ═══════════════════════════════════════════════════════════════════════════
def demo_1_case_facts():
    """Pin identity into CaseFacts; the model recalls it after filler turns."""
    print("\n" + "=" * 70)
    print("DEMO 1 — Persistent Case Facts (S1: Context Preservation)")
    print("=" * 70)

    facts = CaseFacts()
    facts.set("customer_id", "C-1001")
    facts.set("tier", "Gold")
    print(f"[facts] {facts.as_system_block()}")

    # Three unrelated filler turns to push early context away
    filler_turns = [
        "What are your store hours?",
        "Do you offer gift wrapping?",
        "What payment methods do you accept?",
    ]

    messages = []
    for i, user_msg in enumerate(filler_turns, 1):
        print(f"\n--- Turn {i} ---")
        print(f"USER: {user_msg}")
        messages.append({"role": "user", "content": user_msg})
        reply = chat(messages, facts)
        messages.append({"role": "assistant", "content": reply})
        print(f"AGENT: {reply}")

    # The identity question — the agent must still know the answer
    identity_question = "What is my customer ID and what tier am I?"
    print(f"\n--- Turn {len(filler_turns) + 1} (identity check) ---")
    print(f"USER: {identity_question}")
    messages.append({"role": "user", "content": identity_question})
    reply = chat(messages, facts)
    messages.append({"role": "assistant", "content": reply})
    print(f"AGENT: {reply}")


# ═══════════════════════════════════════════════════════════════════════════
# Demo 2: Optimize tool outputs (Optimization, S1)
# ═══════════════════════════════════════════════════════════════════════════
def demo_2_tool_optimization():
    """Show RAW vs OPTIMIZED tool output, then let the agent answer."""
    print("\n" + "=" * 70)
    print("DEMO 2 — Tool Output Optimization (S1: Context Optimization)")
    print("=" * 70)

    facts = CaseFacts()
    facts.set("customer_id", "C-1001")

    # Show raw vs optimized side-by-side
    raw = get_orders_for_customer("C-1001")
    optimized = optimize("lookup_orders", raw)

    print("\n--- RAW tool output (what the DB returns) ---")
    print(json.dumps(raw, indent=2))

    print("\n--- OPTIMIZED tool output (what the model sees) ---")
    print(json.dumps(optimized, indent=2))

    # Now run the agent with the optimized pipeline
    print("\n--- Agent answering with optimized output ---")
    messages = [{"role": "user", "content": "List my orders, just status and total."}]
    reply = chat(messages, facts)
    print(f"AGENT: {reply}")


# ═══════════════════════════════════════════════════════════════════════════
# Demo 3: Escalate ambiguity instead of guessing (Escalation, S2)
# ═══════════════════════════════════════════════════════════════════════════
def demo_3_escalate_ambiguity():
    """Customer says 'cancel my order' with two open orders — agent must ASK."""
    print("\n" + "=" * 70)
    print("DEMO 3 — Ambiguity Escalation (S2: Escalation & Ambiguity)")
    print("=" * 70)

    facts = CaseFacts()
    facts.set("customer_id", "C-1001")

    open_orders = get_open_orders_for_customer("C-1001")
    print(f"Customer has {len(open_orders)} open orders: "
          f"{[o['order_id'] for o in open_orders]}")

    messages = [{"role": "user", "content": "Please cancel my order."}]
    print(f"\nUSER: Please cancel my order.")
    reply = chat(messages, facts)
    print(f"AGENT: {reply}")


# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("Lab 5.1 — Managing Context: Preservation, Optimization & Escalation")
    print(f"Model: {MODEL_NAME}")

    demo_1_case_facts()
    demo_2_tool_optimization()
    demo_3_escalate_ambiguity()

    print("\n" + "=" * 70)
    print("All demos complete.")
    print("=" * 70)
