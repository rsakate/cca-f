// Domain 3: Claude Code Configuration & Workflows (20% of exam = ~12 questions)
// Curated question bank covering all 6 task statements:
//   3.1: CLAUDE.md hierarchy, scoping, @import, .claude/rules/
//   3.2: Custom slash commands/skills, SKILL.md frontmatter
//   3.3: Path-specific rules, glob frontmatter, paths field
//   3.4: Plan mode vs direct execution
//   3.5: Iterative refinement (concrete I/O, interview pattern)
//   3.6: CI/CD integration (-p, --output-format json, --json-schema)
// IDs start at 28 (domain 2 ends at 27)
QUESTIONS.push(
{
  id:28, module:3, scenario:"Code Generation with Claude Code",
  text:"Your project has a <code>CLAUDE.md</code> at the root defining team standards, and a <code>src/auth/CLAUDE.md</code> with strict security rules for the authentication module. When Claude Code edits a file in <code>src/auth/</code>, which rules apply?",
  options:[
    "Only the <code>src/auth/CLAUDE.md</code> rules — more specific files completely override the root",
    "Only the root <code>CLAUDE.md</code> — subdirectory files are only read if explicitly imported",
    "Both apply — the root CLAUDE.md provides baseline rules and the subdirectory CLAUDE.md layers additional, more specific rules on top",
    "Claude Code randomly selects one file depending on which it reads first"
  ],
  correct:2,
  explanation:"CLAUDE.md files follow a layered hierarchy: User (~/.claude/CLAUDE.md) → Project (./CLAUDE.md) → Local (./subfolder/CLAUDE.md). More specific levels add to (not replace) broader ones. So editing in src/auth/ would apply both the root team standards AND the auth-specific security rules."
},
{
  id:29, module:3, scenario:"Customer Support Resolution Agent",
  text:"Your Claude Code project has a CLAUDE.md file with custom system instructions and rules for the support agent. You're adding a new project dependency (a special tool for handling warranty claims). Should you add the warranty tool definition to the root CLAUDE.md or use the @import syntax?",
  options:[
    "Always add everything to the root CLAUDE.md to keep configuration centralized",
    "Use @import to modularize the CLAUDE.md so different features (refunds, returns, warranty claims) are defined in separate files and imported as needed",
    "Create a separate CLAUDE.md in each subdirectory and ignore the root file",
    "Configuration should never be split across files; it violates best practices"
  ],
  correct:1,
  explanation:"The @import syntax allows you to modularize CLAUDE.md by splitting configuration into separate, focused files that are imported as needed. This keeps each file manageable and lets teams maintain feature-specific configurations (refunds, returns, warranty) independently without cluttering the root file."
},
{
  id:30, module:3, scenario:"Developer Productivity with Claude",
  text:"You're setting up Claude Code for a new team. The project has a committed <code>CLAUDE.md</code> with team standards. One developer has personal preferences in <code>~/.claude/CLAUDE.md</code>. They also have <code>CLAUDE.local.md</code> at the project root for local overrides. What's <code>CLAUDE.local.md</code> for?",
  options:[
    "It overrides all other configuration including user-level settings",
    "It's the main configuration file — <code>CLAUDE.md</code> is deprecated",
    "It provides personal, per-project configuration tweaks and is automatically gitignored, so each developer can customize behavior without affecting the team's shared <code>CLAUDE.md</code>",
    "It only applies during local development; <code>CLAUDE.md</code> applies in CI/CD"
  ],
  correct:2,
  explanation:"CLAUDE.local.md is for personal, per-project tweaks that shouldn't be shared with the team. It's automatically gitignored. A developer might use it to add their preferred debugging tools or personal code style overrides without modifying the team's committed CLAUDE.md."
},
{
  id:31, module:3, scenario:"Code Generation with Claude Code",
  text:"You want to create a custom <code>/review</code> slash command that runs your team's standard code review checklist. This command should be available to every developer when they clone or pull the repository. Where should you create this command file?",
  options:[
    "In the <code>CLAUDE.md</code> file at the project root",
    "In <code>~/.claude/commands/</code> in each developer's home directory",
    "In the <code>.claude/commands/</code> directory in the project repository",
    "In a <code>.claude/config.json</code> file with a commands array"
  ],
  correct:2,
  explanation:"Project-scoped custom slash commands should be stored in .claude/commands/ within the repository. These commands are version-controlled and automatically available to all developers when they clone or pull. Option B (~/.claude/commands/) is for personal commands not shared via version control. Option A (CLAUDE.md) is for project instructions, not command definitions. Option D describes a mechanism that doesn't exist."
},
{
  id:32, module:3, scenario:"Code Generation with Claude Code",
  text:"Your custom command <code>/generate-endpoint</code> needs the developer to specify the endpoint name. They type <code>/generate-endpoint users</code>. How does the command template receive the 'users' argument?",
  options:[
    "Via a <code>{{param}}</code> template syntax in the command file",
    "Via a JSON schema definition alongside the command",
    "Via the <code>$ARGUMENTS</code> placeholder in the command markdown file — 'users' replaces <code>$ARGUMENTS</code> in the prompt",
    "Arguments aren't supported — the command must ask for the endpoint name interactively"
  ],
  correct:2,
  explanation:"Custom commands use $ARGUMENTS as a placeholder in the markdown template. When the user types /generate-endpoint users, 'users' replaces $ARGUMENTS in the prompt. This is the built-in parameterization mechanism — no JSON schema or template syntax needed."
},
{
  id:33, module:3, scenario:"Developer Productivity with Claude",
  text:"Your team wants recurring chores (code review, test generation, changelog updates) available as one-word commands. For code review, you want it to run <code>Grep</code>, <code>Read</code>, and <code>Glob</code> but NOT <code>Bash</code>, <code>Edit</code>, or <code>Write</code>. How do you configure this?",
  options:[
    "Create a <code>.claude/commands/review.md</code> file with the review prompt and add <code>allowed-tools: [Grep, Read, Glob]</code> in the frontmatter",
    "Add the tool restrictions to CLAUDE.md with a conditional: 'When running /review, only use Grep, Read, and Glob'",
    "Create the command without tool restrictions and trust the review prompt to only use read operations",
    "Create a skill instead of a command, since only skills support tool restrictions"
  ],
  correct:0,
  explanation:"Custom commands support allowed-tools in their frontmatter, restricting which tools can be used during execution. This ensures the review command can only read code, never modify it. Option B is prompt-based, not enforced. Option C trusts probabilistic behavior. Option D is incorrect — both commands and skills support tool restrictions."
},
{
  id:34, module:3, scenario:"Code Generation with Claude Code",
  text:"Your codebase has distinct areas with different coding conventions: React components use functional style with hooks, API handlers use async/await with specific error handling, and database models follow a repository pattern. Test files are spread throughout the codebase (e.g., <code>Button.test.tsx</code> next to <code>Button.tsx</code>). You want all tests to follow the same conventions regardless of location. What's the most maintainable approach?",
  options:[
    "Create rule files in <code>.claude/rules/</code> with YAML frontmatter specifying glob patterns to conditionally apply conventions based on file paths",
    "Consolidate all conventions in the root <code>CLAUDE.md</code> file under headers for each area, relying on Claude to infer which section applies",
    "Create skills in <code>.claude/skills/</code> for each code type that include the relevant conventions in their SKILL.md files",
    "Place a separate <code>CLAUDE.md</code> in each subdirectory containing that area's specific conventions"
  ],
  correct:0,
  explanation:"Option A is correct because .claude/rules/ with glob patterns (e.g., **/*.test.tsx) allows conventions to be automatically applied based on file paths regardless of directory location — essential for test files spread throughout the codebase. Option B relies on inference rather than explicit matching, making it unreliable. Option C requires manual skill invocation. Option D can't easily handle files spread across many directories since CLAUDE.md files are directory-bound."
},
{
  id:35, module:3, scenario:"Code Generation with Claude Code",
  text:"You have a skill that checks code complexity metrics. Its <code>SKILL.md</code> uses <code>paths: ['**/*.service.ts']</code> in the frontmatter. A developer working on <code>Button.tsx</code> can't find the skill in the available commands. Why?",
  options:[
    "The skill has a syntax error in its SKILL.md file",
    "The paths field scopes when the skill is visible — it only appears when the developer is editing files matching <code>**/*.service.ts</code>, saving context tokens when working on unrelated files",
    "Skills are only available in plan mode",
    "The developer needs to install the skill separately using <code>/install-skill</code>"
  ],
  correct:1,
  explanation:"The paths field in SKILL.md scopes skill visibility. It only loads into context when the user is working on files matching the glob pattern (*.service.ts), saving token budget. Since the developer is editing Button.tsx, which doesn't match, the skill isn't shown. This is intentional — it keeps the available skills list relevant to current work."
},
{
  id:36, module:3, scenario:"Code Generation with Claude Code",
  text:"You've been assigned to restructure the team's monolithic application into microservices. This will involve changes across dozens of files and requires decisions about service boundaries and module dependencies. Which approach should you take?",
  options:[
    "Enter plan mode to explore the codebase, understand dependencies, and design an implementation approach before making changes",
    "Start with direct execution and make changes incrementally, letting the implementation reveal the natural service boundaries",
    "Use direct execution with comprehensive upfront instructions detailing exactly how each service should be structured",
    "Begin in direct execution mode and only switch to plan mode if you encounter unexpected complexity during implementation"
  ],
  correct:0,
  explanation:"Plan mode is designed for complex tasks involving large-scale changes, multiple valid approaches, and architectural decisions — exactly what monolith-to-microservices restructuring requires. It enables safe codebase exploration and design before committing to changes. Option B risks costly rework when dependencies are discovered late. Option C assumes you already know the right structure without exploring the code. Option D ignores that the complexity is already stated in the requirements."
},
{
  id:37, module:3, scenario:"Developer Productivity with Claude",
  text:"Your team uses the 'interview pattern' when working with Claude Code on unfamiliar codebases. A junior developer asks what this means. Which description is correct?",
  options:[
    "Claude Code asks the developer a series of questions about the codebase before making any changes, surfacing design considerations the developer may not have anticipated",
    "The developer interviews Claude Code about the codebase architecture before starting work",
    "Claude Code runs automated tests and 'interviews' the test output to understand the codebase",
    "The developer provides a structured questionnaire that Claude Code fills out about each file"
  ],
  correct:0,
  explanation:"The interview pattern has Claude ask questions to surface design considerations the developer may not have anticipated — cache invalidation strategies, failure modes, edge cases. This is especially valuable in unfamiliar domains where the developer might miss important considerations. It's a way to leverage Claude's broad knowledge before committing to an implementation approach."
},
{
  id:38, module:3, scenario:"Code Generation with Claude Code",
  text:"Your team's code generation process is producing duplicated variable names in some cases. What's the best approach to improve consistency?",
  options:[
    "Tell Claude Code to check for duplicates before completing",
    "Provide test cases showing expected variable naming and how duplicates should be handled",
    "Add naming convention rules to CLAUDE.md",
    "Use a post-processing linter to rename duplicates"
  ],
  correct:1,
  explanation:"Providing concrete test cases that demonstrate expected naming conventions and duplicate handling gives Claude Code unambiguous examples to follow. This is more effective than vague instructions (Option A), static rules without examples (Option C), or post-hoc fixes that don't address the root cause (Option D)."
},
{
  id:39, module:3, scenario:"Claude Code for Continuous Integration",
  text:"Your CI pipeline needs Claude Code to output review results as structured JSON that a downstream script (<code>review_gate.py</code>) can parse to make pass/fail decisions. What flags achieve this?",
  options:[
    "<code>-p</code> with <code>--verbose</code> for detailed output that includes JSON",
    "<code>-p</code> with <code>--output-format json</code> to produce machine-parseable structured output",
    "<code>-p</code> with <code>--json</code> to enable JSON output mode",
    "<code>-p</code> with <code>--format structured</code> for structured output"
  ],
  correct:1,
  explanation:"-p enables non-interactive mode and --output-format json produces structured JSON output that CI/CD pipelines can parse programmatically. This combination is the standard pattern for integrating Claude Code into automated workflows. The other options reference non-existent flags."
}
);
