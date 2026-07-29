// Domain 2: Tool Design & MCP Integration (18% of exam)
// 28 questions covering: tool descriptions, structured errors, tool distribution,
// MCP servers, built-in tools
QUESTIONS.push(
{
  id:29, module:2, scenario:"Customer Support Resolution Agent",
  text:"Your agent has two tools: <code>get_customer</code> ('Retrieves customer information') and <code>lookup_order</code> ('Retrieves order details'). Both accept an <code>identifier</code> string parameter. Logs show the agent calls <code>get_customer</code> 40% of the time when users ask about orders (e.g., 'check my order #12345'). What's the highest-leverage fix?",
  options:[
    "Rename the tools to <code>search_customer_by_name_email</code> and <code>search_order_by_id_or_tracking</code> to make the distinction obvious from the name alone",
    "Add a routing classifier that pre-selects the appropriate tool based on keyword analysis before Claude sees the user message",
    "Expand tool descriptions to include input formats, example queries, edge cases, and explicit boundaries: 'Use this for order IDs (ORD-*), tracking numbers — NOT for customer name or email lookups'",
    "Consolidate into a single <code>lookup_entity</code> tool that internally routes to the correct backend based on the identifier format"
  ],
  correct:2,
  explanation:"Tool descriptions are the primary mechanism LLMs use for tool selection. Detailed descriptions with input formats, examples, and explicit 'when NOT to use' guidance directly fix the ambiguity causing misrouting. Option A helps but names alone can't convey edge cases. Option B bypasses the LLM's natural language understanding. Option D is valid architecturally but requires more engineering effort for what's fundamentally a description problem."
},
{
  id:30, module:2, scenario:"Customer Support Resolution Agent",
  text:"Your <code>process_refund</code> tool receives an invalid order ID and fails. The current implementation throws a Python exception, which crashes the agentic loop. What's the correct error handling pattern for MCP/tool implementations?",
  options:[
    "Catch the exception and return an empty response to indicate failure",
    "Catch the exception and return a <code>tool_result</code> with <code>is_error: true</code> and a descriptive message explaining what went wrong and suggesting the correct format",
    "Let the exception propagate to the top-level handler so it can be logged and the session terminated gracefully",
    "Return a <code>tool_result</code> with a generic message: 'An error occurred. Please try again later.'"
  ],
  correct:1,
  explanation:"Tool failures should be returned as data, not exceptions. A tool_result with is_error: true and a descriptive message lets the model understand what went wrong and self-correct (e.g., 'Invalid order ID format. Expected ORD-XXXX.'). Option A gives the model no information. Option C crashes the session instead of allowing recovery. Option D hides valuable debugging context the model needs to retry correctly."
},
{
  id:31, module:2, scenario:"Developer Productivity with Claude",
  text:"You're building an MCP server that exposes order data and a docs server that serves policy documents. Both need to be available to Claude Code simultaneously in a project. Where do you configure this?",
  options:[
    "Add both servers to the global Claude Code settings at <code>~/.claude/settings.json</code> so they're available in all projects",
    "Create separate <code>CLAUDE.md</code> entries for each server with connection URLs",
    "Configure both servers in the project's <code>.mcp.json</code> file, declaring each with its command, args, and environment variables",
    "Start each server manually in separate terminal windows and Claude Code will auto-discover them on the local network"
  ],
  correct:2,
  explanation:".mcp.json is the project-level configuration file for MCP servers. It declares each server with its startup command, arguments, and environment variables. Claude Code reads this file and launches the servers automatically. Option A would expose project-specific servers to all projects. Option B misuses CLAUDE.md, which is for instructions not server config. Option D is wrong — Claude Code doesn't auto-discover MCP servers."
},
{
  id:32, module:2, scenario:"Customer Support Resolution Agent",
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
  id:33, module:2, scenario:"Developer Productivity with Claude",
  text:"Your MCP server exposes a <code>search_knowledge_base</code> tool and also publishes policy documents as MCP resources. A developer asks: 'When should the agent use the tool vs. read the resource?' What's the correct distinction?",
  options:[
    "There's no practical difference — tools and resources both provide content to the agent",
    "Tools are for dynamic queries with parameters (searching, filtering, writing), while resources are read-only content catalogs (policy docs, reference data) that provide stable context without side effects",
    "Resources are faster because they're cached; tools always make a fresh call to the backend",
    "Resources are for structured data (JSON, CSV); tools are for unstructured text"
  ],
  correct:1,
  explanation:"MCP tools are for actions with parameters (search, create, update), while resources expose read-only content catalogs. Resources are ideal for stable reference material (policies, documentation) that the agent needs for context. Tools handle dynamic queries that depend on user input. Option A misses the semantic distinction. Options C and D describe implementation details that aren't definitionally true."
},
{
  id:34, module:2, scenario:"Customer Support Resolution Agent",
  text:"You're designing a <code>process_return</code> tool. The tool name is clear, but you need to write the description. Which description best helps the model use the tool correctly?",
  options:[
    "'Processes a return for a customer order.'",
    "'Use this tool to process returns. Parameters: order_id (string), reason (string), refund_type (string).'",
    "'Initiates a return and refund for a verified order. Requires a verified customer_id from get_customer and a valid order_id from lookup_order. Use for standard returns only — escalate damage claims, warranty issues, and orders older than 90 days to a human agent.'",
    "'Returns processing endpoint. POST /api/returns. See API documentation for details.'"
  ],
  correct:2,
  explanation:"The best tool descriptions include: what it does, prerequisites (verified customer_id, valid order_id), when to use it (standard returns), and when NOT to use it (damage claims, warranty, old orders). This gives the model clear decision boundaries. Option A is too vague. Option B lists parameters but no usage guidance. Option D references external docs the model can't access."
},
{
  id:35, module:2, scenario:"Developer Productivity with Claude",
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
  id:36, module:2, scenario:"Customer Support Resolution Agent",
  text:"Your <code>lookup_order</code> tool sometimes fails due to database timeouts. You want Claude to understand the failure is transient and worth retrying. How should you structure the error response?",
  options:[
    "Return a generic error: 'Tool execution failed. Please try again.'",
    "Return a structured error envelope: <code>{isError: true, isRetryable: true, errorCategory: 'timeout', message: 'Database timeout after 5s. The order lookup service is experiencing high load. Retry in a few seconds.'}</code>",
    "Throw an exception that causes the agentic loop to retry automatically with exponential backoff",
    "Return <code>isError: false</code> with a 'retry_needed' flag in the data so the model doesn't treat it as a failure"
  ],
  correct:1,
  explanation:"A structured error envelope with isError, isRetryable, errorCategory, and a descriptive message gives the model complete context to decide how to proceed. It knows the failure is transient (isRetryable: true), what happened (timeout), and can inform the customer appropriately. Option A lacks detail. Option C handles retries outside the model's reasoning. Option D misrepresents the result status."
},
{
  id:37, module:2, scenario:"Developer Productivity with Claude",
  text:"Your agent needs to classify incoming support tickets. You want to guarantee that every response is a valid classification object, never free-form text. What <code>tool_choice</code> setting achieves this?",
  options:[
    "<code>tool_choice: 'auto'</code> — the model decides whether to use the classification tool or respond with text",
    "<code>tool_choice: 'none'</code> — disable tools and have the model output JSON in its text response",
    "<code>tool_choice: {type: 'tool', name: 'classify_ticket'}</code> — forces the model to call exactly the <code>classify_ticket</code> tool every time",
    "<code>tool_choice: 'any'</code> — the model must call a tool but can pick which one"
  ],
  correct:2,
  explanation:"tool_choice with type 'tool' and a specific name forces the model to call exactly that tool — it cannot respond with text or choose a different tool. This guarantees structured output via the tool's schema. Option A allows text responses. Option B removes the schema guarantee. Option D forces a tool call but doesn't guarantee which tool."
},
{
  id:38, module:2, scenario:"Developer Productivity with Claude",
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
  id:39, module:2, scenario:"Customer Support Resolution Agent",
  text:"Your tool <code>apply_discount</code> requires a <code>discount_percent</code> parameter. During testing, Claude sometimes passes negative values (-10%) or values over 100 (150%). The JSON schema type is <code>number</code>. How should you add validation?",
  options:[
    "Add validation in the tool description: 'discount_percent must be between 0 and 50'",
    "Add <code>minimum: 0</code> and <code>maximum: 50</code> constraints in the JSON schema, PLUS add a semantic validator in your tool handler that enforces business rules the schema can't express",
    "Only validate in the tool handler code — schema constraints are optional and unreliable",
    "Trust the model to provide valid values since it follows instructions well with proper prompting"
  ],
  correct:1,
  explanation:"Defense in depth: JSON schema constraints (minimum, maximum) catch obvious violations at the schema level, while a semantic validator in the handler enforces business rules the schema can't express (e.g., only managers can apply discounts over 20%). Option A is guidance only, not enforcement. Option C skips the first layer of defense. Option D trusts probabilistic behavior for financial operations."
},
{
  id:40, module:2, scenario:"Developer Productivity with Claude",
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
  id:41, module:2, scenario:"Developer Productivity with Claude",
  text:"You want Claude Code to use the built-in <code>Glob</code>, <code>Grep</code>, <code>Read</code>, and <code>Edit</code> tools to explore and refactor a TypeScript codebase. A junior developer asks why not just load all files into the prompt upfront. What's the key advantage of the incremental exploration pattern?",
  options:[
    "The built-in tools are faster than reading files into the prompt",
    "Loading all files upfront consumes the context window with potentially irrelevant content, while the find → read-only-what-matters → change loop keeps context focused on relevant code",
    "The built-in tools provide syntax highlighting that the prompt doesn't",
    "Loading files into the prompt is not supported — you must use the built-in tools"
  ],
  correct:1,
  explanation:"The incremental exploration pattern (Glob to find files → Read to inspect relevant ones → Edit to change) keeps the context window focused on what matters. Loading everything upfront ('just in case') wastes context on irrelevant files, potentially pushing important content out of the model's attention window. This is especially critical for large codebases."
},
{
  id:42, module:2, scenario:"Customer Support Resolution Agent",
  text:"Your agent has 12 tools available. During a simple 'check order status' flow, the agent calls 6 tools unnecessarily (checking inventory, warranty, shipping rates) before finally calling <code>lookup_order</code>. What's the most targeted fix?",
  options:[
    "Reduce the total number of tools available to the agent to only the 3 most common ones",
    "Add 'when NOT to use' guidance to each tool's description, explicitly listing scenarios where the tool is unnecessary",
    "Implement a pre-processing step that selects a subset of tools based on the detected intent before passing to Claude",
    "Reorder the tools in the API request so <code>lookup_order</code> appears first in the list"
  ],
  correct:1,
  explanation:"Adding explicit 'when NOT to use' boundaries in tool descriptions helps the model avoid irrelevant tools without removing capabilities it needs for other flows. Option A removes tools needed for other scenarios. Option C adds engineering complexity for a prompt-solvable problem. Option D doesn't reliably affect selection — the model reads descriptions, not positions."
},
{
  id:43, module:2, scenario:"Developer Productivity with Claude",
  text:"You're using <code>tool_choice: 'any'</code> with extended thinking enabled (manual mode). Your API call returns an error. What's likely wrong?",
  options:[
    "Extended thinking isn't compatible with tool use at all",
    "Forced tool use (<code>'any'</code> and <code>{type:'tool', name:'...'}</code>) is NOT compatible with manual extended thinking because it prefills the assistant message, which conflicts with the thinking block. Use <code>'auto'</code> instead, or switch to adaptive thinking",
    "You need to increase the thinking budget to accommodate tool use overhead",
    "Extended thinking requires a special API endpoint that supports both features"
  ],
  correct:1,
  explanation:"Manual extended thinking only supports tool_choice 'auto' or 'none'. Forced tool use ('any' or specific tool) prefills the assistant message, which conflicts with how thinking blocks are generated. The fix is to switch to tool_choice 'auto' or use adaptive thinking (the newer alternative), which supports ALL tool_choice values."
},
{
  id:44, module:2, scenario:"Customer Support Resolution Agent",
  text:"You need to design tools for an order management system. One approach uses fine-grained tools (<code>get_order_status</code>, <code>get_order_items</code>, <code>get_order_shipping</code>); another uses a single <code>get_order</code> that returns everything. The agent handles 500 requests/hour. Which approach is better and why?",
  options:[
    "Fine-grained tools always — they reduce response size and save tokens on every call",
    "Single comprehensive tool always — fewer tool calls means faster responses",
    "It depends on usage patterns: if 80% of queries need just the status, fine-grained tools save tokens on most calls. If queries typically need all order data, a single tool reduces round-trips",
    "Use both — provide fine-grained tools as the default and the comprehensive tool as a fallback"
  ],
  correct:2,
  explanation:"Tool granularity should match actual usage patterns. If most queries need just status, returning the full order object every time wastes tokens at scale (500 req/hr). But if queries typically need multiple fields, fine-grained tools force unnecessary round-trips. Analyze your access patterns before deciding. Option D adds tool selection complexity without clear benefit."
},
{
  id:45, module:2, scenario:"Developer Productivity with Claude",
  text:"Your MCP server needs to return a large dataset (500 customer records) from a tool call. If you return all 500 records, they'll consume most of the context window. What's the best pattern?",
  options:[
    "Return all 500 records and let the model filter what it needs",
    "Implement pagination in the tool — return the first 20 results with a <code>next_page_token</code>, letting the model request more pages if needed",
    "Truncate to the first 10 records without indicating there are more",
    "Compress the data by removing field names and using positional arrays"
  ],
  correct:1,
  explanation:"Pagination keeps the context window manageable while giving the model access to all data through subsequent calls. The model can reason about whether it needs more results based on the initial page. Option A risks context window exhaustion. Option C silently loses data. Option D makes the data uninterpretable to the model."
},
{
  id:46, module:2, scenario:"Customer Support Resolution Agent",
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
  id:47, module:2, scenario:"Developer Productivity with Claude",
  text:"You have three extraction schemas: <code>extract_invoice</code>, <code>extract_receipt</code>, and <code>extract_contract</code>. Documents arrive in mixed batches where the type isn't known upfront. What <code>tool_choice</code> setting handles this?",
  options:[
    "<code>tool_choice: 'auto'</code> — let the model decide whether to extract or just describe the document",
    "<code>tool_choice: 'any'</code> — force the model to call one of the extraction tools, but let it choose which schema matches the document type",
    "<code>tool_choice: {type: 'tool', name: 'extract_invoice'}</code> — default to invoices and retry with other schemas if extraction fails",
    "Create a single <code>extract_document</code> tool with a union schema that handles all three types"
  ],
  correct:1,
  explanation:"tool_choice 'any' guarantees structured output (the model must call a tool) while letting the model choose which schema matches the document. This is ideal for mixed-type batches where you want guaranteed extraction but don't know the type upfront. Option A allows text-only responses. Option C forces the wrong schema. Option D creates a complex union schema that's harder to validate."
},
{
  id:48, module:2, scenario:"Customer Support Resolution Agent",
  text:"Your tool returns a result where the customer has two shipping addresses on file but the tool schema has <code>shipping_address</code> as a required single-object field. The tool implementation picks the most recent address and returns it. A customer complains their package went to their old address. What schema design prevents this?",
  options:[
    "Change the schema to return an array of addresses and let the model ask the customer which to use",
    "Add a <code>is_default</code> boolean field to the address object",
    "Keep the single address but add a <code>other_addresses_count</code> field",
    "Return the address as a string instead of a structured object for flexibility"
  ],
  correct:0,
  explanation:"When a customer has multiple addresses, the tool should return all of them so the model can ask which one to use — rather than silently picking one. This follows the same principle as multiple customer matches: ask for clarification rather than applying heuristics. Options B and C still hide information from the model. Option D loses structure."
},
{
  id:49, module:2, scenario:"Developer Productivity with Claude",
  text:"A team member adds a new MCP tool <code>delete_account</code> to your customer support agent. The tool works correctly in testing, but you're concerned about production safety. What's the most important safeguard to add?",
  options:[
    "Add 'USE WITH EXTREME CAUTION' to the tool description",
    "Implement a <code>PreToolUse</code> hook that requires human approval before <code>delete_account</code> executes, blocking the call and surfacing the details for review",
    "Limit <code>delete_account</code> availability to business hours only",
    "Log all delete_account calls for post-hoc auditing"
  ],
  correct:1,
  explanation:"A PreToolUse hook provides programmatic enforcement — it intercepts the tool call before execution and blocks it until a human approves. This is deterministic safety for destructive operations. Option A is prompt-based guidance the model can ignore. Option C is arbitrary and doesn't prevent misuse during business hours. Option D is reactive (after the fact) rather than preventive."
},
{
  id:50, module:2, scenario:"Developer Productivity with Claude",
  text:"Your agent needs to handle tool calls where the same tool is called multiple times with different parameters in a single response (e.g., three parallel <code>search</code> calls). Your current code processes only the first tool_use block. What's wrong?",
  options:[
    "The API only ever returns one tool_use block per response — your code is correct",
    "Your code must iterate over ALL tool_use blocks in the response content, execute each tool, and return ALL tool_results in a single message before sending back to Claude",
    "Each tool_use block should be processed in a separate API call",
    "Only the last tool_use block matters — previous ones are superseded"
  ],
  correct:1,
  explanation:"A single response can contain multiple tool_use blocks for parallel execution. Your code must process all of them, execute each tool, and include all corresponding tool_result messages in the response. Missing tool results will cause the model to lose track of its pending operations."
},
{
  id:51, module:2, scenario:"Customer Support Resolution Agent",
  text:"Your compliance team requires that outgoing tool calls to external payment processors never include raw credit card numbers. A <code>PostToolUse</code> hook can inspect results after execution, but you need to block the call BEFORE it reaches the payment processor. What mechanism should you use?",
  options:[
    "Add instructions to the system prompt: 'Never include raw credit card numbers in tool calls'",
    "Use a <code>PreToolUse</code> hook that inspects the tool call parameters before execution and blocks calls containing card number patterns, returning exit code 2 with feedback explaining the violation",
    "Validate the tool result after execution and delete any card numbers from the response",
    "Use <code>disallowedTools</code> to prevent the payment processing tool from being called entirely"
  ],
  correct:1,
  explanation:"PreToolUse hooks intercept tool calls BEFORE execution. Exit code 2 blocks the call and sends feedback to Claude explaining why, allowing the model to reformulate (e.g., using a tokenized card reference instead). Option A is probabilistic. Option C is too late — the data already reached the processor. Option D prevents all payment processing, not just unsafe calls."
},
{
  id:52, module:2, scenario:"Developer Productivity with Claude",
  text:"You're designing tool names for a suite of customer management tools. A junior developer proposes: <code>doCustomerStuff</code>, <code>handleOrder</code>, <code>processReturn</code>. What naming convention should you recommend instead?",
  options:[
    "Use single verbs: <code>get</code>, <code>handle</code>, <code>process</code>",
    "Use the object_action pattern: <code>customer_lookup</code>, <code>order_search</code>, <code>return_initiate</code> — making the target entity and action clear from the name",
    "Use long descriptive names: <code>retrieve_customer_information_by_id_or_email</code>",
    "Use numbered tools: <code>tool_1</code>, <code>tool_2</code>, <code>tool_3</code> with descriptions providing the details"
  ],
  correct:1,
  explanation:"The object_action naming pattern (noun + verb) makes both the target entity and the operation clear from the name alone: customer_lookup, order_search, return_initiate. This helps the model select the right tool quickly. Option A is too vague. Option C is unnecessarily verbose. Option D removes semantic meaning from names."
},
{
  id:53, module:2, scenario:"Customer Support Resolution Agent",
  text:"Your order lookup tool accepts a <code>date_range</code> parameter as a free-text string. Claude sometimes passes '2024', sometimes 'last month', sometimes '2024-01-01 to 2024-03-31'. This causes intermittent parsing failures. What's the fix?",
  options:[
    "Add examples of valid formats in the tool description",
    "Accept any format and parse it server-side with a flexible date parser",
    "Replace the free-text string with structured parameters: <code>start_date</code> (string, format: 'YYYY-MM-DD') and <code>end_date</code> (string, format: 'YYYY-MM-DD') with explicit format constraints",
    "Add a regex pattern validator that rejects non-ISO dates"
  ],
  correct:2,
  explanation:"Structured parameters with explicit format constraints eliminate ambiguity — the model knows exactly what format to use. This is more reliable than hoping the model reads description examples (A), building a complex parser (B), or rejecting valid-seeming inputs (D). Typed, constrained parameters are always preferable to free-text."
},
{
  id:54, module:2, scenario:"Developer Productivity with Claude",
  text:"Your agent needs to render a customer summary report. You have two options: (1) a tool that returns raw data and lets the model format it, or (2) a tool that returns pre-formatted markdown. The report includes tabular financial data. Which approach is better?",
  options:[
    "Always use raw data — the model is better at formatting than any template",
    "Always use pre-formatted output — it's faster and uses fewer tokens",
    "Return raw structured data and let the model format it. The model can adapt formatting to the conversation context, but include format guidance in the tool description for complex layouts like financial tables",
    "Return both raw data and a pre-formatted version, letting the model choose"
  ],
  correct:2,
  explanation:"Returning raw structured data is more flexible — the model can adapt the presentation to the specific conversation (brief summary vs. detailed breakdown). But for complex layouts like financial tables, include formatting guidance in the tool description to ensure consistent presentation. Option A ignores that tables need guidance. Option B is inflexible. Option D wastes tokens."
},
{
  id:55, module:2, scenario:"Customer Support Resolution Agent",
  text:"Your agent has a <code>PostToolUse</code> hook that checks tool results for compliance violations (e.g., PII in responses that shouldn't have it). When a violation is detected, the hook should prevent the non-compliant data from reaching Claude. What should the hook return?",
  options:[
    "Exit code 0 with the original data — the hook can't modify results",
    "Exit code 1 to signal a general error that terminates the session",
    "A modified version of the tool result with PII redacted, plus exit code 0 to allow the (now sanitized) result to proceed to Claude",
    "Exit code 2 to block the tool call retroactively"
  ],
  correct:2,
  explanation:"PostToolUse hooks can transform tool results before the model processes them. Returning exit code 0 with modified content (PII redacted) lets the conversation continue with sanitized data. Exit code 2 blocks, which is for PreToolUse. Exit code 1 signals an error. The hook's power here is in data transformation, not just gatekeeping."
},
{
  id:56, module:2, scenario:"Developer Productivity with Claude",
  text:"Your team needs an MCP tool that creates Jira tickets. A junior developer implements it to accept a single <code>description</code> text field, letting the model write the entire ticket content. Tickets created this way have inconsistent formats — sometimes they have acceptance criteria, sometimes not; severity fields vary. What's the better design?",
  options:[
    "Add a system prompt instruction requiring consistent ticket formatting",
    "Post-process the text field to extract structured components using regex",
    "Design the tool schema with explicit parameters: <code>title</code>, <code>description</code>, <code>severity</code> (enum), <code>acceptance_criteria</code> (array of strings), <code>assignee</code> — forcing consistent structure through the schema",
    "Add few-shot examples of well-formatted tickets to the prompt"
  ],
  correct:2,
  explanation:"Explicit schema parameters force consistency structurally — the model must provide each field in the specified type. An enum for severity guarantees valid values. An array for acceptance criteria guarantees they're present and separated. This is more reliable than prompt instructions (A, D) or post-processing (B), which all depend on the model generating consistent text."
}
);
