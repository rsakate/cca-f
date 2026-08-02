// Domain 2: Tool Design & MCP Integration (18% of exam, 18 questions)
// Covers: 2.1 tool descriptions/boundaries, 2.2 structured errors, 2.3 tool distribution/tool_choice,
// 2.4 MCP servers (.mcp.json, resources), 2.5 built-in tools (Read, Write, Edit, Bash, Grep, Glob)
// IDs 17-27 (domain 1 ends at 16)
// + Mock Test 3: two-step confirmation token (Q64), ID lookup pattern (Q65),
//   internal retry (Q66), Edit fallback to Read+Write (Q67),
//   split tool by category (Q74), rich confirmation details (Q75), disambiguating similar tools (Q76)
QUESTIONS.push(
{
  id:17, module:2, scenario:"Customer Support Resolution Agent",
  text:"You have a tool called get_customer that's critical for retrieving customer details. Your tool description currently says: 'Retrieves customer information.' A team member says this is sufficient. Why might this description be inadequate for reliable agent behavior?",
  options:[
    "The description is fine; agents don't need detailed tool descriptions to use tools correctly",
    "Tool descriptions should only be one sentence for brevity",
    "Detailed descriptions slow down the model's reasoning process",
    "The description is too vague. It doesn't specify what parameters are required, what output format to expect, what edge cases exist (e.g., customer not found), or when to use this tool vs. other alternatives"
  ],
  correct:3,
  explanation:"Tool descriptions are the primary mechanism LLMs use to decide when and how to call tools. A vague description like 'Retrieves customer information' gives the model no guidance on required parameters, expected output format, edge cases, or disambiguation from similar tools. Detailed descriptions with these elements dramatically improve tool selection accuracy and error handling."
},
{
  id:18, module:2, scenario:"Developer Productivity with Claude",
  text:"You're defining the JSON schema for a <code>create_ticket</code> tool's <code>priority</code> parameter. The values should be 'low', 'medium', 'high', or 'critical'. What's the best schema approach?",
  options:[
    "Define <code>priority</code> as a free-text <code>string</code> with instructions in the description to use one of the four values",
    "Define <code>priority</code> as a <code>string</code> with an <code>enum: ['low', 'medium', 'high', 'critical']</code> constraint",
    "Define <code>priority</code> as an <code>integer</code> from 1-4 and map to labels in code",
    "Define <code>priority</code> as a <code>boolean</code> (true = high priority, false = low)"
  ],
  correct:1,
  explanation:"An enum constraint guarantees the model outputs one of the valid values — the schema enforces it structurally, not just via instructions. Option A allows arbitrary strings ('urgent', 'ASAP', etc.) the model might generate. Option C loses semantic meaning (what does 3 mean?). Option D can't represent 4 priority levels."
},
{
  id:19, module:2, scenario:"Customer Support Resolution Agent",
  text:"Your tool <code>update_shipping_address</code> succeeds but has a side effect: it also triggers a re-routing of the package, adding 2 days to delivery. The tool currently returns <code>{success: true}</code>. The agent tells the customer 'Your address has been updated!' without mentioning the delivery delay. How should you fix the tool response?",
  options:[
    "Add the delay information to the tool description so the model always mentions it",
    "Return a richer response: <code>{success: true, side_effects: [{type: 'delivery_delay', additional_days: 2, new_estimated_delivery: '2024-03-15'}]}</code>",
    "Add a PostToolUse hook that appends a reminder about delivery delays",
    "Create a separate tool <code>check_delivery_impact</code> that the agent should call after address updates"
  ],
  correct:1,
  explanation:"The tool response should include all consequential information — the model can only communicate what it knows. Returning side effects in the response data ensures the model has the information to give the customer a complete picture. Option A is static and can't include dynamic details like the new date. Option C adds complexity. Option D requires the model to remember to call a second tool."
},
{
  id:20, module:2, scenario:"Customer Support Resolution Agent",
  text:"You're designing the process_refund tool. Your backend returns different failure modes: 'Insufficient funds in account', 'Account locked pending fraud review', and 'Refund window expired'. How should you structure the tool's error response?",
  options:[
    "Return success even on failure and embed error codes in the result for the agent to parse",
    "Use isError: true with errorCategory (transient, non_retryable, etc.), isRetryable (boolean), and a human-readable details message so the agent can reason about next steps",
    "Return all error messages as plain text strings without categorization",
    "Throw exceptions and let the SDK handle error translation automatically"
  ],
  correct:1,
  explanation:"Structured error responses with isError: true, errorCategory, isRetryable, and human-readable details give the agent full context to reason about recovery. For example, 'fraud review' is transient and retryable later, while 'refund window expired' is permanent. Returning success on failure misleads the agent, plain text lacks machine-parseable structure, and exceptions bypass the agent's reasoning."
},
{
  id:21, module:2, scenario:"Customer Support Resolution Agent",
  text:"Your MCP tool <code>search_orders</code> executes a database query that returns 0 rows for a valid customer who has no orders. The tool currently returns <code>isError: true</code> with 'No orders found.' Claude then apologizes for the error and suggests the customer try again later. What's wrong?",
  options:[
    "The error message should be more specific about why no orders were found",
    "The tool should return <code>isError: false</code> with <code>resultCount: 0</code> — an empty result from a successful query is NOT an error",
    "The tool should retry the query with broader search parameters before reporting no results",
    "The tool should return <code>isError: true</code> but with an <code>isRetryable: false</code> flag to prevent Claude from suggesting retries"
  ],
  correct:1,
  explanation:"A successful query that returns 0 rows is fundamentally different from a query that fails. Marking it as isError: true causes the model to treat it as a failure (apologizing, suggesting retries) instead of correctly informing the customer they have no orders. Return isError: false with the result count so the model can respond appropriately: 'I don't see any orders on your account.'"
},
{
  id:22, module:2, scenario:"Developer Productivity with Claude",
  text:"You're building an MCP server and a tool handler throws an unhandled Python exception. What happens at the protocol level?",
  options:[
    "The MCP framework catches it and returns a <code>CallToolResult</code> with <code>isError: true</code> containing the exception message",
    "The exception becomes a protocol-level error (not a tool error), which means Claude sees it as a system failure rather than a tool failure, preventing intelligent recovery",
    "The MCP server crashes and Claude Code automatically restarts it",
    "The exception is silently swallowed and Claude receives an empty successful response"
  ],
  correct:1,
  explanation:"Unhandled exceptions in MCP tool handlers become protocol-level errors, not tool-level errors. This means Claude sees them as infrastructure failures rather than actionable tool feedback. The correct pattern is to catch exceptions in your handler and return a CallToolResult with isError: true and a descriptive message, enabling Claude to reason about the failure and recover."
},
{
  id:23, module:2, scenario:"Customer Support Resolution Agent",
  text:"Your main support agent is configured with allowedTools: ['get_customer', 'lookup_order', 'process_refund', 'escalate_to_human']. You're concerned about scope creep where the agent might attempt operations outside its domain. What's the implication of this scoped tool access?",
  options:[
    "The agent will attempt all possible operations but these four will have priority",
    "The agent can only call these four tools; any attempt to call tools outside this list will fail at runtime",
    "The agent's system prompt is restricted, but it can request tools outside this list",
    "Tool scoping is only a recommendation; the agent will ignore it if it seems necessary"
  ],
  correct:1,
  explanation:"allowedTools is an enforcement mechanism, not a suggestion. When an agent is configured with a scoped tool list, any attempt to call a tool outside that list will fail at runtime. This provides a hard boundary preventing scope creep, unlike system prompt guidance which the model could potentially bypass."
},
{
  id:24, module:2, scenario:"Customer Support Resolution Agent",
  text:"You want the agent to dynamically decide which tool to call based on the situation. You're choosing between tool_choice: 'auto' and tool_choice: 'any'. What's the practical difference?",
  options:[
    "'auto' and 'any' are equivalent; both let the model choose any available tool",
    "'auto' uses model heuristics to decide whether and when to call tools; 'any' forces the model to always call a tool in every response, even if it might not need one",
    "'any' is more restrictive and prevents the model from calling certain tools",
    "'auto' prevents the model from using tools at all"
  ],
  correct:1,
  explanation:"tool_choice 'auto' lets the model decide whether to call a tool at all -- it may respond with text instead if appropriate. tool_choice 'any' forces the model to make a tool call in every response, even when a text response would suffice. This distinction matters when you need guaranteed structured output (use 'any') vs. flexible conversation (use 'auto')."
},
{
  id:25, module:2, scenario:"Structured Data Extraction",
  text:"You're using <code>tool_choice: 'auto'</code> in your agent. During testing, you notice that in 15% of cases Claude responds with a text explanation instead of calling the required <code>extract_data</code> tool, saying 'Based on the document, I can see that...' followed by prose. What's the fix?",
  options:[
    "Add stronger instructions in the system prompt: 'ALWAYS use the extract_data tool. NEVER respond with text.'",
    "Switch to <code>tool_choice: {type: 'tool', name: 'extract_data'}</code> to force the tool call, eliminating the possibility of text-only responses",
    "Add retry logic that detects text-only responses and re-sends the request",
    "Increase the temperature to encourage more diverse behavior including tool usage"
  ],
  correct:1,
  explanation:"With tool_choice 'auto', the model can choose not to call tools — which it does 15% of the time. Switching to forced tool selection guarantees the model calls extract_data on every request. Option A is probabilistic and won't achieve 100%. Option C wastes API calls. Option D increases randomness but doesn't fix the fundamental issue."
},
{
  id:26, module:2, scenario:"Customer Support Resolution Agent",
  text:"Your MCP server defines tools at the user level (~/.claude.json). Your team wants different projects to have different sets of tools. For example, one project uses process_refund, another uses process_replacement_order. How should you structure MCP server scoping?",
  options:[
    "Define all tools in ~/.claude.json and let each project's agent choose which ones to use via tool_choice",
    "Store tool definitions in a database and fetch them at runtime based on the project",
    "Require each project to copy the full ~/.claude.json and edit it locally",
    "Define project-level .mcp.json files so each project can have scoped tool access independent of others"
  ],
  correct:3,
  explanation:"Project-level .mcp.json files allow each project to define its own scoped set of MCP tools independently. This avoids polluting the global config with project-specific tools, prevents tool leakage between projects, and doesn't require manual copying or runtime fetching. Each project gets exactly the tools it needs."
},
{
  id:27, module:2, scenario:"Code Generation with Claude Code",
  text:"You want Claude Code to use the built-in <code>Glob</code>, <code>Grep</code>, <code>Read</code>, and <code>Edit</code> tools to explore and refactor a TypeScript codebase. A junior developer asks why not just load all files into the prompt upfront. What's the key advantage of the incremental exploration pattern?",
  options:[
    "The built-in tools are faster than reading files into the prompt",
    "Loading all files upfront consumes the context window with potentially irrelevant content, while the find -> read-only-what-matters -> change loop keeps context focused on relevant code",
    "The built-in tools provide syntax highlighting that the prompt doesn't",
    "Loading files into the prompt is not supported — you must use the built-in tools"
  ],
  correct:1,
  explanation:"The incremental exploration pattern (Glob to find files -> Read to inspect relevant ones -> Edit to change) keeps the context window focused on what matters. Loading everything upfront ('just in case') wastes context on irrelevant files, potentially pushing important content out of the model's attention window. This is especially critical for large codebases."
},
// --- Questions from Mock Test 3 (unique concepts) ---
{
  id:64, module:2, scenario:"Multi-Agent Research System",
  text:"Your <code>remove_team_member</code> tool uses a <code>dry_run</code> parameter for previewing impacts before execution, but the agent sometimes bypasses the preview step. You need to ensure every removal is preceded by a preview that the user explicitly confirms. What is the most reliable approach?",
  options:[
    "Add detailed instructions and few-shot examples telling the agent to always call dry_run first",
    "Annotate the tool as requiring confirmation and rely on the orchestration layer to prompt the user",
    "Add server-side validation that permits execution only if an identical preview occurred recently",
    "Replace with a two-step flow: <code>preview_remove_member</code> returns impact details and a single-use confirmation token, and <code>execute_remove_member</code> requires that token"
  ],
  correct:3,
  explanation:"The two-step confirmation token pattern makes it architecturally impossible to execute without previewing first. The execute step requires a token that only the preview step produces, creating a cryptographic dependency chain. Prompt instructions (A) are probabilistic — the agent can still skip them. Orchestration-layer confirmation (B) doesn't guarantee the preview step ran. Server-side validation (C) is weaker than token-based linking since it relies on time-based matching rather than direct cryptographic coupling."
},
{
  id:65, module:2, scenario:"Multi-Agent Research System",
  text:"Your <code>update_game_score</code> tool accepts <code>game_date</code>, <code>home_team</code>, and <code>away_team</code>, but production logs show issues with nicknames, date formats, and selecting the wrong game when teams have rematches. What interface change would most effectively prevent these errors?",
  options:[
    "Add <code>season</code> and <code>confirm_before_update</code> parameters",
    "Replace the parameters with a <code>game_id</code> and a separate <code>search_games</code> lookup tool that returns matching IDs",
    "Add enum constraints for team names and a regex pattern for the date",
    "Add detailed examples showing the required date format and complete list of official team names"
  ],
  correct:1,
  explanation:"Replacing ambiguous parameters (team names, dates) with a unique game_id and a separate search_games lookup tool eliminates the class of errors entirely. The lookup returns candidate games the user can confirm, and the update uses an unambiguous ID. Adding constraints (C) still allows format edge cases. Examples (D) help but can't cover all nicknames. Additional parameters (A) add complexity without solving disambiguation."
},
{
  id:66, module:2, scenario:"Multi-Agent Research System",
  text:"Your <code>search_catalog</code> tool fails sometimes due to network timeouts that often succeed on retry and sometimes due to malformed user filters that never succeed on retry. Currently both errors are returned identically. How should the tool's error handling be modified?",
  options:[
    "Add few-shot examples to the system prompt explaining how to handle different error types",
    "Apply exponential backoff retries to all errors uniformly",
    "Return all errors with a <code>retryable</code> boolean and error type details",
    "Implement automatic retry with backoff for network timeouts inside the tool and return syntax errors immediately with parameter validation details"
  ],
  correct:3,
  explanation:"The most effective approach handles each error type at the appropriate level: transient network errors are retried internally (the agent never needs to know), while permanent errors like malformed filters are returned immediately with clear validation details so the agent can fix the parameters. Option B wastes time retrying permanent errors. Option C exposes transient retry logic to the agent unnecessarily. Option A relies on prompt-based guidance."
},
{
  id:67, module:2, scenario:"Developer Productivity with Claude",
  text:"Your agent needs to insert a helper function into the middle of a utility module, but the <code>Edit</code> tool cannot find unique text to match because the file contains repetitive patterns. What is the most reliable way to complete the insertion?",
  options:[
    "Use Edit with a very long <code>old_string</code> to try to force uniqueness",
    "Use <code>Read</code> to load the file, insert the function in the right place, then <code>Write</code> the updated file",
    "Append the function at the end of the file using Bash",
    "Use <code>replace_all</code> and embed the new function in the replacement text"
  ],
  correct:1,
  explanation:"When Edit fails due to non-unique text patterns, the reliable fallback is Read→modify→Write. Read loads the full file content, you insert the function at the correct position, and Write replaces the file. Option A may still fail if the surrounding context is also repetitive. Option C puts the function in the wrong location. Option D replaces all instances of a pattern, which could cause unintended changes throughout the file."
},
{
  id:74, module:2, scenario:"Multi-Agent Research System",
  text:"Your <code>log_workout</code> tool accepts <code>exercise_type</code>, <code>value</code>, and <code>measurement</code>, and the agent frequently passes invalid combinations such as reps for cardio and miles for strength exercises. What would most effectively reduce these errors?",
  options:[
    "Split the interface into <code>log_cardio_workout</code> and <code>log_strength_workout</code> with parameters appropriate to each category",
    "Implement server-side validation with descriptive error messages",
    "Add enum constraints on the measurement field",
    "Add explicit examples to the tool description showing valid combinations"
  ],
  correct:0,
  explanation:"Splitting into category-specific tools eliminates invalid combinations at the interface level. log_cardio_workout only accepts duration/distance parameters; log_strength_workout only accepts sets/reps. The agent can't mix them because the wrong parameter simply doesn't exist on the tool. Server-side validation (B) catches errors after the fact. Enum constraints (C) still allow mismatches between exercise type and measurement. Examples (D) are probabilistic guidance."
},
{
  id:75, module:2, scenario:"Multi-Agent Research System",
  text:"Your resource allocation tool returns only a simple acknowledgment after provisioning is requested. Users often confirm without understanding what they approved. What design change would most effectively address this?",
  options:[
    "Add a <code>user_acknowledged</code> boolean parameter that must be set true",
    "Add a <code>detail_level</code> parameter controlling how much context the agent presents",
    "Return structured data including cost estimate, target project, resource specifications, and impact summary",
    "Implement a hold period before execution completes"
  ],
  correct:2,
  explanation:"Returning structured details (cost, project, specs, impact) gives the agent the information needed to present a meaningful confirmation to the user. Users can then make informed decisions rather than blindly approving. A boolean parameter (A) doesn't add information. A detail_level parameter (B) puts the burden on the agent to choose. A hold period (D) delays but doesn't inform."
},
{
  id:76, module:2, scenario:"Multi-Agent Research System",
  text:"Your document analysis subagent has access to both a <code>summarize_content</code> and <code>analyze_document</code> tool. The model frequently calls <code>summarize_content</code> when <code>analyze_document</code> would be more appropriate. Why is this happening and how do you fix it?",
  options:[
    "The model is hallucinating; add error handling to reject summarize_content calls",
    "The tool descriptions are ambiguous — expand them to clarify when to use each tool and provide example queries for each",
    "The subagent's system prompt doesn't mention analyze_document; add it explicitly",
    "Restrict the subagent to only the analyze_document tool using allowedTools"
  ],
  correct:1,
  explanation:"When two tools have overlapping descriptions, the model can't reliably distinguish when to use each. The fix is expanding descriptions to clarify boundaries: 'summarize_content — for generating brief overviews of known documents. Do NOT use for detailed analysis' vs. 'analyze_document — for deep analysis including themes, structure, and key findings. Use when the user needs detailed understanding.' Adding example queries for each reinforces the distinction. Option D removes a useful tool. Option C is insufficient — system prompts don't fix ambiguous tool definitions."
}
);
