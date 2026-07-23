"""
Lab 4.3 — Exercise 2: Parallel Processing for Throughput (S6)

Implements run_parallel() with a ThreadPoolExecutor to classify headlines
concurrently. Compares sequential vs parallel wall-clock time.
"""

import os, time, anthropic
from concurrent.futures import ThreadPoolExecutor

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")

PROMPT = (
    "Classify the sentiment of this news headline about Helix Robotics "
    "as positive, negative, or neutral. Reply with one word only.\n\n"
    "Headline: {h}"
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


def classify(client, headline):
    """Classify a single headline via the Claude API."""
    msg = client.messages.create(
        model=MODEL,
        max_tokens=20,
        messages=[{"role": "user", "content": PROMPT.format(h=headline)}],
    )
    return msg.content[0].text.strip()


def run_sequential(client, headlines):
    """Classify headlines one at a time and return (results, elapsed)."""
    t0 = time.time()
    results = [classify(client, h) for h in headlines]
    return results, time.time() - t0


def run_parallel(client, headlines, workers=5):
    """Classify headlines concurrently with a ThreadPoolExecutor."""
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=workers) as pool:
        results = list(pool.map(lambda h: classify(client, h), headlines))
    return results, time.time() - t0


def main():
    client = anthropic.Anthropic()

    print(f"{'=' * 70}")
    print("  EXERCISE 2 — Sequential vs Parallel (ThreadPoolExecutor)")
    print(f"{'=' * 70}\n")

    # Sequential
    print("  Running sequential...")
    seq_results, seq_time = run_sequential(client, HEADLINES)

    print(f"\n  Sequential results ({seq_time:.1f}s):")
    for h, r in zip(HEADLINES, seq_results):
        print(f"    {r:<10} | {h[:55]}...")

    # Parallel
    print(f"\n  Running parallel (workers=5)...")
    par_results, par_time = run_parallel(client, HEADLINES, workers=5)

    print(f"\n  Parallel results ({par_time:.1f}s):")
    for h, r in zip(HEADLINES, par_results):
        print(f"    {r:<10} | {h[:55]}...")

    # Comparison
    speedup = seq_time / par_time if par_time > 0 else float("inf")
    print(f"\n{'─' * 70}")
    print(f"  COMPARISON")
    print(f"{'─' * 70}")
    print(f"  Sequential: {seq_time:.1f}s")
    print(f"  Parallel:   {par_time:.1f}s")
    print(f"  Speedup:    {speedup:.1f}x")
    print()


if __name__ == "__main__":
    main()
