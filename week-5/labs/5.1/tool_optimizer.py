"""
tool_optimizer.py — Tool output optimization (Demo 2, S1)

Raw tool outputs from a real database contain dozens of fields the model
does not need.  Pasting all of that into the conversation burns tokens,
buries the useful fields under noise, and pushes earlier turns (including
the [CASE FACTS] block) closer to eviction.

The fix is a per-tool whitelist: optimize(tool_name, raw) keeps only
the fields the current intent needs.  Unknown tools pass through
untouched — in production you would log a warning so unconfigured
tools don't sneak past.
"""

# Fields we actually care about for each tool.  Anything not in this list
# is dropped before the result reaches the model.
RELEVANT_FIELDS = {
    "lookup_orders":     ["order_id", "status", "placed_on", "total"],
    "get_order_details": ["order_id", "status", "placed_on", "total", "items"],
}


def optimize(tool_name: str, raw_result):
    """Trim a tool's raw output to just the whitelisted fields.

    Preserves the shape (list or dict) of the original.
    Unknown tools pass through untouched — in production you'd log
    a warning here so unconfigured tools don't sneak past.
    """
    keep = RELEVANT_FIELDS.get(tool_name)
    if keep is None:
        return raw_result
    if isinstance(raw_result, list):
        return [{k: row[k] for k in keep if k in row} for row in raw_result]
    if isinstance(raw_result, dict):
        return {k: raw_result[k] for k in keep if k in raw_result}
    return raw_result
