"""
Lab 4.3 — Exercise 1: Classify a Workload with the Message Batches API (S5)

Builds batch requests with custom_id per headline, submits via
client.messages.batches.create(), polls until processing_status == "ended",
and collects results by custom_id.

Supports --fetch <batch_id> to re-fetch results from a previous batch.
"""

import os, sys, time, anthropic

MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
client = anthropic.Anthropic()

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


def build_requests(headlines):
    """Build a list of batch request dicts, one per headline."""
    return [
        {
            "custom_id": f"headline-{i}",
            "params": {
                "model": MODEL,
                "max_tokens": 20,
                "messages": [{"role": "user", "content": PROMPT.format(h=h)}],
            },
        }
        for i, h in enumerate(headlines)
    ]


def submit_and_poll(requests, deadline_seconds=600):
    """Submit the batch and poll until ended or deadline."""
    batch = client.messages.batches.create(requests=requests)
    print(f"  Batch submitted: {batch.id}")

    deadline = time.time() + deadline_seconds

    while True:
        batch = client.messages.batches.retrieve(batch.id)
        print(f"  status: {batch.processing_status} | counts: {batch.request_counts}")

        if batch.processing_status == "ended":
            break

        if time.time() > deadline:
            print(f"  Still processing. Fetch later with --fetch {batch.id}")
            return batch

        time.sleep(10)

    return batch


def collect_results(batch_id):
    """Iterate results and print by custom_id."""
    print(f"\n  Results for batch {batch_id}:")
    print(f"  {'─' * 50}")

    for entry in client.messages.batches.results(batch_id):
        if entry.result.type == "succeeded":
            text = "".join(
                b.text for b in entry.result.message.content
                if b.type == "text"
            ).strip()
            print(f"  {entry.custom_id}: {text}")
        else:
            print(f"  {entry.custom_id}: ERROR ({entry.result.type})")

    print()


def main():
    # --fetch mode: re-fetch results from a previous batch
    if "--fetch" in sys.argv:
        idx = sys.argv.index("--fetch")
        if idx + 1 < len(sys.argv):
            batch_id = sys.argv[idx + 1]
            collect_results(batch_id)
            return
        else:
            print("Usage: python exercise_1_message_batches.py --fetch <batch_id>")
            sys.exit(1)

    print(f"{'=' * 70}")
    print("  EXERCISE 1 — Message Batches API")
    print(f"{'=' * 70}\n")

    requests = build_requests(HEADLINES)
    print(f"  Built {len(requests)} requests\n")

    batch = submit_and_poll(requests)

    if batch.processing_status == "ended":
        collect_results(batch.id)


if __name__ == "__main__":
    main()
