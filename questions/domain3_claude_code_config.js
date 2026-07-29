// Domain 3: Claude Code Configuration & Workflows (20% of exam)
// 28 questions covering: CLAUDE.md configuration, custom commands/skills,
// path-specific rules, plan mode, iterative refinement, CI/CD integration
QUESTIONS.push(
{
  id:57, module:3, scenario:"Code Generation with Claude Code",
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
  id:58, module:3, scenario:"Code Generation with Claude Code",
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
  id:59, module:3, scenario:"Code Generation with Claude Code",
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
  id:60, module:3, scenario:"Code Generation with Claude Code",
  text:"Your pipeline script runs <code>claude 'Analyze this pull request for security issues'</code> but the job hangs indefinitely. Logs indicate Claude Code is waiting for interactive input. What's the correct fix?",
  options:[
    "Add the <code>-p</code> flag: <code>claude -p 'Analyze this pull request for security issues'</code>",
    "Set the environment variable <code>CLAUDE_HEADLESS=true</code> before running the command",
    "Redirect stdin from /dev/null: <code>claude 'Analyze this pull request...' < /dev/null</code>",
    "Add the <code>--batch</code> flag: <code>claude --batch 'Analyze this pull request...'</code>"
  ],
  correct:0,
  explanation:"The -p (or --print) flag is the documented way to run Claude Code in non-interactive mode. It processes the prompt, outputs the result to stdout, and exits without waiting for user input — exactly what CI/CD pipelines require. The other options reference non-existent features (CLAUDE_HEADLESS, --batch) or Unix workarounds that don't properly address Claude Code's command syntax."
},
{
  id:61, module:3, scenario:"Claude Code for Continuous Integration",
  text:"Your team wants to reduce API costs for automated analysis. Currently, real-time Claude calls power two workflows: (1) a blocking pre-merge check that must complete before developers can merge, and (2) a technical debt report generated overnight for review the next morning. Your manager proposes switching both to the Message Batches API for its 50% cost savings. How should you evaluate this proposal?",
  options:[
    "Use batch processing for the technical debt reports only; keep real-time calls for pre-merge checks",
    "Switch both workflows to batch processing with status polling to check for completion",
    "Keep real-time calls for both workflows to avoid batch result ordering issues",
    "Switch both to batch processing with a timeout fallback to real-time if batches take too long"
  ],
  correct:0,
  explanation:"The Message Batches API offers 50% cost savings but has processing times up to 24 hours with no guaranteed latency SLA. This makes it unsuitable for blocking pre-merge checks where developers wait for results, but ideal for overnight jobs like technical debt reports. Option B is wrong because relying on 'often faster' completion isn't acceptable for blocking workflows. Option C wastes money on a workflow that doesn't need real-time. Option D adds unnecessary complexity."
},
{
  id:62, module:3, scenario:"Code Generation with Claude Code",
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
  id:63, module:3, scenario:"Code Generation with Claude Code",
  text:"Your skill generates a changelog entry by reading recent git commits. This involves running <code>git log</code>, reading multiple files, and producing verbose intermediate output. You don't want all this exploration to clutter the main conversation context. What configuration should you use?",
  options:[
    "Add <code>context: fork</code> to the SKILL.md frontmatter so the skill runs in an isolated context, with only the final result returning to the main session",
    "Add <code>context: shared</code> to share context efficiently between the skill and main session",
    "Add <code>verbose: false</code> to suppress intermediate output",
    "Run the skill in a separate terminal window"
  ],
  correct:0,
  explanation:"context: fork creates an isolated context for the skill. All intermediate work (git log output, file reads, reasoning) happens in the fork and is discarded when the skill completes. Only the final output returns to the main session, keeping it clean. This is designed specifically for skills that produce verbose exploration output."
},
{
  id:64, module:3, scenario:"Code Generation with Claude Code",
  text:"You want your custom <code>/deploy</code> command to prompt the developer for the target environment (staging or production) when they invoke it without arguments. What frontmatter should you use?",
  options:[
    "Add <code>required-args: ['environment']</code> to the command frontmatter",
    "Add <code>argument-hint: 'staging or production'</code> to the command frontmatter",
    "Add a conditional check in the command markdown that asks for the environment",
    "Commands cannot accept parameters — create separate <code>/deploy-staging</code> and <code>/deploy-production</code> commands"
  ],
  correct:1,
  explanation:"argument-hint in the command frontmatter prompts developers for required parameters when they invoke the skill without arguments. The hint text ('staging or production') tells them what to provide. Option A references a non-existent frontmatter field. Option C doesn't work — commands are markdown templates, not scripts. Option D creates unnecessary duplication."
},
{
  id:65, module:3, scenario:"Code Generation with Claude Code",
  text:"A new developer joins the team and runs Claude Code on the project. They notice it's not following the team's TypeScript conventions even though <code>CLAUDE.md</code> exists. You check and find the rules are there but Claude Code seems to ignore them. What's the debugging step?",
  options:[
    "Delete the <code>CLAUDE.md</code> and recreate it — the file might be corrupted",
    "Run <code>/memory</code> to see the currently loaded instructions from all levels (user, project, local) and verify the rules are actually being read",
    "Restart Claude Code — it only reads CLAUDE.md once at startup",
    "Check if the new developer has a conflicting <code>~/.claude/CLAUDE.md</code> that overrides the project settings"
  ],
  correct:1,
  explanation:"/memory shows the active instructions loaded from all CLAUDE.md levels plus path-specific rules. It's the debugging tool to verify what instructions Claude Code is actually seeing. Option A is unlikely — CLAUDE.md is plain text. Option C is wrong — CLAUDE.md is included in every API call. Option D is worth checking but /memory would reveal this conflict directly."
},
{
  id:66, module:3, scenario:"Claude Code for Continuous Integration",
  text:"Your CI pipeline runs Claude Code to review PRs. After a developer pushes a fix addressing review comments, the next CI run generates the same comments again — reporting issues that were already fixed. What's the most effective solution?",
  options:[
    "Clear Claude Code's cache between CI runs so it doesn't remember previous reviews",
    "Include prior review findings in the context when re-running, instructing Claude to report only new or still-unaddressed issues to avoid duplicate comments",
    "Skip the review on subsequent pushes if the first review already ran",
    "Add a deduplication filter that compares new review comments against existing PR comments"
  ],
  correct:1,
  explanation:"Including prior review findings in context lets Claude intelligently compare current code against previous feedback, reporting only genuinely new issues or issues that remain unfixed. Option A doesn't help — each CI run is a fresh session anyway. Option C skips valuable re-review. Option D is a brittle text-matching approach that can't handle rephrased but equivalent comments."
},
{
  id:67, module:3, scenario:"Code Generation with Claude Code",
  text:"Your team uses <code>CLAUDE.md</code> for team standards and individual developers have personal preferences in <code>~/.claude/CLAUDE.md</code>. One developer's personal file says 'Use tabs for indentation' while the project CLAUDE.md says 'Use 2-space indentation.' What happens when they edit project files?",
  options:[
    "The project-level rule wins because it's more specific to the current context",
    "The user-level rule wins because it's loaded last and overrides earlier rules",
    "Both rules are loaded — user-level provides defaults, project-level layers on top. Since both address indentation, the project-level rule takes precedence as the more specific context",
    "Claude Code detects the conflict and asks the user which to follow"
  ],
  correct:2,
  explanation:"The hierarchy is User → Project → Local, with more specific levels layering on top of broader ones. For conflicting rules, the more specific context (project-level for project files) takes precedence. The developer's personal preference is their default, but the project's standards override when working on project files."
},
{
  id:68, module:3, scenario:"Claude Code for Continuous Integration",
  text:"Your CI pipeline needs Claude Code to output review results as structured JSON that a downstream script (<code>review_gate.py</code>) can parse to make pass/fail decisions. What flags achieve this?",
  options:[
    "<code>-p</code> with <code>--verbose</code> for detailed output that includes JSON",
    "<code>-p</code> with <code>--output-format json</code> to produce machine-parseable structured output",
    "<code>-p</code> with <code>--json</code> to enable JSON output mode",
    "<code>-p</code> with <code>--format structured</code> for structured output"
  ],
  correct:1,
  explanation:"-p enables non-interactive mode and --output-format json produces structured JSON output that CI/CD pipelines can parse programmatically. This combination is the standard pattern for integrating Claude Code into automated workflows. The other options reference non-existent flags."
},
{
  id:69, module:3, scenario:"Code Generation with Claude Code",
  text:"You're setting up Claude Code for a project where <code>src/payments/</code> contains security-critical code handling financial transactions. You want Claude to require explicit approval before modifying any file in that directory, even in normal execution mode. What's the most reliable approach?",
  options:[
    "Add 'DO NOT modify payment files without asking' to the root CLAUDE.md",
    "Place a <code>CLAUDE.md</code> in <code>src/payments/</code> that says to use plan mode for all changes",
    "Create a <code>PreToolUse</code> hook that intercepts <code>Edit</code> and <code>Write</code> calls to <code>src/payments/**</code> paths and returns exit code 2 with a message requiring confirmation",
    "Use <code>.claude/rules/</code> with a glob pattern for <code>src/payments/**</code> that instructs caution"
  ],
  correct:2,
  explanation:"A PreToolUse hook provides programmatic enforcement — it intercepts file modifications before they happen and blocks them with exit code 2, sending feedback to Claude. This is deterministic: the write literally cannot proceed without approval. Options A, B, and D are all prompt-based guidance that Claude may override in its reasoning."
},
{
  id:70, module:3, scenario:"Code Generation with Claude Code",
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
  id:71, module:3, scenario:"Claude Code for Continuous Integration",
  text:"A pull request modifies 14 files across the stock tracking module. Your single-pass Claude Code review produces inconsistent results: detailed feedback for some files but superficial comments for others, obvious bugs missed, and contradictory feedback — flagging a pattern as wrong in one file but not in another. What architectural change would most improve review quality?",
  options:[
    "Increase the model's temperature to produce more diverse analysis",
    "Split the review into focused per-file local analysis passes plus a separate cross-file integration pass that checks data flow and consistency",
    "Run the same single-pass review three times and use majority voting on findings",
    "Reduce the number of files per review to 5 and run multiple smaller reviews"
  ],
  correct:1,
  explanation:"Multi-pass review addresses the core problem: attention dilution across too many files. Per-file passes give deep, focused analysis. A cross-file integration pass then checks data flow, consistency, and interaction issues that per-file passes miss. Option A adds randomness, not quality. Option C repeats the same dilution problem. Option D loses cross-file context entirely."
},
{
  id:72, module:3, scenario:"Code Generation with Claude Code",
  text:"Your team recently adopted Claude Code. A senior developer asks: 'What's the recommended workflow for non-trivial tasks?' What should you recommend?",
  options:[
    "Plan → Execute → Deploy: create a formal planning document, then execute directly",
    "Code → Test → Commit → Review: implement immediately, test, then iterate",
    "Explore → Plan → Code → Commit: investigate the codebase first, plan the approach (using plan mode for complex changes), implement, then commit",
    "Read → Write → Test: sequentially read, write, and test files"
  ],
  correct:2,
  explanation:"The recommended workflow is explore → plan → code → commit. First explore the codebase to understand current state and patterns. Then plan the approach (plan mode for complex changes). Then implement. Then commit. This prevents premature coding before understanding the codebase and reduces costly rework."
},
{
  id:73, module:3, scenario:"Claude Code for Continuous Integration",
  text:"The same Claude Code session that generated code is now asked to review that code for issues. Your team notices the reviews are unusually lenient — missing issues that an independent reviewer catches easily. Why is this happening?",
  options:[
    "The model is rate-limited and producing lower-quality output on subsequent calls",
    "Session context isolation: the model retains its reasoning context from generation, making it less likely to question its own decisions in the same session",
    "The review prompt is not specific enough about what to look for",
    "The model's temperature needs to be increased for review tasks to encourage critical analysis"
  ],
  correct:1,
  explanation:"This is the self-review limitation: a model that just generated code retains the reasoning context that produced it, making it inherently biased toward its own decisions. An independent Claude instance (without prior context) is more effective at catching issues because it evaluates the code fresh. Option C might help but isn't the root cause. Option D doesn't address the bias."
},
{
  id:74, module:3, scenario:"Code Generation with Claude Code",
  text:"You want to restrict Claude Code's tool access in CI/CD to only safe, read-only operations. Which approach controls this?",
  options:[
    "Use <code>--safe-mode</code> flag to enable built-in read-only restrictions",
    "Use <code>--allowedTools</code> to whitelist specific tools (e.g., Read, Grep, Glob) and <code>--disallowedTools</code> to blacklist dangerous ones (e.g., Bash, Edit, Write)",
    "Use <code>--readonly</code> flag to prevent all writes",
    "Set <code>CLAUDE_READONLY=true</code> environment variable"
  ],
  correct:1,
  explanation:"--allowedTools and --disallowedTools provide granular tool access control for CLI invocations. In CI/CD, you might use --allowedTools to permit only Read, Grep, and Glob while blocking Write, Edit, and Bash. The other options reference non-existent flags or environment variables."
},
{
  id:75, module:3, scenario:"Claude Code for Continuous Integration",
  text:"Your CI pipeline runs Claude Code to generate tests for new code. The generated tests sometimes duplicate existing test scenarios that are already covered in the test suite. What's the most effective way to prevent this?",
  options:[
    "Add a post-generation deduplication step that diffs new tests against existing ones",
    "Provide existing test files in context when generating new tests, so Claude can see what's already covered and avoid suggesting duplicate scenarios",
    "Limit test generation to only files that have zero existing tests",
    "Use a separate model fine-tuned on your test codebase"
  ],
  correct:1,
  explanation:"Including existing test files in context lets Claude see what scenarios are already covered and generate only complementary tests. This is the simplest and most effective approach. Option A is a brittle post-hoc fix. Option C is too restrictive — even files with tests may need additional coverage. Option D is over-engineered for this problem."
},
{
  id:76, module:3, scenario:"Code Generation with Claude Code",
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
  id:77, module:3, scenario:"Code Generation with Claude Code",
  text:"A developer wants to use plan mode for a risky database migration. How can they activate plan mode? Select the most complete answer.",
  options:[
    "Only through the <code>/plan</code> slash command",
    "Only through the <code>--plan</code> CLI flag",
    "Press <code>Shift+Tab</code> twice to toggle, type <code>/plan</code> at the prompt, or use <code>--permission-mode plan</code> as a CLI flag",
    "Plan mode activates automatically for any change touching more than 3 files"
  ],
  correct:2,
  explanation:"Plan mode can be activated three ways: Shift+Tab twice (interactive toggle), /plan at the prompt (command), or --permission-mode plan (CLI flag for headless/default). Multiple entry points accommodate different workflows — interactive, command-line, and CI/CD."
},
{
  id:78, module:3, scenario:"Code Generation with Claude Code",
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
  id:79, module:3, scenario:"Code Generation with Claude Code",
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
  id:80, module:3, scenario:"Claude Code for Continuous Integration",
  text:"Your CI review pipeline needs Claude Code to output results that a Python script can parse into pass/fail decisions with structured issue lists. You want to enforce a specific JSON schema for the output. Which flag combination achieves this?",
  options:[
    "<code>-p</code> with <code>--output-format json</code> only — the JSON format is sufficient",
    "<code>-p</code> with <code>--output-format json</code> and <code>--json-schema '{...}'</code> to enforce a specific output structure",
    "<code>-p</code> with <code>--structured</code> and a schema file path",
    "<code>-p</code> with <code>--template review.json</code> to use a predefined output template"
  ],
  correct:1,
  explanation:"--output-format json produces JSON output, and --json-schema enforces a specific structure for that output. Together with -p for non-interactive mode, this gives you guaranteed, schema-compliant JSON that your review_gate.py can parse reliably. Option A gives JSON but without schema enforcement. Options C and D reference non-existent flags."
},
{
  id:81, module:3, scenario:"Code Generation with Claude Code",
  text:"Your iterative workflow pattern involves writing a failing test first, then implementing code until the test passes, then committing. Claude Code produces inconsistent results when you describe the transformation in prose ('make the function handle null inputs'). What should you try instead?",
  options:[
    "Provide more detailed prose descriptions with edge cases enumerated",
    "Provide 2-3 concrete input/output examples showing the expected transformation, since examples communicate expected behavior more precisely than prose when descriptions produce inconsistent results",
    "Switch to a different model that better understands natural language",
    "Write the implementation yourself and only use Claude Code for test generation"
  ],
  correct:1,
  explanation:"Concrete input/output examples are the most effective way to communicate expected transformations when prose descriptions are interpreted inconsistently. Examples are unambiguous: 'input: null → output: []' leaves no room for misinterpretation. Option A doubles down on the approach that's already failing. Options C and D are overreactions."
},
{
  id:82, module:3, scenario:"Code Generation with Claude Code",
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
  id:83, module:3, scenario:"Claude Code for Continuous Integration",
  text:"Your CI Claude Code reviews have been producing false positive findings at a 35% rate — flagging patterns as bugs that are actually intentional design choices. Developers are starting to ignore all review comments. What's the most effective fix?",
  options:[
    "Increase the model's confidence threshold so it only reports high-confidence findings",
    "Write specific review criteria in <code>CLAUDE.md</code> that define which issues to report (bugs, security) versus skip (minor style, local patterns), replacing vague instructions like 'be conservative' with explicit categorical criteria",
    "Reduce the scope of reviews to only security-critical files",
    "Add a human approval step where a senior developer filters false positives before they're posted as PR comments"
  ],
  correct:1,
  explanation:"High false positive rates erode developer trust. The fix is explicit, testable criteria: define exactly what constitutes a reportable issue vs. acceptable patterns. Vague instructions like 'be conservative' or 'only report high-confidence findings' (Option A) fail because they don't give the model concrete decision boundaries. Option C sacrifices coverage. Option D adds manual overhead without fixing the root cause."
},
{
  id:84, module:3, scenario:"Code Generation with Claude Code",
  text:"You need to provide context to CI-invoked Claude Code about project testing standards, available fixtures, and review criteria. Where should this information go?",
  options:[
    "In environment variables passed to the CI runner",
    "In the CI pipeline configuration (e.g., GitHub Actions YAML)",
    "In the project's <code>CLAUDE.md</code> file, which CI-invoked Claude Code reads just like interactive Claude Code",
    "In a separate CI-specific configuration file that Claude Code reads in headless mode"
  ],
  correct:2,
  explanation:"CLAUDE.md is the mechanism for providing project context to Claude Code regardless of how it's invoked. CI runs with -p read CLAUDE.md the same way interactive sessions do. Putting testing standards, fixture conventions, and review criteria there ensures consistency between interactive development and CI automation. No separate CI-specific config is needed."
}
);
