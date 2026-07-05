# =============================================================================
# loop_vertex.py — Vertex AI Authentication variant of loop.py
# =============================================================================
# PURPOSE:
#   Identical agentic loop as loop.py, but authenticates via GCP Vertex AI
#   instead of a direct Anthropic API key.
#
# SETUP:
#   1. Run: gcloud auth application-default login
#   2. Set env vars in .env:
#        VERTEX_AI_PROJECT_ID=wscc-dev-mgmt-wsky
#        VERTEX_AI_REGION=us-east5
#      (remove ANTHROPIC_API_KEY — it's not needed)
#   3. Install: pip install google-auth
#
# WHAT CHANGED vs loop.py:
#   - anthropic.Anthropic(api_key=...) → AnthropicVertex(project_id=..., region=...)
#   - Everything else (tools, messages, agentic loop) is identical.
# =============================================================================

import json
import os

from anthropic import AnthropicVertex
from dotenv import load_dotenv
from tools import classify_ticket

load_dotenv()

client = AnthropicVertex(
    project_id=os.getenv("VERTEX_AI_PROJECT_ID"),
    region=os.getenv("VERTEX_AI_REGION"),
)

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
