# =============================================================================
# loop.py — Exercise 1 (S1: Agentic Loop) — CORRECT Implementation
# =============================================================================
# PURPOSE:
#   Implements a CORRECT agentic loop that drives a ticket-classifier agent.
#   The loop keeps calling Claude until it has classified all three fields
#   (product_area, severity, intent). It exits only when Claude says it's done
#   (stop_reason == "end_turn"), NOT after a fixed number of iterations.
#
# CCA-F EXAM CONCEPTS:
#   1. stop_reason VALUES and what your loop does for each:
#      - "tool_use"       → Execute the tool, append result, loop again
#      - "end_turn"       → Extract final text, break out of the loop
#      - "max_tokens"     → Response was truncated (log warning, maybe retry)
#      - "stop_sequence"  → Custom stop string matched (treat as end_turn)
#
#   2. MESSAGE ORDERING (critical — see loop_broken.py for the wrong way):
#      a) ALWAYS append the assistant response to messages FIRST
#      b) THEN append tool_results as a user message
#      Reversing this order causes a malformed messages array and API errors.
#
#   3. tool_result format: each result must include:
#      - "type": "tool_result"
#      - "tool_use_id": matching the block.id from the assistant's tool_use
#      - "content": the stringified result (JSON string)
#
#   4. The loop is driven by STOP_REASON, not by counting iterations or checking
#      if tool_results is empty. Claude may call zero tools (reason without
#      acting) or many tools — stop_reason is the only reliable exit signal.
# =============================================================================

import json
import os

import anthropic
from dotenv import load_dotenv
from tools import classify_ticket

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# -----------------------------------------------------------------------------
# TOOL DEFINITION — JSON schema that tells Claude what tools are available.
# This is passed to the API on every iteration so Claude knows it CAN call
# classify_ticket. The schema's "required" array and property descriptions
# guide Claude on what arguments to supply.
# -----------------------------------------------------------------------------
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

# -----------------------------------------------------------------------------
# TEST TICKET — used across all exercises in Lab 1.1.
# A realistic B2B support ticket: double-charge + 500 error + time pressure.
# -----------------------------------------------------------------------------
ticket = (
    "Hi, I was charged twice for my last invoice and the payment gateway keeps "
    "throwing a 500 error when I try to view the receipt. Please help!"
)

# -----------------------------------------------------------------------------
# INITIAL MESSAGES — the prompt instructs Claude to classify ALL THREE fields.
# The phrase "Call the tool as many times as needed" is important: it tells
# Claude that multiple tool calls are acceptable if it can't get all fields
# in a single call.
# -----------------------------------------------------------------------------
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

# =============================================================================
# THE AGENTIC LOOP
# This is a while True loop — NOT a for loop with a fixed range.
# The loop exits ONLY when stop_reason == "end_turn" (Claude is done).
# =============================================================================
while True:
    iteration += 1
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        tools=tools,
        messages=messages,
    )
    print(f"Iteration {iteration} | stop_reason: {response.stop_reason}")

    # -------------------------------------------------------------------------
    # STEP A (MANDATORY, ALWAYS FIRST):
    # Append the assistant's response to messages BEFORE processing tool calls.
    # This maintains correct message alternation: user → assistant → user → ...
    # Skipping this or doing it after tool_results breaks the API contract.
    # See loop_broken.py for what happens when you reverse this order.
    # -------------------------------------------------------------------------
    messages.append({"role": "assistant", "content": response.content})

    # -------------------------------------------------------------------------
    # STEP B: Handle stop_reason == "end_turn"
    # Claude has finished — no more tool calls needed. Extract the final text
    # from the response content blocks and break out of the loop.
    # -------------------------------------------------------------------------
    if response.stop_reason == "end_turn":
        for block in response.content:
            if hasattr(block, "text"):
                print(f"\nFinal response:\n{block.text}")
        break

    # -------------------------------------------------------------------------
    # STEP C: Handle stop_reason == "tool_use"
    # Claude wants to call one or more tools. For each tool_use block:
    #   1. Call the corresponding Python function with block.input as kwargs
    #   2. Wrap the result in a tool_result dict with the matching tool_use_id
    #   3. Collect ALL results into a single user message and append to messages
    #
    # IMPORTANT: All tool_results from one assistant turn go in ONE user message.
    # Do not append them as separate user messages.
    # -------------------------------------------------------------------------
    if response.stop_reason == "tool_use":
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                # Execute the tool — **block.input unpacks the JSON args
                result = classify_ticket(**block.input)
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": block.id,  # Must match the tool_use block's id
                        "content": json.dumps(result),  # Must be a string, not a dict
                    }
                )
        messages.append({"role": "user", "content": tool_results})
