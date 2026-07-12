# Lab 3.1 - Claude Code Configuration & Project Memory

## Lab Overview

This lab explores how to configure Claude Code's behavior through project-level rules, custom slash commands, and skills. The `.claude/` directory in this project demonstrates a complete configuration setup:

```
.claude/
  rules/
    testing.md      # Testing standards (sentence-style names, boundary coverage)
    style.md        # Code style rules (pure functions, type hints, validation)
  commands/
    review.md       # /review - checklist-based code review (read-only)
    test.md         # /test - run pytest and summarize results
  skills/
    changelog/
      SKILL.md      # changelog skill - auto-generate CHANGELOG entries
```

## Reflection Questions

### 1. Why keep rules in small `@imported` files instead of pasting everything into one big `CLAUDE.md` -- what do you gain in maintenance and reuse?

Breaking rules into small, focused files (e.g., `rules/testing.md`, `rules/style.md`) provides several concrete advantages over a monolithic `CLAUDE.md`:

- **Single Responsibility**: Each file owns one concern. When testing standards change, you edit `testing.md` without risk of accidentally breaking a style rule in the same file. The blast radius of any edit is limited to one topic.

- **Reuse Across Projects**: A `testing.md` file can be copied or symlinked into multiple repositories. With a single `CLAUDE.md`, you would need to copy-paste fragments and keep them in sync manually -- a recipe for drift.

- **Easier Code Review**: A PR that changes `rules/style.md` is immediately understandable -- it modifies style rules. A PR that edits line 47-52 of a 200-line `CLAUDE.md` forces the reviewer to figure out which concern is actually changing.

- **Selective Loading**: Claude Code loads rule files from the `.claude/rules/` directory automatically. Smaller files mean each rule set is a discrete, toggleable unit -- you could remove or rename a file to temporarily disable a rule category without deleting content.

- **Team Collaboration**: Different team members or roles can own different rule files. The QA lead maintains `testing.md`, the tech lead maintains `style.md`, and merge conflicts between them are impossible because they live in separate files.

### 2. Claude answered the testing-rules question without opening `testing.md`. What does that tell you about when project memory is loaded, and why does that matter for every later request?

Claude Code loads all `.claude/rules/` files **at conversation start**, before the first user message is even processed. The content of `testing.md` and `style.md` was injected into the system context automatically -- that is why Claude could recite the testing rules verbatim without making a `Read` tool call.

This has important implications:

- **Rules are always active**: Every response Claude gives in the conversation is shaped by these rules from the very first message. There is no "cold start" where Claude doesn't know your standards -- it knows them before you type anything.

- **No explicit reminding needed**: You do not need to say "remember to follow our testing rules" in each prompt. The rules are already part of Claude's context and will be applied to code generation, reviews, and suggestions automatically.

- **Context window cost**: Because rules are loaded upfront, they consume tokens in every request. This is why keeping rule files concise matters -- verbose rules waste context on every single interaction, leaving less room for actual code and conversation.

- **Consistency across the session**: Whether you ask Claude to write code in your first message or your fiftieth, the same rules apply. This is what makes project-level configuration reliable rather than dependent on the user remembering to include instructions.

### 3. A user-level `~/.claude/CLAUDE.md` rule and a project rule could conflict. How does the hierarchy resolve that, and when would you put a rule at the user level vs. the project level?

**How the hierarchy resolves conflicts:**

Claude Code follows a layered configuration model with increasing specificity:

1. **User-level** (`~/.claude/CLAUDE.md`) -- personal defaults that apply to every project you open.
2. **Project-level** (`.claude/rules/*.md` or `CLAUDE.md` in the repo root) -- shared team standards checked into version control.
3. **Folder-level** (`CLAUDE.md` files in subdirectories) -- overrides scoped to specific parts of the codebase.

When rules conflict, **the more specific (project/folder) rule takes precedence** over the more general (user-level) rule. This mirrors how CSS specificity or Git config (`--local` overrides `--global`) works. The project is the shared contract -- it should not be overridden silently by one developer's personal preferences.

**When to use each level:**

| Level | Use When | Examples |
|-------|----------|----------|
| **User-level** (`~/.claude/`) | The preference is personal, not team-specific. It should follow you across every repo. | "I prefer concise responses", "Always explain your reasoning", tone/verbosity preferences |
| **Project-level** (`.claude/rules/`) | The rule is a shared team standard that every contributor must follow. It belongs in version control. | Testing conventions, code style, commit message format, security policies |

The guiding principle: **if the rule matters for code correctness or team consistency, it belongs in the project**. If it is purely about how Claude communicates with you as an individual, it belongs at the user level.

### 4. A skill is auto-invoked by its description; a slash command is called explicitly by name. When is each the right way to package a piece of work?

**Use a slash command** when the action is deliberate and the user should consciously decide to run it. Commands are for operations with clear side effects or specific outputs that you want on demand -- not automatically. Examples:

- `/test` -- you choose when to run the test suite (e.g., after making changes, not on every message).
- `/review` -- you want a structured code review at a specific moment, not every time you mention code quality.

Commands are the right choice when: the task has a clear trigger moment, the user needs to pass arguments (like `/review pricing.py`), or the operation should never happen by accident.

**Use a skill** when the work should happen naturally in response to intent, without the user needing to remember a command name. Skills are for workflows that Claude should recognize and reach for automatically. Examples:

- The changelog skill fires when you say "update the changelog" or "write release notes" -- you describe what you want in plain language, and Claude matches it to the skill.
- A formatting skill could fire whenever you say "clean up this code" without needing to know `/format` exists.

Skills are the right choice when: the trigger is a natural-language intent (not a deliberate command), the workflow benefits from being discoverable without documentation, or you want consistency across team members who might phrase the request differently.

**In short**: commands are buttons you press; skills are behaviors Claude exhibits. Use commands for deliberate actions, skills for intent-driven workflows.

### 5. Why does the quality of the `description` field matter so much for a skill -- what happens if it is too narrow, or too broad?

The `description` field is the skill's trigger mechanism -- Claude uses it to decide whether an incoming request matches the skill. Getting it wrong in either direction causes real problems:

**Too narrow**: If the description only says "write a changelog entry," Claude will not fire the skill when someone says "summarize this change for release notes" or "update the changelog." The skill becomes invisible for valid use cases, and users fall back to doing the work manually or inconsistently. The narrower the description, the more exact the user's phrasing must be -- defeating the purpose of natural-language invocation.

**Too broad**: If the description says "use when the user wants to document anything," the skill fires on README edits, code comments, docstrings, and other unrelated tasks. False positives are disruptive -- Claude runs a multi-step changelog workflow when you just wanted to add a comment to a function. Broad descriptions also create collisions with other skills, making the system unpredictable.

**What good looks like**: The changelog skill's description names concrete triggers -- "add a CHANGELOG entry," "write release notes," "summarize a change." This is specific enough to avoid false positives but broad enough to catch natural variations of the same intent. The description essentially defines the skill's "API surface" in natural language.

### 6. The SKILL.md bakes in judgment ("user-facing sentences," "skip formatting-only edits"). Why encode that in the skill rather than leaving it to each run -- how does this connect to why rules live in CLAUDE.md?

Encoding judgment directly in the SKILL.md serves the same purpose as putting rules in CLAUDE.md -- **it makes good practice the default rather than relying on each person to remember it.**

Without baked-in judgment, every time someone triggers the changelog skill, Claude would make its own decisions about:
- Whether to include formatting-only edits (inconsistent across runs)
- Whether to write developer-facing or user-facing language (varies by phrasing)
- How much detail to include (depends on Claude's interpretation)

The result would be a changelog that reads like it was written by a different person each time. By encoding "user-facing sentences" and "skip formatting-only edits" in the SKILL.md, the team codifies its editorial standards once, and every invocation follows them automatically.

**The connection to CLAUDE.md rules**: Rules in CLAUDE.md encode judgment about how code should be written (pure functions, type hints, validation). Skills encode judgment about how workflows should be executed (user-facing language, what to skip). Both solve the same problem at different levels -- they capture team decisions so individuals do not have to re-derive them on every interaction. The alternative -- leaving judgment to each run -- is the same as having no coding standards: technically possible, but practically chaotic across a team.
