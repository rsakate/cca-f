# CCA-F Certification Prep

This repository contains week-by-week learning materials, hands-on lab code, and exam-prep resources for the **Claude Certified Architect - Foundations (CCA-F)** certification by Anthropic (AI Pioneers program).

## Exam Overview

| Detail | Value |
|--------|-------|
| Questions | 60 |
| Duration | 120 minutes |
| Passing score | 720 / 1000 |
| Format | 4 scenarios drawn from a pool of 6 |
| Domains | 5 (Agentic Architecture 27%, Tool Design & MCP 18%, Claude Code Config 20%, Prompt Engineering 20%, Context Management 15%) |

## Repository Structure

```
cca-f/
├── week-1/          Module 1 — Agentic Architecture & Orchestration
├── week-2/          Module 2 — Tool Design & MCP
├── week-3/          Module 3 — Claude Code Configuration & Workflows
├── week-4/          Module 4 — Prompt Engineering & Structured Output
├── week-5/          Module 5 — Context Management & Reliability
├── scripts/         Utility scripts (review gate, PPTX generators)
├── ccaf_presentation.html   Complete study guide (34 slides)
├── ccaf_mock_test.html      Mock exam suite (80 scenario-based questions)
├── questions/               Domain-wise question banks (loaded by mock test)
│   ├── domain1_agentic_architecture.js
│   ├── domain2_tool_design_mcp.js
│   ├── domain3_claude_code_config.js
│   ├── domain4_prompt_engineering.js
│   └── domain5_context_reliability.js
└── requirements.txt
```

---

## Week-by-Week Modules & Labs

### Week 1 — Agentic Architecture & Orchestration (27%)

**Presentation:** `week-1/CCA-F_Module1_Agentic_Architecture.pptx`

| Lab | Title | Scenario | Duration | Sections |
|-----|-------|----------|----------|----------|
| 1.1 | Building the Agentic Loop: Orchestration & Subagent Coordination | Enterprise Customer Support Triage Agent | ~60 min | S1 (Agentic Loop), S2 (Multi-Agent Orchestration), S3 (Context Passing), S4 (Step Enforcement) |

**Key files:** `loop.py`, `coordinator.py`, `coordinator_v3.py`, `subagents.py`, `context.py`, `gates.py`, `tools.py`

**Concepts covered:** `stop_reason` values (`tool_use`, `end_turn`, `max_tokens`), agentic loop implementation, hub-and-spoke coordinator/subagent pattern, typed `@dataclass` context passing, programmatic step enforcement

---

### Week 2 — Tool Design & MCP (18%)

**Presentation:** `week-2/CCA-F_Module2_Tool_Design_MCP.pptx`

| Lab | Title | Scenario | Duration | Sections |
|-----|-------|----------|----------|----------|
| 2.1 | Designing Reliable Tools: Interfaces, Errors & Selection Control | AI Customer-Support Agent for an Online Outdoor-Gear Store | ~45 min | S1 (Tool Interfaces), S2 (Structured Errors & Retries), S3 (Selection Control) |
| 2.2 | Connecting the Ecosystem: MCP Servers & Built-in Claude Code Tools | Giving Claude Code Real Context at an Outdoor Store | ~40 min | S4 (MCP Server Integration), S5 (Built-in Tool Usage) |

**Lab 2.1 files:** `exercise_1_tool_interfaces.py`, `exercise_2_structured_errors.py`, `exercise_3_tool_choice.py`

**Lab 2.2 files:** `.mcp.json`, `mcp_servers/orders_server.py`, `mcp_servers/docs_server.py`, sample codebase with TypeScript source and tests

**Concepts covered:** Tool naming (object+action), `isError`/`isRetryable` structured error envelopes, `tool_choice` modes (`auto`, `any`, forced), MCP server wiring, Glob/Grep/Read/Edit built-in tools, incremental exploration pattern

---

### Week 3 — Claude Code Configuration & Workflows (20%)

**Presentation:** `week-3/CCA-F_Module3_Claude_Code_Config_Workflows.pptx`
**Self-paced plan:** `week-3/CCA-F_Module3_Self-Paced_Learning_Plan.pdf`

| Lab | Title | Scenario | Duration | Sections |
|-----|-------|----------|----------|----------|
| 3.1 | Configuring Claude Code: CLAUDE.md Hierarchy, Commands & Skills | Setting Up Claude Code for the NorthPeak Pricing Service | ~40 min | S1 (CLAUDE.md Configuration Hierarchy & Modularity), S2 (Custom Slash Commands & Skills) |
| 3.2 | Targeted Behavior: Path-Specific Rules & Plan Mode Workflows | Shipping Safe Changes to a Security- and Money-Critical Backend | ~40 min | S3 (Path-Specific Rules & Conditional Loading), S4 (Plan Mode vs Direct Execution) |
| 3.3 | From Refinement to Pipeline: Iterative Workflows & CI/CD Integration | Putting Claude Code on the NorthPeak Refunds Pipeline | ~40 min | S5 (Iterative Refinement Techniques), S6 (CI/CD Integration with Claude Code) |

**Lab 3.1 files:** `CLAUDE.md`, `.claude/rules/style.md`, `.claude/rules/testing.md`, `.claude/commands/review.md`, `.claude/commands/test.md`, `.claude/skills/changelog/SKILL.md`, pricing service source + tests

**Lab 3.2 files:** Per-module `CLAUDE.md` files (`src/auth/`, `src/orders/`, `src/payments/`), `.claude/agents/explorer.md`, service source + tests

**Lab 3.3 files:** `.claude/commands/pr-review.md`, `.github/workflows/claude-review.yml`, `scripts/review_gate.py`, sample review JSON output, refunds service source + tests

**Concepts covered:** CLAUDE.md hierarchy & `@import`, `.claude/rules/` with glob frontmatter, slash commands with `description`/`allowed-tools`/`argument-hint`, Skills with `SKILL.md`, Plan mode for risky changes, read-only explorer subagent, `claude -p` headless mode, `--output-format json`, CI/CD pass/fail gates

---

### Week 4 — Prompt Engineering & Structured Output (20%)

**Presentation:** `week-4/CCA-F_Module4_Prompt_Engineering_Structured_Output.pptx`

| Lab | Title | Scenario | Duration | Sections |
|-----|-------|----------|----------|----------|
| 4.1 | Precision Prompting: Explicit Criteria & Few-Shot Consistency | Trust & Safety Moderation Triage Classifier (Remove/Review/Allow) | ~40 min | S1 (Designing Prompts with Explicit Criteria), S2 (Few-Shot Prompting for Consistency & Generalization) |
| 4.2 | Enforcing Structure: tool_use Schemas with Validation & Retry | Recruiting Candidate-Screening Evaluator (strong_hire/hire/no_hire) | ~45 min | S3 (Structured Output using `tool_use` & JSON Schema), S4 (Validation, Retry & Feedback Loops) |
| 4.3 | Scaling Output: Batch Processing & Multi-Pass Review | News & Media-Monitoring Pipeline (Helix Robotics coverage) | ~45 min | S5 (Batch Processing with Claude API), S6 (Multi-Instance & Multi-Pass Architectures) |

**Lab 4.1 files:** `exercise_1_explicit_criteria.py`, `exercise_2_few_shot.py`, `exercise_3_generalization.py`

**Lab 4.2 files:** `exercise_1_tool_schema.py`, `exercise_2_validation.py`, `exercise_3_retry_loop.py`

**Lab 4.3 files:** `exercise_1_message_batches.py`, `exercise_2_parallel.py`, `exercise_3_multipass.py`

**Concepts covered:** Explicit classification criteria to reduce false positives, few-shot examples for consistent output format, generalization principles, `tool_use` with JSON Schema for structured output, semantic validation beyond schema, retry-and-feedback loops with `is_error=True`, Message Batches API with `custom_id`, `ThreadPoolExecutor` for parallel processing, multi-pass draft-critique-refine review

---

### Week 5 — Context Management & Reliability (15%)

**Presentation:** `week-5/CCA-F_Module5_Context_Management_Reliability.pptx`
**Self-paced plan:** `week-5/CCA-F_Module5_Self-Paced_Learning_Plan.pdf`

| Lab | Title | Scenario | Duration | Sections |
|-----|-------|----------|----------|----------|
| 5.1 | Managing Context: Preservation, Optimization & Escalation | E-commerce Customer Support Agent (multi-turn, multi-order session) | ~45 min | S1 (Context Preservation & Optimization), S2 (Escalation & Ambiguity Resolution Patterns) |
| 5.2 | Resilient Systems: Error Propagation & Large Codebase Exploration | Healthcare Claims Processing Pipeline (Intake -> Validation -> Adjudication) | ~45 min | S3 (Error Propagation in Multi-Agent Systems), S4 (Context Management in Large Codebase Exploration) |
| 5.3 | Trust & Traceability: Human Review, Confidence & Provenance | AI Compliance Reviewer for Quarterly Financial Reports | ~45 min | S5 (Human Review & Confidence Calibration), S6 (Information Provenance & Uncertainty Handling) |

**Lab 5.1 files:** `main.py`, `case_facts.py`, `tool_optimizer.py`, `sample_data.py`

**Lab 5.2 files:** `main.py`, `agents.py`, `scratchpad.py`, `sample_claims.py`

**Lab 5.3 files:** `main.py`, `confidence.py`, `reviewer.py`, `sample_report.py`

**Concepts covered:** `[CASE FACTS]` blocks for persistent context, tool output optimization, escalation vs. guessing on ambiguity, `StageResult` error envelopes for multi-agent pipelines, disk-backed scratchpad for crash recovery, confidence calibration for auto-clear vs. human escalation, tamper-proof provenance (line + quoted text), dual-pass confirmed vs. contested findings

---

## Exam Study Resources

### Study Guide Presentation (`ccaf_presentation.html`)

A comprehensive **34-slide interactive presentation** covering all 5 exam domains and 33 task statements. Open in any browser.

**What's inside:**
- Agentic loop mechanics, `stop_reason` handling, message ordering
- Multi-agent orchestration (hub-and-spoke, AgentDefinition config)
- Programmatic gating vs. prompt-based guidance
- PostToolUse hooks for data normalization & compliance interception
- Tool interface design, structured errors, `tool_choice` modes
- MCP server configuration & MCP resources as content catalogs
- CLAUDE.md hierarchy, `.claude/rules/` with glob frontmatter, Skills with `argument-hint`
- Slash commands, Plan mode, iterative refinement
- CI/CD integration (`claude -p`, `--output-format json`, `--json-schema`, session context isolation)
- Explicit criteria, few-shot prompting, generalization principles
- Structured output via `tool_use`, nullable fields, enum "unclear"/"other" patterns
- Batch API (50% savings, `custom_id`, no multi-turn tool calling)
- Validation, retry & self-correction flows (stated vs. calculated totals)
- Context preservation, tool output optimization, escalation triggers
- Human review, confidence calibration, multi-pass review architecture
- Information provenance, temporal data handling, coverage annotations

### Mock Exam Suite (`ccaf_mock_test.html`)

An **80-question scenario-based mock exam** matching the real exam format — organized across all 5 domains and all 6 exam scenarios. Includes unique questions from Mock Tests 2 and 3. Open in any browser — no server required.

**Exam Modes:**

| Mode | Description |
|------|-------------|
| **Exam Mode** | Timed test simulating real exam conditions. Select an answer and click "Check Answer" per question. See results as you go, or submit all at the end. Timer counts down and scores are calculated against the 70% passing threshold. |
| **Practice Mode** | Untimed, self-paced study. Select an answer, click "Check Answer" to see instant correct/incorrect feedback with detailed explanations. Ideal for learning and understanding concepts. |
| **Review Mode** | All correct answers and explanations are shown upfront. Browse through every question to study the reasoning and exam patterns without answering. |

**Features:**
- Module-based filtering — attempt by single domain or full exam simulation
- Scenario-tagged questions matching the 6 exam scenarios
- Per-question "Check Answer" with detailed explanations
- Flag questions for later review
- Navigation dots for quick jumping between questions
- Score breakdown by module with pass/fail indicator
- Post-exam review with filters (All / Incorrect / Correct / Flagged / Unanswered)

**Question distribution:**

| Module | File | Questions |
|--------|------|-----------|
| M1 — Agentic Architecture & Orchestration (27%) | `questions/domain1_agentic_architecture.js` | 19 |
| M2 — Tool Design & MCP (18%) | `questions/domain2_tool_design_mcp.js` | 18 |
| M3 — Claude Code Configuration & Workflows (20%) | `questions/domain3_claude_code_config.js` | 14 |
| M4 — Prompt Engineering & Structured Output (20%) | `questions/domain4_prompt_engineering.js` | 15 |
| M5 — Context Management & Reliability (15%) | `questions/domain5_context_reliability.js` | 14 |

**Scenario coverage:**
1. Customer Support Resolution Agent
2. Code Generation with Claude Code
3. Multi-Agent Research System
4. Developer Productivity with Claude
5. Claude Code for Continuous Integration
6. Structured Data Extraction

---

## Prerequisites

- Python 3.9+ (3.10+ for weeks 3-5)
- An Anthropic API key
- Claude Code CLI (for week 3 labs)
- VS Code with Claude Code extension (optional, for lab 3.1/3.2)

## Setup

1. Clone the repo:
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

## Running the Labs

Each lab has self-contained Python exercises. Navigate to the lab directory and run:

```bash
# Week 1 — Lab 1.1
cd week-1/labs/1.1
python loop.py
python coordinator.py
python coordinator_v3.py

# Week 2 — Lab 2.1
cd week-2/labs/2.1
python exercise_1_tool_interfaces.py
python exercise_2_structured_errors.py --check   # offline self-check (no API key)
python exercise_2_structured_errors.py            # full run with API
python exercise_3_tool_choice.py

# Week 2 — Lab 2.2 (run inside Claude Code)
cd week-2/labs/2.2
# Open in Claude Code — MCP servers auto-connect via .mcp.json

# Week 3 — Labs 3.1-3.3 (run inside Claude Code / VS Code)
cd week-3/labs/3.1
# Use Claude Code with CLAUDE.md, slash commands, and skills

# Week 4 — Labs 4.1-4.3
cd week-4/labs/4.1
python exercise_1_explicit_criteria.py
python exercise_2_few_shot.py
python exercise_3_generalization.py

# Week 5 — Labs 5.1-5.3
cd week-5/labs/5.1
python main.py
```
