---
name: changelog-entry
description: >
  Use when the user wants to add a CHANGELOG entry, write release
  notes, or summarize a change for the changelog. Triggers on phrases
  like "update the changelog", "add a changelog entry", "write release
  notes", or "summarize this change".
---

# Changelog Entry Skill

Follow these steps to create a changelog entry:

1. Run `git diff` to see what changed (staged and unstaged).
2. Classify each change as **Added**, **Changed**, **Fixed**, or **Removed**.
3. Write one short, user-facing sentence per change.
   - Use plain language a user would understand (not implementation details).
   - Skip formatting-only edits, whitespace changes, or import reordering.
4. Prepend a `## [Unreleased]` section to `CHANGELOG.md` (create the file if it doesn't exist).
   - Group entries under `### Added`, `### Changed`, `### Fixed`, or `### Removed` as appropriate.
   - Only include sections that have entries.

## Output format

```markdown
## [Unreleased]

### Added
- Short user-facing sentence describing the addition.

### Changed
- Short user-facing sentence describing the change.
```

Follow the [Keep a Changelog](https://keepachangelog.com) format.
