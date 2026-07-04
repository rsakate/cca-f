# CCA-F Certification Prep

This repository contains week-by-week learning materials, hands-on lab code, and notes for the **Claude Certified Associate - Fundamentals (CCA-F)** certification by Anthropic (AI Pioneers program).

Each week covers a module with slides, lab PDFs, and runnable Python exercises with detailed exam-oriented comments explaining the core concepts.

## Prerequisites

- Python 3.9+
- An Anthropic API key

## Setup

1. Clone the repo and navigate to it:
   ```bash
   git clone <repo-url>
   cd cca-f
   ```

2. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the project root with your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-...your-key-here...
   ```
   The `.env` file is gitignored and will not be committed.

## Running the Labs

Each lab's exercises are self-contained Python files. Navigate to the lab directory and run them:

```bash
# Week 1 — Lab 1.1
cd week-1/labs/1.1
python loop.py
python coordinator.py
python coordinator_v3.py

# Week 2 — Lab 2.1
cd week-2/labs/2.1
python exercise_1_tool_interfaces.py
python exercise_2_structured_errors.py --check   # offline self-check (no API key needed)
python exercise_2_structured_errors.py            # full run with API
python exercise_3_tool_choice.py
```

## Key CCA-F Exam Concepts Covered

- **Agentic Loop**: `stop_reason` values (`tool_use`, `end_turn`, `max_tokens`, `stop_sequence`) and correct message ordering
- **Tool Use**: Defining tools with JSON schemas, executing tool calls, returning `tool_result` messages
- **Multi-Agent Orchestration**: Coordinator/subagent (hub-and-spoke) pattern with memory isolation
- **Explicit Context Passing**: Typed `@dataclass` context objects vs. raw dict/variable passing
- **Programmatic Gating**: Code-enforced step ordering vs. prompt-only instructions
- **Tool Interface Design**: Name (object+action), description (when to use / when NOT to), typed parameters with regex patterns
- **Structured Errors**: Return failures as data (`isError`/`isRetryable` envelope), never exceptions
- **Selection Control**: `tool_choice` modes (`auto`, `any`, forced) — use the narrowest setting that works
