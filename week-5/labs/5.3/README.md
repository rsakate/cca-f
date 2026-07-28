# Lab 5.3 — Trust & Traceability: Human Review, Confidence & Provenance

**Module:** M5 — Context Management & Reliability  
**Sections:** S5 (Human Review & Confidence Calibration), S6 (Information Provenance & Uncertainty Handling)  
**Scenario:** An AI Compliance Reviewer for Quarterly Financial Reports

## Overview

An AI finding is only useful in a regulated industry if a human can trust it. This lab builds a command-line compliance reviewer that scans a quarterly financial report and makes each finding trustworthy three ways:

| Demo | Technique | Core Idea |
|------|-----------|-----------|
| Demo 1 | Confidence calibration & routing (S5) | Score each finding 0..1; route by a threshold to auto-clear or human review |
| Demo 2 | Provenance (S6) | Attach the exact source line + quote locally — never trust the model to copy it |
| Demo 3 | Confirmed vs. contested (S5+S6) | Run two passes with different prompts; confirm on agreement, contest on disagreement |

## The Finding & the Three Buckets

```
finding shape:   {line, quote, flag, confidence}    (quote attached locally, not by the model)

auto_clear    -> in BOTH passes AND avg confidence >= CONFIDENCE_THRESHOLD (0.75)
human_review  -> in both passes BUT below the threshold
contested     -> flagged by only ONE of the two passes
```

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # paste your key into .env
python main.py
```

## File Inventory

| File | Role | Purpose |
|------|------|---------|
| `main.py` | entry | Runs two passes and prints the three buckets with provenance |
| `confidence.py` | D1/3 (S5) | Buckets findings into `auto_clear` / `human_review` / `contested` |
| `reviewer.py` | D2 (S6) | Claude review pass; parses JSON and attaches the quote locally |
| `sample_report.py` | data | Mock report (one line each); `get_numbered_report()` & `get_quote()` |

## Reflection Questions

### Demo 1 — Confidence Calibration & Routing (S5)

1. **Why route low-confidence findings to a human instead of just lowering the bar and auto-clearing everything?**
   - A wrong auto-clear is a missed compliance issue — in regulated industries, this can mean fines, legal liability, or audit failures. Low-confidence findings represent cases where the model is unsure, which is exactly when human judgment adds the most value. Auto-clearing everything trades real compliance risk for throughput — a bad trade in any regulated context.

2. **The threshold is 0.75. What happens to throughput and to risk as you raise or lower it?**
   - **Raise to 0.9:** Fewer findings auto-clear, more go to human review. Throughput decreases (humans review more), but risk of missing something drops. Good for high-stakes contexts (banking, healthcare).
   - **Lower to 0.5:** More findings auto-clear, fewer go to humans. Throughput increases, but you risk auto-clearing findings the model was genuinely uncertain about. Good for low-stakes contexts where speed matters more than catching every issue.
   - There is no universally right value — it's a deliberate tradeoff between speed and safety.

3. **Why calibrate confidence per finding rather than reporting one aggregate accuracy for the whole report?**
   - A report might have one obvious issue (high confidence) and one ambiguous one (low confidence). Aggregate accuracy obscures this: a "90% accurate" report could mean the model missed the one critical issue. Per-finding confidence lets the routing be precise — the obvious finding auto-clears while the ambiguous one gets human eyes.

### Demo 2 — Provenance (S6)

4. **The model returns only a line number; the quote is attached locally from the report. Why not let the model return the quote text too?**
   - A model-copied quote can be altered, truncated, or entirely invented (hallucinated). By attaching the quote locally from the source data using the line number, the citation is guaranteed to match the real document. An auditor can verify any flag in one click because the quote comes from the source of truth, not from the model's imperfect memory.

5. **The parser treats a JSON parse failure as zero findings rather than crashing. Why is that the right call in this pipeline?**
   - One bad model response shouldn't take down the entire compliance review run. Treating a parse failure as zero findings is a graceful degradation — the worst case is a more conservative review (fewer auto-clears), not a crash. The finding will show up as "not flagged" rather than crashing the pipeline, and the other review pass can still catch the issue.

6. **A finding whose line number is out of range is dropped. Why validate the line against the real report?**
   - An out-of-range line number has no verifiable source — there is no text at that line to quote. Including it would create a finding with no provenance, which defeats the entire purpose of the provenance system. Dropping it is the honest thing to do: if you can't prove where a finding came from, you can't ask a human to act on it.

### Demo 3 — Confirmed vs. Contested (S5+S6)

7. **Why run two passes with different prompts instead of one pass, or the same prompt twice?**
   - One pass is a single fallible opinion — no corroboration. The same prompt twice would give correlated errors (the same bias twice is not independence). Different prompts (strict compliance vs. general financial review) produce semi-independent opinions: they approach the document from different angles, so agreement between them carries more weight than agreement between identical reviewers. This is the "four-eyes" dual-review control regulators expect.

8. **A line flagged by only one pass becomes "contested" rather than auto-cleared or dropped. Why surface disagreement to a human instead of resolving it automatically?**
   - Disagreement between two independent reviewers is a signal of genuine ambiguity — exactly the kind of case where human judgment matters most. Auto-clearing a contested finding risks missing something one reviewer caught. Dropping it silences a legitimate concern. Surfacing it to a human with both passes' flags gives the compliance officer the information to make an informed call.

9. **Confirmed findings still pass through the confidence threshold. Why combine agreement AND confidence rather than trusting agreement alone?**
   - Two passes can agree and both be unsure — agreement doesn't mean certainty. A finding where both passes say "this might be an issue" (confidence 0.5 each) is fundamentally different from one where both passes say "this is definitely an issue" (confidence 0.95 each). Requiring agreement AND confidence above threshold before auto-clearing is a defense-in-depth strategy: neither signal alone is sufficient, but together they make the bar a regulated workflow has to clear.
