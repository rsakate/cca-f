# =============================================================================
# exercise_3_tool_choice.py — Exercise 3 (S3: Selection Control with tool_choice)
# Lab 2.1: Designing Reliable Tools — Interfaces, Errors & Selection Control
# =============================================================================
# PURPOSE:
#   Demonstrates how tool_choice controls what the model is ALLOWED to do on
#   a given turn. A triage step must always produce exactly one classification
#   — no chit-chat, no drafting a reply. Only the FORCED mode guarantees this.
#
# CCA-F EXAM CONCEPTS:
#
#   1. tool_choice SPECTRUM (least → most constrained):
#      +--------------------------------------+-----------------------------------+
#      | tool_choice                          | What the model may do             |
#      +--------------------------------------+-----------------------------------+
#      | {"type": "auto"}                     | Plain text, any tool, or no tool. |
#      |                                      | Least constrained.                |
#      +--------------------------------------+-----------------------------------+
#      | {"type": "any"}                      | Must call SOME tool — but it      |
#      |                                      | chooses which one. Can pick the   |
#      |                                      | wrong tool.                       |
#      +--------------------------------------+-----------------------------------+
#      | {"type": "tool", "name": "X"}        | Must call exactly tool X.         |
#      |                                      | Deterministic. What a routing     |
#      |                                      | step needs.                       |
#      +--------------------------------------+-----------------------------------+
#
#   2. WHY FORCED MODE FOR TRIAGE:
#      - "auto" may skip tools entirely and reply with plain text
#      - "any" guarantees A tool call, but may pick draft_customer_reply
#        instead of classify_ticket — wrong tool is worse than no tool
#      - "FORCED" guarantees classify_ticket is called every time — the only
#        mode a routing pipeline can rely on
#
#   3. FORCED GUARANTEES SHAPE, NOT CORRECTNESS:
#      Forcing classify_ticket guarantees the model CALLS it with a category
#      from the enum. It does NOT guarantee the category is CORRECT.
#      For that, you'd add a downstream gate (like Exercise 4 from Lab 1.1)
#      or a confidence check.
#
#   4. WHY A SECOND TOOL (draft_customer_reply)?
#      Without a competing tool, "auto" and "any" might still pick
#      classify_ticket by default. Adding draft_customer_reply creates a
#      realistic distraction — the model can "wander toward" drafting a reply
#      instead of classifying. This makes the difference between modes visible.
#
#   5. ENUM ON CATEGORY FIELD:
#      {"type": "string", "enum": ["order_issue", "product_question",
#       "return_request", "other"]}
#      This CLOSES the label space — the model can only pick from these four
#      values. Without an enum, the model might invent categories like
#      "billing_problem" or "urgent_request" that your routing code doesn't
#      handle.
#
#   EXAM TIP: "You need a triage step that always returns exactly one
#   classification. Which tool_choice setting do you use, and why not any?"
#   → Use {"type": "tool", "name": "classify_ticket"}. "any" guarantees a
#   tool call but can pick the WRONG tool (draft_customer_reply). For a
#   triage step, calling the wrong tool is worse than calling no tool —
#   you get a drafted reply instead of a classification.
#
# WHAT TO OBSERVE:
#   - auto:   some tickets get plain text or a drafted reply, no classification
#   - any:    every ticket gets a tool call, but some pick draft_customer_reply
#   - FORCED: every ticket gets a classify_ticket call with a valid category
# =============================================================================

import json
import os

import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")


# =============================================================================
# TOOL DEFINITIONS
# =============================================================================

# The CLASSIFIER tool — what triage SHOULD always call.
# The enum on "category" closes the label space to exactly four values.
# "reason" gives the model a place to explain its choice (useful for auditing).
CLASSIFY_TOOL = {
    "name": "classify_ticket",
    "description": "Classify a support ticket into exactly one routing category.",
    "input_schema": {
        "type": "object",
        "properties": {
            "category": {
                "type": "string",
                "enum": ["order_issue", "product_question", "return_request", "other"],
            },
            "reason": {"type": "string"},
        },
        "required": ["category", "reason"],
    },
}

# The DISTRACTOR tool — exists to tempt the model away from classifying.
# Under "auto" or "any", the model may decide to draft a reply instead of
# classifying. This makes the difference between modes visible.
DRAFT_TOOL = {
    "name": "draft_customer_reply",
    "description": "Draft a customer-facing reply email for a support ticket.",
    "input_schema": {
        "type": "object",
        "properties": {
            "reply_text": {
                "type": "string",
                "description": "The full text of the reply to send to the customer.",
            },
        },
        "required": ["reply_text"],
    },
}

TOOLS = [CLASSIFY_TOOL, DRAFT_TOOL]


# =============================================================================
# THREE MODES — least to most constrained
# =============================================================================
modes = {
    "auto":   {"type": "auto"},
    "any":    {"type": "any"},
    "FORCED": {"type": "tool", "name": "classify_ticket"},
}


# =============================================================================
# TEST TICKETS — four realistic support tickets
# =============================================================================
# These cover the four enum categories:
#   order_issue, product_question, return_request, other
# Some are ambiguous enough that under "auto" the model may skip classification
# and just answer the customer directly.
# =============================================================================
TEST_TICKETS = [
    "Where is my order NP-100245? It's been two weeks and I still haven't received it.",
    "Do you carry ultralight backpacking stoves under $50?",
    "I'd like to return the hiking boots I bought last week — they don't fit.",
    "Your website is showing an error when I try to log into my account.",
]


# =============================================================================
# HARNESS — run all tickets under a given mode
# =============================================================================
def run_mode(mode_name: str, tool_choice: dict):
    """Run all test tickets under a single tool_choice mode.

    For each ticket:
      - Sends the ticket as a user message with tool_choice set
      - Reports what the model did: called classify_ticket (with category),
        called draft_customer_reply, or replied with plain text
      - Counts how many tickets got a classify_ticket call

    Args:
        mode_name:   "auto", "any", or "FORCED" — for display
        tool_choice: The tool_choice dict to pass to the API
    """
    print(f"\n{'=' * 60}")
    print(f"  MODE: {mode_name}  |  tool_choice = {json.dumps(tool_choice)}")
    print(f"{'=' * 60}")

    classified_count = 0

    for i, ticket in enumerate(TEST_TICKETS, 1):
        response = client.messages.create(
            model=MODEL,
            max_tokens=512,
            tools=TOOLS,
            tool_choice=tool_choice,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Classify this support ticket into a routing category.\n\n"
                        f"Ticket: {ticket}"
                    ),
                }
            ],
        )

        # Determine what the model did
        tool_called = None
        category = None
        reason = None
        plain_text = None

        for block in response.content:
            if block.type == "tool_use":
                tool_called = block.name
                if block.name == "classify_ticket":
                    category = block.input.get("category")
                    reason = block.input.get("reason")
            elif hasattr(block, "text") and block.text.strip():
                plain_text = block.text.strip()[:80]  # truncate for display

        # Report result
        if tool_called == "classify_ticket":
            classified_count += 1
            print(f"  [CLASSIFY] T{i}: category={category}")
            print(f"             reason: {reason}")
        elif tool_called == "draft_customer_reply":
            print(f"  [DRAFT   ] T{i}: model drafted a reply instead of classifying")
        elif plain_text:
            print(f"  [TEXT    ] T{i}: model replied with plain text: \"{plain_text}...\"")
        else:
            print(f"  [UNKNOWN ] T{i}: stop_reason={response.stop_reason}")

    print(f"\n  Classified: {classified_count}/{len(TEST_TICKETS)}")
    return classified_count


# =============================================================================
# MAIN — run all three modes and compare
# =============================================================================
if __name__ == "__main__":
    print("Lab 2.1 — Exercise 3: Selection Control with tool_choice")
    print(f"Model: {MODEL}")
    print(f"Tools: classify_ticket + draft_customer_reply (distractor)")
    print(f"Tickets: {len(TEST_TICKETS)}")

    results = {}
    for mode_name, tool_choice in modes.items():
        results[mode_name] = run_mode(mode_name, tool_choice)

    print(f"\n{'=' * 60}")
    print(f"  SUMMARY")
    print(f"{'=' * 60}")
    for mode_name, count in results.items():
        status = "RELIABLE" if count == len(TEST_TICKETS) else "UNRELIABLE"
        print(f"  {mode_name:8s}: {count}/{len(TEST_TICKETS)} classified  [{status}]")

    print(f"\n  Rule: use the NARROWEST tool_choice that still lets the step do its job.")
    print(f"  For triage: FORCED mode — guarantees classify_ticket on every turn.")
    print()
