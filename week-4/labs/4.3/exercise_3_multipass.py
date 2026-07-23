"""
Lab 4.3 — Exercise 3: Multi-Pass Review for Higher Quality (S6)

Implements a three-pass pipeline: draft -> critique -> refine.
The critique step lists concrete problems against STANDARDS (no rewriting).
The refine step applies the critique to produce a final briefing.
"""

import os, anthropic

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
client = anthropic.Anthropic()

STANDARDS = (
    "Briefing standards: lead with the single most important development; balance "
    "positive and negative coverage fairly; be specific (numbers, who/what); stay "
    "neutral in tone; no speculation beyond the headlines; keep it under 120 words."
)

HEADLINES = [
    "Helix Robotics raises $200M Series C to expand warehouse automation",
    "Helix Robotics faces class-action lawsuit over workplace safety claims",
    "Helix Robotics partners with Toyota to co-develop next-gen assembly bots",
    "Helix Robotics Q3 revenue misses analyst estimates by 12%",
    "Helix Robotics CEO keynotes World Robotics Forum on ethical AI",
    "Helix Robotics recalls 500 units after sensor malfunction reports",
    "Helix Robotics opens new R&D center in Munich, creating 300 jobs",
    "Analysts downgrade Helix Robotics stock amid supply chain concerns",
]


def ask(prompt: str) -> str:
    """Send a single prompt and return the text response."""
    msg = client.messages.create(
        model=MODEL,
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text.strip()


def draft_briefing(headlines: list[str]) -> str:
    """Pass 1: generate a first-draft briefing from the headlines."""
    joined = "\n".join(f"- {h}" for h in headlines)
    prompt = f"Write a briefing from these headlines:\n{joined}"
    return ask(prompt)


def critique(headlines: list[str], draft_text: str) -> str:
    """Pass 2: list concrete problems against STANDARDS. Do NOT rewrite."""
    joined = "\n".join(f"- {h}" for h in headlines)
    prompt = (
        f"{STANDARDS}\n\n"
        f"Headlines:\n{joined}\n\n"
        f"Draft briefing:\n{draft_text}\n\n"
        "Critique the draft against the standards above. List specific, actionable "
        "problems as short bullets (e.g. buries the regulatory probe, omits the "
        "12% figure, too long, leans positive). Do NOT rewrite — only list issues."
    )
    return ask(prompt)


def refine(headlines: list[str], draft_text: str, critique_text: str) -> str:
    """Pass 3: rewrite the briefing, fixing every point in the critique."""
    joined = "\n".join(f"- {h}" for h in headlines)
    prompt = (
        f"{STANDARDS}\n\n"
        f"Headlines:\n{joined}\n\n"
        f"Draft briefing:\n{draft_text}\n\n"
        f"Critique to address:\n{critique_text}\n\n"
        "Rewrite the briefing so it fixes every point in the critique and meets the "
        "standards. Output only the final briefing text."
    )
    return ask(prompt)


def main():
    print(f"{'=' * 70}")
    print("  EXERCISE 3 — Multi-Pass Review (draft → critique → refine)")
    print(f"{'=' * 70}")

    # Pass 1: Draft
    print("\n  Generating draft...")
    draft = draft_briefing(HEADLINES)
    print(f"\n  {'─' * 60}")
    print(f"  DRAFT (pass 1):")
    print(f"  {'─' * 60}")
    print(f"  {draft}")
    word_count = len(draft.split())
    print(f"\n  [Word count: {word_count}]")

    # Pass 2: Critique
    print(f"\n  Critiquing draft...")
    critique_text = critique(HEADLINES, draft)
    print(f"\n  {'─' * 60}")
    print(f"  CRITIQUE (pass 2):")
    print(f"  {'─' * 60}")
    print(f"  {critique_text}")

    # Pass 3: Refine
    print(f"\n  Refining based on critique...")
    refined = refine(HEADLINES, draft, critique_text)
    print(f"\n  {'─' * 60}")
    print(f"  REFINED (pass 3):")
    print(f"  {'─' * 60}")
    print(f"  {refined}")
    refined_word_count = len(refined.split())
    print(f"\n  [Word count: {refined_word_count}]")

    # Summary
    print(f"\n{'─' * 70}")
    print(f"  SUMMARY")
    print(f"{'─' * 70}")
    print(f"  Draft word count:   {word_count}")
    print(f"  Refined word count: {refined_word_count}")
    print(f"  Target:             <= 120 words")
    print()


if __name__ == "__main__":
    main()
