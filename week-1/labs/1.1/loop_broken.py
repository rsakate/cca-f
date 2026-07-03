# =============================================================================
# loop_broken.py — Exercise 1 (S1: Agentic Loop) — DELIBERATELY BROKEN
# =============================================================================
# PURPOSE:
#   Demonstrates the most common agentic loop mistake: appending the tool_results
#   (user role) BEFORE the assistant turn. This violates the Claude API's message
#   alternation contract and will cause an error.
#
# CCA-F EXAM CONCEPT — Message Ordering Rule:
#   The Claude Messages API requires strict role alternation:
#     user → assistant → user → assistant → ...
#
#   CORRECT ORDER (see loop.py):
#     1. Append assistant response (role: "assistant")
#     2. Append tool_results   (role: "user")
#
#   BROKEN ORDER (this file):
#     1. Append tool_results   (role: "user")   ← TWO user messages in a row!
#     2. Append assistant response (role: "assistant")
#
#   Result: The messages array has two consecutive "user" messages, which the
#   API rejects with an error. Even if it didn't error, Claude would lose track
#   of which tool_use each tool_result corresponds to.
#
# EXAM TIP:
#   "What happens if you append tool_results before the assistant turn?"
#   → The messages array becomes malformed. Always append assistant content FIRST.
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

iteration = 0

while True:
    iteration += 1
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        tools=tools,
        messages=messages,
    )
    print(f"Iteration {iteration} | stop_reason: {response.stop_reason}")

    # =========================================================================
    # BUG: tool_results (user role) appended BEFORE the assistant turn.
    #
    # This creates: [..., user, user, assistant] instead of
    #               [..., user, assistant, user]
    #
    # The API will reject this with an error about message role alternation.
    # This is the #1 most common mistake when building agentic loops.
    # =========================================================================
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
        # WRONG: appending user message first
        messages.append({"role": "user", "content": tool_results})
        # WRONG: assistant message comes second — violates alternation
        messages.append({"role": "assistant", "content": response.content})
        continue

    if response.stop_reason == "end_turn":
        messages.append({"role": "assistant", "content": response.content})
        for block in response.content:
            if hasattr(block, "text"):
                print(f"\nFinal response:\n{block.text}")
        break
