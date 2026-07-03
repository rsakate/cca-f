# =============================================================================
# loop_limited.py — Exercise 1 (S1: Agentic Loop) — ANTI-PATTERN
# =============================================================================
# PURPOSE:
#   Demonstrates why using a fixed iteration count (for loop) instead of
#   stop_reason (while True) is an anti-pattern for agentic loops.
#
# CCA-F EXAM CONCEPT — Loop Exit Strategy:
#   WRONG: for i in range(1, 3)  →  Only 2 iterations allowed
#   RIGHT: while True + break on stop_reason == "end_turn"
#
#   Problems with fixed iteration counts:
#   1. Claude may need MORE iterations than you allow — the loop exits before
#      all fields are classified, producing an incomplete result.
#   2. Claude may need FEWER iterations — you waste API calls on unnecessary
#      loop cycles.
#   3. The number of tool calls Claude makes is NOT deterministic. It varies
#      based on the prompt, model version, and even randomness in sampling.
#      Hardcoding a count assumes a fixed behavior that doesn't exist.
#
#   The only reliable exit signal is stop_reason. When Claude sets
#   stop_reason == "end_turn", it has finished its work. Any other exit
#   strategy is guessing.
#
# WHAT TO OBSERVE WHEN RUNNING:
#   - With range(1, 3), the loop may exit mid-classification
#   - No final "end_turn" response is printed if the loop runs out of iterations
#   - Compare output with loop.py to see the difference
# =============================================================================

import json
import os

import anthropic
from dotenv import load_dotenv
from tools import classify_ticket

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

tools = [
    {
        "name": "classify_ticket",
        "description": "Classify a support ticket by analysing its text and returning values for the requested fields.",
        "input_schema": {
            "type": "object",
            "properties": {
                "ticket_text": {
                    "type": "string",
                    "description": "The full text of the support ticket to classify.",
                },
                "fields_needed": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of fields to classify. Valid values: product_area, severity, intent.",
                },
            },
            "required": ["ticket_text", "fields_needed"],
        },
    }
]

ticket = (
    "Hi, I was charged twice for my last invoice and the payment gateway keeps "
    "throwing a 500 error when I try to view the receipt. Please help!"
)

messages = [
    {
        "role": "user",
        "content": (
            f"Classify the following support ticket across ALL three fields "
            f"(product_area, severity, intent) using the classify_ticket tool. "
            f"Call the tool as many times as needed until every field is confirmed.\n\n"
            f"Ticket: {ticket}"
        ),
    }
]

# =============================================================================
# ANTI-PATTERN: Fixed iteration count.
# Only allows 2 loop iterations. If Claude needs 3+ tool calls to classify
# all three fields, the loop silently exits with an incomplete result.
# =============================================================================
for iteration in range(1, 3):  # only 2 iterations
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        tools=tools,
        messages=messages,
    )
    print(f"Iteration {iteration} | stop_reason: {response.stop_reason}")

    # Message ordering is correct here (assistant first, then tool_results),
    # but the loop may terminate before Claude reaches "end_turn".
    messages.append({"role": "assistant", "content": response.content})

    if response.stop_reason == "end_turn":
        for block in response.content:
            if hasattr(block, "text"):
                print(f"\nFinal response:\n{block.text}")
        break

    if response.stop_reason == "tool_use":
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                result = classify_ticket(**block.input)
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result),
                    }
                )
        messages.append({"role": "user", "content": tool_results})

# If we reach here without breaking, the loop ran out of iterations
# before Claude was done — the classification may be incomplete.
