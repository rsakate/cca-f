# =============================================================================
# exercise_1_tool_interfaces.py — Exercise 1 (S1: Tool Interfaces)
# Lab 2.1: Designing Reliable Tools — Interfaces, Errors & Selection Control
# =============================================================================
# PURPOSE:
#   Proves that tool-selection reliability is an INTERFACE PROBLEM, not a
#   model-size problem. The same model runs over a WEAK toolset and a STRONG
#   toolset on the same six questions. The weak set misroutes; the strong set
#   routes correctly — because the interface changed, not the model.
#
# CCA-F EXAM CONCEPTS:
#
#   1. THE MODEL NEVER SEES YOUR IMPLEMENTATION.
#      It picks a tool from three things ONLY:
#        - The NAME
#        - The DESCRIPTION
#        - The PARAMETER SCHEMA
#      Your Python function body is invisible to the model. Selection reliability
#      is 100% determined by these three interface elements.
#
#   2. THREE LEVERS OF STRONG TOOL DESIGN:
#      +-------------+----------------------------+----------------------------+
#      | Lever       | Weak                       | Strong                     |
#      +-------------+----------------------------+----------------------------+
#      | Name        | search, lookup             | search_products,           |
#      |             | (vague bare verbs)         | get_order_status           |
#      |             |                            | (object + action)          |
#      +-------------+----------------------------+----------------------------+
#      | Description | "Search for stuff in the   | Says WHEN to use it AND    |
#      |             | system." (vague, overlap)  | WHEN NOT TO — explicitly   |
#      |             |                            | defers to sibling tool.    |
#      +-------------+----------------------------+----------------------------+
#      | Parameters  | q: string (untyped)        | query: string (descriptive)|
#      |             |                            | order_id: string with      |
#      |             |                            | pattern ^NP-[0-9]{6}$      |
#      +-------------+----------------------------+----------------------------+
#
#   3. tool_choice={"type": "any"}:
#      Forces the model to call SOME tool (it must pick one). This lets us
#      measure WHICH tool is selected, not WHETHER a tool is called.
#      Compare with:
#        - {"type": "auto"}: model may answer in plain text, skip tools entirely
#        - {"type": "tool", "name": "X"}: forces a SPECIFIC tool (Exercise 3)
#
#   4. WHY "DO NOT USE THIS FOR..." IN DESCRIPTIONS:
#      Explicit negative contrast ("Do NOT use this to check an order — use
#      get_order_status instead") is more reliable than two positive-only
#      descriptions. It draws a clear boundary between the tools so the model
#      never has to guess which one applies.
#
# SCENARIO:
#   NorthPeak Outfitters — an online outdoor-gear store.
#   Two tool types:
#     - CATALOG search: "Do you sell a four-person tent?" → search_products
#     - ORDER lookup:   "Where is my order NP-100245?"   → get_order_status
#   Order ID format: NP-XXXXXX (regex: ^NP-[0-9]{6}$)
# =============================================================================

import os

import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")


# =============================================================================
# WEAK TOOLSET — Deliberately bad tool design
# =============================================================================
# Problems:
#   - Names are bare verbs: "search" and "fetch" — no object, no specificity.
#     Both are synonyms for "get data" — the model has nothing to disambiguate on.
#   - Descriptions are vague and overlapping: "Search for stuff" vs "Fetch
#     information" — both describe the same action with no domain context.
#     Neither says when NOT to use it or points to the sibling tool.
#   - Parameters are identical: both use "q" with no type constraints, no format
#     hints, no regex pattern. A question like "Where is NP-100245?" gives the
#     model no signal that "fetch" is meant for order IDs.
# =============================================================================
WEAK_TOOLS = [
    {
        "name": "search",
        "description": "Search for stuff in the system.",
        "input_schema": {
            "type": "object",
            "properties": {
                "q": {
                    "type": "string",
                    "description": "Query string.",
                },
            },
            "required": ["q"],
        },
    },
    {
        "name": "fetch",
        "description": "Fetch information from the system.",
        "input_schema": {
            "type": "object",
            "properties": {
                "q": {
                    "type": "string",
                    "description": "Query string.",
                },
            },
            "required": ["q"],
        },
    },
]

# =============================================================================
# STRONG TOOLSET — Production-quality tool design
# =============================================================================
# Fixes all three levers:
#   - Names: object + action → "search_products", "get_order_status"
#   - Descriptions: say WHEN to use AND WHEN NOT to use, explicitly deferring
#     to the sibling tool for the case it doesn't handle.
#   - Parameters: typed, specific. order_id has a regex pattern (^NP-[0-9]{6}$)
#     so a malformed ID is rejected at the schema level.
#
# EXAM TIP: The regex pattern serves TWO purposes:
#   1. Helps the model ROUTE correctly — seeing "NP-100245" in the question
#      matches the pattern, signaling this is an order lookup.
#   2. Validates input at call time — a bare "100245" without the NP- prefix
#      would be rejected, forcing the model to ask for a valid ID.
# =============================================================================
STRONG_TOOLS = [
    {
        "name": "search_products",
        "description": (
            "Search the NorthPeak product CATALOG for items we sell (tents, "
            "sleeping bags, stoves, boots, etc.) by free-text query. Use this for "
            "availability, price, or whether a product exists. Do NOT use this to "
            "check something a customer already bought — for an existing purchase "
            "use get_order_status instead."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Free-text product query, e.g. '4 person tent'.",
                },
                "max_results": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 10,
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_order_status",
        "description": (
            "Retrieve the status of an EXISTING customer order by its order ID "
            "(shipping status, items, tracking). Use this whenever the customer "
            "gives an order number or references a purchase. Do NOT use this to "
            "browse the catalog — for products use search_products instead."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "string",
                    "description": "Order ID in the format 'NP-XXXXXX'.",
                    "pattern": "^NP-[0-9]{6}$",
                },
            },
            "required": ["order_id"],
        },
    },
]


# =============================================================================
# TEST CASES — Six support questions with expected tool routing
# =============================================================================
# Three should route to the catalog/search tool, three to the order/lookup tool.
# The mapping uses WEAK tool names (search/lookup) and STRONG tool names
# (search_products/get_order_status) so the harness can check both toolsets.
#
# Edge cases included:
#   - "I ordered a tent last week, where is it?" — references a product (tent)
#     but is asking about an ORDER, not the catalog.
#   - "Can I get a price on hiking boots?" — no order number, pure catalog query.
#   - "What's the status on NP-100311?" — order ID present, clear order lookup.
# =============================================================================
TEST_CASES = [
    {
        "question": "Do you carry a four-person tent?",
        "expected_weak": "search",
        "expected_strong": "search_products",
    },
    {
        "question": "Where is my order NP-100245?",
        "expected_weak": "fetch",
        "expected_strong": "get_order_status",
    },
    {
        "question": "Can I get a price on hiking boots?",
        "expected_weak": "search",
        "expected_strong": "search_products",
    },
    {
        "question": "What's the status on NP-100311?",
        "expected_weak": "fetch",
        "expected_strong": "get_order_status",
    },
    {
        "question": "I ordered a tent last week, where is it? My order number is NP-100190.",
        "expected_weak": "fetch",
        "expected_strong": "get_order_status",
    },
    {
        "question": "Do you have any lightweight sleeping bags under $200?",
        "expected_weak": "search",
        "expected_strong": "search_products",
    },
]


# =============================================================================
# SCORING HARNESS
# =============================================================================
# For each test case:
#   1. Send the question to Claude with the given toolset
#   2. Force a tool call with tool_choice={"type": "any"}
#   3. Check which tool Claude picked vs the expected tool
#   4. Print OK or MISS, then a total score at the end
#
# tool_choice={"type": "any"} means:
#   - The model MUST call some tool (cannot reply with plain text)
#   - But it chooses WHICH tool — we're measuring selection accuracy
#
# EXAM TIP: This is different from {"type": "auto"} (may skip tools entirely)
# and {"type": "tool", "name": "X"} (forces a specific tool — Exercise 3).
# =============================================================================
def run_routing_test(toolset: list[dict], test_cases: list[dict], label: str) -> int:
    """Run all test cases against a toolset and score routing accuracy.

    Args:
        toolset:    The tool definitions to provide to Claude.
        test_cases: List of dicts with "question" and expected tool name.
        label:      "WEAK" or "STRONG" — for display purposes.

    Returns:
        Number of correctly routed questions (0-6).
    """
    print(f"\n{'=' * 60}")
    print(f"  TOOLSET: {label}")
    print(f"{'=' * 60}")

    # Determine which expected_* key to use based on label
    expected_key = "expected_weak" if label == "WEAK" else "expected_strong"

    correct = 0
    for i, case in enumerate(test_cases, 1):
        response = client.messages.create(
            model=MODEL,
            max_tokens=256,
            tools=toolset,
            # Force a tool call — we're measuring WHICH tool, not WHETHER
            tool_choice={"type": "any"},
            messages=[{"role": "user", "content": case["question"]}],
        )

        # Find which tool Claude chose
        chosen_tool = None
        for block in response.content:
            if block.type == "tool_use":
                chosen_tool = block.name
                break

        expected = case[expected_key]
        match = chosen_tool == expected
        if match:
            correct += 1

        status = "OK  " if match else "MISS"
        print(f"  [{status}] Q{i}: {case['question']}")
        print(f"         expected: {expected} | got: {chosen_tool}")

    print(f"\n  Score: {correct}/{len(test_cases)}")
    return correct


# =============================================================================
# MAIN — Run both toolsets and compare
# =============================================================================
if __name__ == "__main__":
    print("Lab 2.1 — Exercise 1: Tool Interfaces")
    print("Same model, same questions — only the interface changes.\n")
    print(f"Model: {MODEL}")

    weak_score = run_routing_test(WEAK_TOOLS, TEST_CASES, "WEAK")
    strong_score = run_routing_test(STRONG_TOOLS, TEST_CASES, "STRONG")

    print(f"\n{'=' * 60}")
    print(f"  SUMMARY")
    print(f"{'=' * 60}")
    print(f"  Weak toolset:   {weak_score}/6")
    print(f"  Strong toolset: {strong_score}/6")
    if strong_score > weak_score:
        print(f"\n  Strong toolset routed {strong_score - weak_score} more question(s) correctly.")
        print(f"  Same model — the interface made the difference.")
    elif strong_score == weak_score == len(TEST_CASES):
        print(f"\n  Both scored perfectly — try harder edge cases!")
    print()
