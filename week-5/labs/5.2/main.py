"""
Lab 5.2 — Resilient Systems: Error Propagation & Large Codebase Exploration

Scenario: A Healthcare Claims Processing Pipeline (Intake -> Validation -> Adjudication)

This lab fixes two production failure modes with three composable pieces:

  Demo 1 (S3) — StageResult error envelope
      Every subagent returns StageResult(stage, ok, data, error) — never
      raises.  The coordinator inspects result.ok and reacts.

  Demo 2 (S4) — Disk-backed scratchpad
      Every stage's finding is logged to scratchpad.json via pad.log();
      mark_done / mark_failed set the per-claim status.

  Demo 3 (S4) — Crash-recovery skip rule
      On restart the coordinator reads the scratchpad and skips claims
      whose status is done or failed.  Re-runs do only unfinished work.

Run:  python main.py          # first run — processes all three claims
      python main.py          # second run — skips already-finished claims
      rm scratchpad.json      # manual reset to start fresh
"""

from sample_claims import CLAIMS
from agents import run_intake, run_validation, run_adjudication
from scratchpad import Scratchpad


def process_claim(claim: dict, pad: Scratchpad) -> str:
    """Walk a single claim through all three stages.

    After every stage the result is logged.  On the first ok=False the
    claim is marked failed with the offending stage and error string.
    Only after all three stages succeed is the claim marked done.
    """
    claim_id = claim["claim_id"]
    stages = [
        ("intake", run_intake),
        ("validation", run_validation),
        ("adjudication", run_adjudication),
    ]
    for stage_name, fn in stages:
        result = fn(claim)
        pad.log(claim_id, stage_name, result.to_dict())
        print(f"  {stage_name}...{'ok' if result.ok else 'FAIL'}"
              f"{'' if result.ok else f' ({result.error})'}")
        if not result.ok:
            pad.mark_failed(claim_id, f"{stage_name}: {result.error}")
            return "failed"
    pad.mark_done(claim_id)
    return "done"


def main():
    print("Lab 5.2 — Resilient Systems: Error Propagation & Large Codebase Exploration")
    print("=" * 70)

    pad = Scratchpad("scratchpad.json")

    done_count = 0
    failed_count = 0
    skipped_count = 0

    for claim in CLAIMS:
        claim_id = claim["claim_id"]
        status = pad.status(claim_id)

        # ----- Crash recovery: skip claims already finished. -----
        if status in ("done", "failed"):
            print(f"[CLAIM {claim_id}] (already {status}, skipping)")
            skipped_count += 1
            continue

        print(f"[CLAIM {claim_id}] processing...")
        final = process_claim(claim, pad)
        if final == "done":
            done_count += 1
        else:
            failed_count += 1

    print("\n" + "-" * 40)
    print(f"done: {done_count}   failed: {failed_count}   skipped: {skipped_count}")
    print("-" * 40)

    if skipped_count > 0:
        print("(Some claims were skipped — they were already done/failed from a previous run.)")
        print("(Delete scratchpad.json to reset and reprocess all claims.)")


if __name__ == "__main__":
    main()
