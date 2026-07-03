# CCA-F Certification Prep

This repository contains week-by-week learning materials, hands-on lab code, and notes for the **Claude Certified Associate - Fundamentals (CCA-F)** certification by Anthropic (AI Pioneers program).

## Repository Structure

```
cca-f/
├── README.md
├── requirements.txt
├── week-1/
│   ├── CCA-F_Module1_Agentic_Architecture.pptx   # Module 1 slides
│   ├── lab_1.pdf                                   # Lab 1.1 instructions
│   └── labs/
│       └── 1.1/                                    # Lab 1.1 — Building the Agentic Loop
│           ├── tools.py                            # Ex 1: Simulated classification tool
│           ├── loop.py                             # Ex 1: Agentic loop (correct implementation)
│           ├── loop_broken.py                      # Ex 1: Broken loop (wrong message order)
│           ├── loop_limited.py                     # Ex 1: Limited-iteration loop (anti-pattern)
│           ├── subagents.py                        # Ex 2: Four subagent functions
│           ├── coordinator.py                      # Ex 2: Hub-and-spoke coordinator
│           ├── subagents_no_context.py             # Ex 2: Subagents without context (memory isolation demo)
│           ├── coordinator_no_context.py           # Ex 2: Coordinator for memory isolation experiment
│           ├── context.py                          # Ex 3: TicketContext dataclass
│           ├── coordinator_v2.py                   # Ex 3: Coordinator with typed context passing
│           ├── gates.py                            # Ex 4: Programmatic gate functions
│           ├── coordinator_v3.py                   # Ex 4: Coordinator with step enforcement gates
│           └── coordinator_v3_sabotage.py          # Ex 4: Sabotage test to prove gates block
└── week-2/
    └── CCA-F_Module2_Tool_Design_MCP.pptx         # Module 2 slides
```

## Module Overview

### Week 1 — Agentic Architecture & Orchestration

**Lab 1.1: Building the Agentic Loop — Orchestration & Subagent Coordination**

Scenario: Enterprise Customer Support Triage Agent for Arctive (a B2B SaaS company).

Pipeline Flow:
```
Inbound Ticket -> [COORDINATOR] -> Classifier -> CRM Enricher -> Drafter -> Validator -> Outbound Response
```

| Exercise | Section | Core Concept |
|----------|---------|--------------|
| Ex 1 | S1 — Agentic Loop | `stop_reason` drives the loop; tool results are appended back into messages |
| Ex 2 | S2 — Orchestration | Hub-and-spoke: subagents have no shared memory; the coordinator owns state |
| Ex 3 | S3 — Context Passing | Structured context is passed explicitly; implicit assumptions produce wrong answers |
| Ex 4 | S4 — Step Enforcement | Code enforces order; prompt instructions alone are unreliable under load |

### Week 2 — Tool Design & MCP
*(In progress)*

## Setup

```bash
pip install -r requirements.txt
```

Requires `ANTHROPIC_API_KEY` set as an environment variable (or in a `.env` file).

## Key CCA-F Exam Concepts Covered

- **Agentic Loop**: `stop_reason` values (`tool_use`, `end_turn`, `max_tokens`, `stop_sequence`) and correct message ordering
- **Tool Use**: Defining tools with JSON schemas, executing tool calls, returning `tool_result` messages
- **Multi-Agent Orchestration**: Coordinator/subagent (hub-and-spoke) pattern with memory isolation
- **Explicit Context Passing**: Typed `@dataclass` context objects vs. raw dict/variable passing
- **Programmatic Gating**: Code-enforced step ordering vs. prompt-only instructions; `PipelineGateError` pattern
