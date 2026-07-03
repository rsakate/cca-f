# =============================================================================
# exercise_2_structured_errors.py — Exercise 2 (S2: Structured Errors & Retries)
# Lab 2.1: Designing Reliable Tools — Interfaces, Errors & Selection Control
# =============================================================================
# PURPOSE:
#   Wraps a flaky Orders service so the tool ALWAYS returns a structured
#   envelope instead of raising exceptions. A retry loop backs off on
#   transient errors and stops immediately on permanent ones. The model
#   never sees a Python crash — only clean tool_result data with is_error set.
#
# CCA-F EXAM CONCEPTS:
#
#   1. RETURN FAILURES AS DATA, NEVER EXCEPTIONS:
#      If a tool raises an exception, the agentic loop crashes and the model
#      never gets to reason about the failure. The fix:
#        success → {"isError": False, ...order fields}
#        failure → {"isError": True, "isRetryable": <bool>, "status": <int>,
#                    "error": <msg>}
#      The model receives the error as a tool_result and can respond
#      intelligently ("Order not found" vs "Please provide a valid order ID").
#
#   2. TRANSIENT vs PERMANENT ERRORS:
#      Transient (isRetryable=True):  408, 429, 500, 502, 503, 504
#        → Retry with exponential backoff (0.2s → 0.4s → 0.8s), up to a cap.
#      Permanent (isRetryable=False): 400 (malformed id), 404 (not found)
#        → Stop immediately. Retrying will never succeed — it just adds
#          latency and load.
#
#   3. EXPONENTIAL BACKOFF:
#      delay starts at 0.2s, doubles each attempt: 0.2 → 0.4 → 0.8
#      Hard cap of 4 attempts. Without a cap, a persistent 503 retries forever.
#      Without backoff, rapid retries overwhelm the already-struggling service.
#
#   4. THE STRUCTURED ENVELOPE:
#      Every call returns a dict, NEVER raises. The two boolean-ish fields:
#        - isError:     did the call fail?
#        - isRetryable: should the loop retry?
#      The retry loop checks both: if not isError → return success.
#      If isError and isRetryable and attempts remain → sleep and retry.
#      If isError and not isRetryable → return immediately (permanent failure).
#
#   EXAM TIP: "What specifically breaks if a tool raises a Python exception
#   mid-loop?" → The agentic loop crashes. The model never receives a
#   tool_result, so it can't reason about the failure or recover gracefully.
#   The conversation is dead.
#
# USAGE:
#   Offline self-check (no API key needed):
#     python exercise_2_structured_errors.py --check
#
#   Live agent run (requires ANTHROPIC_API_KEY):
#     python exercise_2_structured_errors.py
#
# SCENARIO:
#   NorthPeak Outfitters — the Orders service is flaky.
#   Three test cases demonstrate three failure shapes:
#     A) NP-100245 — times out once (504), then succeeds on retry
#     B) NP-999999 — order not found (404) — no retry, agent reports not found
#     C) 100245   — malformed ID (400) — no retry, agent asks for valid format
# =============================================================================

import json
import os
import sys
import time

import anthropic
from dotenv import load_dotenv

load_dotenv()


# =============================================================================
# MOCK SERVICE — Simulates a flaky NorthPeak Orders backend
# =============================================================================
# ServiceError carries an HTTP status code and message so call_order_tool
# can classify it as transient or permanent.
# =============================================================================
class ServiceError(Exception):
    """Represents an HTTP-like error from the Orders service."""
    def __init__(self, status: int, message: str):
        self.status = status
        self.message = message
        super().__init__(f"{status}: {message}")


# Track call counts per order_id to simulate transient failures
_call_counts: dict[str, int] = {}


def orders_service(order_id: str) -> dict:
    """Simulated Orders service — flaky by design.

    Failure injection:
      - NP-100245: returns 504 on first call, succeeds on second (transient)
      - NP-999999: always returns 404 (permanent — order doesn't exist)
      - IDs without NP- prefix: returns 400 (permanent — malformed)
      - All other valid NP-XXXXXX IDs: succeed immediately
    """
    # Track how many times this order_id has been called
    _call_counts[order_id] = _call_counts.get(order_id, 0) + 1
    call_num = _call_counts[order_id]

    # Malformed ID — no NP- prefix
    if not order_id.startswith("NP-"):
        raise ServiceError(400, f"Malformed order ID: '{order_id}'. Expected format: NP-XXXXXX.")

    # Order not found
    if order_id == "NP-999999":
        raise ServiceError(404, f"Order {order_id} not found.")

    # Transient failure — timeout on first call, success on retry
    if order_id == "NP-100245" and call_num == 1:
        raise ServiceError(504, "Gateway timeout — upstream service did not respond.")

    # Success — return order data
    return {
        "order_id": order_id,
        "status": "shipped",
        "items": ["4-person tent", "sleeping bag"],
        "tracking": "1Z999AA10123456784",
    }


# =============================================================================
# STRUCTURED ENVELOPE — call_order_tool
# =============================================================================
# Wraps orders_service() so it NEVER raises. Every call returns a dict:
#   success: {"isError": False, "order_id": ..., "status": ..., ...}
#   failure: {"isError": True, "isRetryable": bool, "status": int, "error": str}
#
# EXAM TIP: The set of retryable status codes matches standard HTTP semantics:
#   408 (Request Timeout), 429 (Too Many Requests), 500 (Internal Server Error),
#   502 (Bad Gateway), 503 (Service Unavailable), 504 (Gateway Timeout)
# Permanent errors (400, 404) are NOT retryable — retrying won't fix them.
# =============================================================================
RETRYABLE = {408, 429, 500, 502, 503, 504}


def call_order_tool(order_id: str) -> dict:
    """Wrap orders_service into a structured envelope — never raises.

    Returns:
        On success: {"isError": False, **order_data}
        On failure: {"isError": True, "isRetryable": bool, "status": int, "error": str}
    """
    try:
        data = orders_service(order_id)
        return {"isError": False, **data}
    except ServiceError as err:
        return {
            "isError": True,
            "isRetryable": err.status in RETRYABLE,
            "status": err.status,
            "error": err.message,
        }


# =============================================================================
# RETRY LOOP — run_with_retry
# =============================================================================
# Retries transient errors with exponential backoff. Stops immediately on
# permanent errors. Hard cap of max_attempts prevents infinite retries.
#
# Backoff schedule: 0.2s → 0.4s → 0.8s (doubles each attempt)
#
# EXAM TIP: "What goes wrong in production if you drop the cap?"
#   → A persistent 503 retries forever, blocking the agent.
# "What goes wrong if you keep the cap but drop the backoff?"
#   → Rapid retries overwhelm the already-struggling service (thundering herd).
# =============================================================================
def run_with_retry(order_id: str, max_attempts: int = 4) -> dict:
    """Call the order tool with retry logic for transient errors.

    Args:
        order_id:     The order ID to look up.
        max_attempts: Maximum number of attempts (default 4).

    Returns:
        The structured envelope from the last attempt.
    """
    delay = 0.2
    for attempt in range(1, max_attempts + 1):
        result = call_order_tool(order_id)
        print(f"    Attempt {attempt}: isError={result['isError']}"
              + (f", status={result.get('status')}, isRetryable={result.get('isRetryable')}"
                 if result["isError"] else " — success"))

        # Success — return immediately
        if not result["isError"]:
            return result

        # Permanent error — stop, retrying won't help
        # Retryable but out of attempts — also stop
        if not result["isRetryable"] or attempt >= max_attempts:
            return result

        # Transient error with attempts remaining — backoff and retry
        print(f"    Retrying in {delay:.1f}s...")
        time.sleep(delay)
        delay *= 2  # exponential backoff

    return result  # should not reach here, but safety net


# =============================================================================
# TOOL DEFINITION — for the Claude API
# =============================================================================
ORDER_TOOL = {
    "name": "get_order_status",
    "description": (
        "Look up the status of a customer order by order ID. "
        "Returns shipping status, items, and tracking number. "
        "Order IDs are in the format NP-XXXXXX."
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
}


# =============================================================================
# OFFLINE SELF-CHECK (--check flag)
# =============================================================================
# Verifies the envelope and retry logic without calling the Claude API.
# Three checks:
#   1. Valid order succeeds (isError=False)
#   2. NP-999999 returns 404 (isError=True, isRetryable=False)
#   3. NP-100245 retries after 504 timeout, succeeds on second attempt
# =============================================================================
def run_self_check():
    """Offline self-check — no API key needed."""
    print("=" * 60)
    print("  OFFLINE SELF-CHECK")
    print("=" * 60)

    all_passed = True

    # Check 1: Valid order succeeds
    print("\n  Check 1: Valid order (NP-100100) should succeed")
    _call_counts.clear()
    result = call_order_tool("NP-100100")
    passed = not result["isError"]
    print(f"    Result: isError={result['isError']} — {'PASS' if passed else 'FAIL'}")
    all_passed = all_passed and passed

    # Check 2: 404 is non-retryable
    print("\n  Check 2: NP-999999 should return 404, isRetryable=False")
    _call_counts.clear()
    result = call_order_tool("NP-999999")
    passed = result["isError"] and not result["isRetryable"] and result["status"] == 404
    print(f"    Result: isError={result['isError']}, status={result['status']}, "
          f"isRetryable={result['isRetryable']} — {'PASS' if passed else 'FAIL'}")
    all_passed = all_passed and passed

    # Check 3: 504 is retryable, run_with_retry recovers on second attempt
    print("\n  Check 3: NP-100245 should timeout (504) then succeed on retry")
    _call_counts.clear()
    result = run_with_retry("NP-100245")
    passed = not result["isError"] and result.get("order_id") == "NP-100245"
    print(f"    Final result: isError={result['isError']} — {'PASS' if passed else 'FAIL'}")
    all_passed = all_passed and passed

    # Check 4: Malformed ID is non-retryable
    print("\n  Check 4: Malformed ID (100245) should return 400, isRetryable=False")
    _call_counts.clear()
    result = call_order_tool("100245")
    passed = result["isError"] and not result["isRetryable"] and result["status"] == 400
    print(f"    Result: isError={result['isError']}, status={result['status']}, "
          f"isRetryable={result['isRetryable']} — {'PASS' if passed else 'FAIL'}")
    all_passed = all_passed and passed

    print(f"\n  {'All checks passed!' if all_passed else 'Some checks FAILED.'}")
    return all_passed


# =============================================================================
# LIVE AGENT — Runs the model over three failure shapes
# =============================================================================
# Case A: NP-100245 — transient 504, succeeds on retry
# Case B: NP-999999 — permanent 404, agent says order not found
# Case C: 100245   — permanent 400, agent asks for valid format
#
# The agent loop:
#   1. Send question to Claude with the order tool
#   2. If stop_reason == "tool_use": call run_with_retry, return result as
#      tool_result (the envelope IS the content — no exceptions)
#   3. If stop_reason == "end_turn": print final response, done
#
# EXAM TIP: The model never sees a crash. On error, it receives a tool_result
# with isError=True and can reason about it: "The order was not found" or
# "That doesn't look like a valid order ID."
# =============================================================================
def run_live_agent():
    """Run the model over three failure shapes."""
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")

    test_cases = [
        ("Case A — Transient 504, then success", "Where is my order NP-100245?"),
        ("Case B — Permanent 404, not found", "What's the status of order NP-999999?"),
        ("Case C — Malformed ID 400", "Can you look up order 100245 for me?"),
    ]

    for label, question in test_cases:
        print(f"\n{'=' * 60}")
        print(f"  {label}")
        print(f"  Question: {question}")
        print(f"{'=' * 60}")

        # Reset call counts for fresh failure injection
        _call_counts.clear()

        messages = [{"role": "user", "content": question}]

        while True:
            response = client.messages.create(
                model=MODEL,
                max_tokens=512,
                tools=[ORDER_TOOL],
                messages=messages,
            )

            # Always append assistant response first (message ordering rule from Lab 1.1)
            messages.append({"role": "assistant", "content": response.content})

            if response.stop_reason == "end_turn":
                for block in response.content:
                    if hasattr(block, "text"):
                        print(f"\n  Agent response: {block.text}")
                break

            if response.stop_reason == "tool_use":
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        print(f"\n  Tool called: {block.name}({block.input})")
                        # run_with_retry handles retries internally
                        # and always returns a structured envelope
                        result = run_with_retry(block.input.get("order_id", ""))
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(result),
                            # Mark error results so the model knows this was a failure
                            **({"is_error": True} if result["isError"] else {}),
                        })
                messages.append({"role": "user", "content": tool_results})


# =============================================================================
# MAIN
# =============================================================================
if __name__ == "__main__":
    if "--check" in sys.argv:
        run_self_check()
    else:
        print("Lab 2.1 — Exercise 2: Structured Errors & Retries")
        print(f"Model: {os.getenv('ANTHROPIC_MODEL', 'claude-sonnet-4-6')}\n")
        print("Running offline self-check first...")
        if run_self_check():
            print("\n\nSelf-check passed. Running live agent...\n")
            run_live_agent()
        else:
            print("\nSelf-check failed — fix the issues before running the live agent.")
            sys.exit(1)
