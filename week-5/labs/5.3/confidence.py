"""
confidence.py — Confidence calibration & routing (Demo 1/3, S5)

Buckets findings from two review passes into three categories:

  auto_clear   -> in BOTH passes AND avg confidence >= CONFIDENCE_THRESHOLD
  human_review -> in both passes BUT below the threshold
  contested    -> flagged by only ONE of the two passes

The threshold is an explicit, tunable dial that trades throughput against
the cost of a missed compliance issue.
"""

CONFIDENCE_THRESHOLD = 0.75


def bucket(pass_a: list[dict], pass_b: list[dict]) -> dict:
    """Compare two review passes and bucket findings.

    Findings are matched by line number — the same line in both passes
    is the same finding.  Agreement + confidence decides the bucket.

    Returns a dict with keys: auto_clear, human_review, contested.
    """
    auto_clear = []
    human_review = []
    contested = []

    # Index both passes by line number
    a_by_line = {f["line"]: f for f in pass_a}
    b_by_line = {f["line"]: f for f in pass_b}

    all_lines = sorted(set(a_by_line.keys()) | set(b_by_line.keys()))

    for line in all_lines:
        a = a_by_line.get(line)
        b = b_by_line.get(line)

        if a and b:
            # Both passes flagged this line — confirmed
            avg_conf = (a["confidence"] + b["confidence"]) / 2
            entry = {
                "line": line,
                "quote": a["quote"],
                "flag": a["flag"],
                "confidence_avg": round(avg_conf, 3),
                "flag_pass_a": a["flag"],
                "flag_pass_b": b["flag"],
            }
            if avg_conf >= CONFIDENCE_THRESHOLD:
                auto_clear.append(entry)
            else:
                human_review.append(entry)
        else:
            # Only one pass flagged it — contested
            finding = a or b
            contested.append({
                "line": line,
                "quote": finding["quote"],
                "flag_pass_a": a["flag"] if a else None,
                "flag_pass_b": b["flag"] if b else None,
                "confidence": finding["confidence"],
            })

    return {
        "auto_clear": auto_clear,
        "human_review": human_review,
        "contested": contested,
    }
