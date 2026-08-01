// Domain 1: Agentic Architecture & Orchestration (27% of exam)
// 16 curated questions covering all 7 task statements:
// 1.1 Agentic loops (Q1-Q4), 1.2 Multi-agent patterns (Q5-Q6),
// 1.3 Subagent invocation & allowedTools (Q7-Q8), 1.4 Multi-step enforcement (Q9-Q10),
// 1.5 Agent SDK hooks (Q11), 1.6 Task decomposition (Q12-Q13),
// 1.7 Session state & resumption (Q14-Q16)
QUESTIONS.push(
{
  id:1, module:1, scenario:"Customer Support Resolution Agent",
  text:"Your agent processes a return request. After calling <code>lookup_order</code>, your agentic loop receives a response with <code>stop_reason</code> set to <code>'end_turn'</code>, but the agent hasn't called <code>process_refund</code> yet. The model's response text says: 'I've found the order details. The order #4521 for a hiking backpack was placed on March 3rd.' What should your orchestration code do?",
  options:[
    "Continue the loop by sending another request to Claude — <code>end_turn</code> simply means 'ready for more input' and the model will proceed to the next step automatically",
    "Present the agent's response to the customer and wait for further instructions — <code>end_turn</code> means the model has decided to stop and communicate before taking further action",
    "Force a <code>process_refund</code> call by setting <code>tool_choice</code> to the specific tool, since the model clearly forgot to continue",
    "Log an error because <code>end_turn</code> should never occur mid-workflow when there are outstanding tools to call"
  ],
  correct:1,
  explanation:"When stop_reason is 'end_turn', the model has deliberately chosen to stop and present information to the user. In this case, the agent is surfacing order details before proceeding — perhaps to confirm the correct order before processing a refund. This is correct agent behavior: verify before acting. Option A misinterprets end_turn — it means the model is done, not 'ready for more.' Option C forces an action the model intentionally deferred. Option D treats normal model behavior as an error."
},
{
  id:2, module:1, scenario:"Customer Support Resolution Agent",
  text:"Your agentic loop receives a response with <code>stop_reason: 'tool_use'</code>. The response content contains a <code>tool_use</code> block requesting <code>lookup_order</code> with input <code>{\"order_id\": \"ORD-7823\"}</code>. What is the correct sequence of actions in your orchestration code?",
  options:[
    "Parse the tool name and input from the <code>stop_reason</code> field, execute <code>lookup_order</code>, and return the result directly to the user",
    "Execute <code>lookup_order</code> with the provided input, append the assistant's message to conversation history, append a <code>tool_result</code> message with the output, and send the updated history back to Claude",
    "Queue the tool call for batch execution, continue collecting any additional tool requests, then execute all queued tools simultaneously",
    "Send an acknowledgment message to Claude confirming the tool call was received, then execute the tool and start a new conversation with the results"
  ],
  correct:1,
  explanation:"The correct agentic loop pattern is: (1) extract tool_use blocks from the assistant's response content (not from stop_reason), (2) execute the tool externally, (3) append the full assistant message to conversation history, (4) append a tool_result message with the output, (5) send the complete updated history back to Claude. Option A doesn't continue the loop. Option C risks missing dependencies between sequential tool calls. Option D breaks conversation continuity by starting a new conversation."
},
{
  id:3, module:1, scenario:"Multi-Agent Research System",
  text:"Your agentic loop receives a response with <code>stop_reason: 'pause_turn'</code>. The agent has made 10 tool calls in this turn and appears to be mid-research. What does this indicate and what should your code do?",
  options:[
    "The model has paused to wait for user input before continuing — display a prompt asking the user to confirm continuation",
    "The API rate limit has been hit — implement exponential backoff and retry after a delay",
    "The server-side sampling loop reached its iteration limit; send the assistant's response back as a new message to continue processing where it left off",
    "The model encountered an internal error — retry the entire request from the beginning"
  ],
  correct:2,
  explanation:"'pause_turn' means the server-side agentic loop hit its per-turn iteration cap (default 10 tool calls). Your orchestration code should append the assistant's response to conversation history and send it back to continue where it left off. This is distinct from 'tool_use' (specific tool call request), 'end_turn' (model is done), and rate limiting (which returns HTTP 429). The model's state is preserved — it just needs another turn to keep going."
},
{
  id:4, module:1, scenario:"Multi-Agent Research System",
  text:"Your agentic loop implementation checks for termination by scanning the model's response text for phrases like 'I'm done' or 'task complete.' During testing, you find the agent sometimes says 'I'm done analyzing the first source' (meaning it will continue) and the loop terminates prematurely. What's the correct fix?",
  options:[
    "Add more termination phrases to the scanner to cover edge cases",
    "Use regular expressions to better parse the model's natural language signals",
    "Replace text scanning with the <code>stop_reason</code> field — terminate when <code>stop_reason</code> is <code>'end_turn'</code>, continue when it's <code>'tool_use'</code>",
    "Have the model output a special JSON token like <code>{\"done\": true}</code> to signal completion"
  ],
  correct:2,
  explanation:"Text scanning for termination is an anti-pattern — natural language is ambiguous ('I'm done analyzing' doesn't mean 'I'm done with everything'). The stop_reason field is the authoritative signal: 'tool_use' means the model wants to call a tool (continue looping), 'end_turn' means it's finished (terminate). Options A and B try to fix an inherently unreliable approach. Option D adds complexity when the API already provides the correct mechanism."
},
{
  id:5, module:1, scenario:"Multi-Agent Research System",
  text:"After running your system on the topic 'impact of AI on creative industries,' each subagent completes successfully: the web search agent finds relevant articles, the document analysis agent summarizes papers correctly, and the synthesis agent produces coherent output. However, the final report covers only visual arts — completely missing music, writing, and film. The coordinator's logs show it decomposed the topic into three subtasks: 'AI in digital art,' 'AI in graphic design,' and 'AI in photography.' What is the most likely root cause?",
  options:[
    "The synthesis agent lacks instructions for identifying coverage gaps in the findings it receives from other agents",
    "The coordinator agent's task decomposition is too narrow, resulting in subagent assignments that don't cover all relevant domains of the topic",
    "The web search agent's queries are not comprehensive enough and need to be expanded to cover more creative industry sectors",
    "The document analysis agent is filtering out sources related to non-visual creative industries due to overly restrictive relevance criteria"
  ],
  correct:1,
  explanation:"The coordinator's logs reveal the root cause directly: it decomposed 'creative industries' into only visual arts subtasks (digital art, graphic design, photography), completely omitting music, writing, and film. The subagents executed their assigned tasks correctly — the problem is what they were assigned. Options A, C, and D incorrectly blame downstream agents that are working correctly within their assigned scope."
},
{
  id:6, module:1, scenario:"Customer Support Resolution Agent",
  text:"You're implementing a hub-and-spoke architecture where the coordinator delegates billing issues to a billing subagent and returns issues to a returns subagent. During testing, you find the billing subagent sometimes processes a refund incorrectly because it doesn't know the customer's loyalty tier, which was established earlier in the coordinator's conversation. What's the root cause and fix?",
  options:[
    "The subagent's system prompt needs to request loyalty tier information before processing refunds",
    "The coordinator must explicitly pass relevant context (customer data, loyalty tier, order details) to the subagent — subagents don't inherit the parent's conversation history",
    "Switch to a single-agent architecture because multi-agent systems can't reliably share state",
    "Store the loyalty tier in a shared database that both the coordinator and subagents query"
  ],
  correct:1,
  explanation:"Subagents created via the Task tool start with a fresh, isolated context. The parent's conversation history is NOT automatically inherited. The coordinator must explicitly include relevant context (customer ID, loyalty tier, order details) in the Task tool's prompt when delegating. Option A would have the subagent ask the customer again, wasting time. Option C is an overreaction — multi-agent works fine with explicit context passing. Option D adds unnecessary infrastructure when the coordinator already has the information."
},
{
  id:7, module:1, scenario:"Multi-Agent Research System",
  text:"During testing, you observe that the synthesis agent frequently needs to verify specific claims while combining findings. Currently, when verification is needed, the synthesis agent returns control to the coordinator, which invokes the web search agent, then re-invokes synthesis with results. This adds 2-3 round trips per task and increases latency by 40%. Your evaluation shows that 85% of these verifications are simple fact-checks while 15% require deeper investigation. What's the most effective approach to reduce overhead while maintaining reliability?",
  options:[
    "Give the synthesis agent a scoped <code>verify_fact</code> tool for simple lookups, while complex verifications continue delegating to the web search agent through the coordinator",
    "Have the synthesis agent accumulate all verification needs and return them as a batch to the coordinator at the end of its pass, which then sends them all to the web search agent at once",
    "Give the synthesis agent access to all web search tools so it can handle any verification need directly without round-trips through the coordinator",
    "Have the web search agent proactively cache extra context around each source during initial research, anticipating what the synthesis agent might need to verify"
  ],
  correct:0,
  explanation:"Option A applies the principle of least privilege by giving the synthesis agent only what it needs for the 85% common case (simple fact verification) while preserving the existing coordination pattern for complex cases. Option B's batching approach creates blocking dependencies since synthesis steps may depend on earlier verified facts. Option C over-provisions the synthesis agent, violating separation of concerns. Option D relies on speculative caching that cannot reliably predict what the synthesis agent will need to verify."
},
{
  id:8, module:1, scenario:"Code Generation with Claude Code",
  text:"You want to restrict a subagent to use only specific tools: Grep, Glob, and Read. How do you configure this using AgentDefinition?",
  options:[
    "Use tool_choice to force only those tools",
    "Set allowedTools: [\"Grep\", \"Glob\", \"Read\"] in the AgentDefinition",
    "Add tool restrictions to CLAUDE.md for the subagent",
    "Create a skill with allowed-tools in the frontmatter"
  ],
  correct:1,
  explanation:"The allowedTools field in AgentDefinition is the correct mechanism to whitelist specific tools for a subagent. This is a hard constraint — the subagent literally cannot call tools outside this list. tool_choice (A) controls which tool to call on a given turn, not which tools are available overall. CLAUDE.md restrictions (C) are prompt-based guidance that can be ignored. Skills with frontmatter (D) is not the correct mechanism for restricting tool access in an AgentDefinition."
},
{
  id:9, module:1, scenario:"Customer Support Resolution Agent",
  text:"Production data shows that in 12% of cases, your agent skips <code>get_customer</code> entirely and calls <code>lookup_order</code> using only the customer's stated name, occasionally leading to misidentified accounts and incorrect refunds. What change would most effectively address this reliability issue?",
  options:[
    "Enhance the system prompt to state that customer verification via <code>get_customer</code> is mandatory before any order operations",
    "Add a programmatic prerequisite that blocks <code>lookup_order</code> and <code>process_refund</code> calls until <code>get_customer</code> has returned a verified customer ID",
    "Add few-shot examples showing the agent always calling <code>get_customer</code> first, even when customers volunteer order details",
    "Implement a routing classifier that analyzes each request and enables only the subset of tools appropriate for that request type"
  ],
  correct:1,
  explanation:"When a specific tool sequence is required for critical business logic (like verifying customer identity before processing refunds), programmatic enforcement provides deterministic guarantees that prompt-based approaches cannot. Options A and C rely on probabilistic LLM compliance, which is insufficient when errors have financial consequences. Option D addresses tool availability rather than tool ordering, which is not the actual problem."
},
{
  id:10, module:1, scenario:"Customer Support Resolution Agent",
  text:"Your agent's system prompt says: 'Always verify customer identity before processing any refund.' Despite this, production logs show that in 8% of cases the agent skips verification when customers provide detailed order information upfront. The team wants a 0% bypass rate for compliance. What enforcement mechanism achieves this?",
  options:[
    "Add the instruction in bold and repeat it three times in the system prompt for emphasis",
    "Add few-shot examples showing the agent verifying identity even when the customer provides order details",
    "Implement a <code>PreToolUse</code> hook that inspects the conversation history before <code>process_refund</code> executes and blocks it if <code>get_customer</code> hasn't been called",
    "Use <code>tool_choice: {type: 'tool', name: 'get_customer'}</code> for every turn to force identity verification"
  ],
  correct:2,
  explanation:"A PreToolUse hook provides deterministic enforcement with a 0% bypass rate — the refund literally cannot execute unless verification has occurred. This is the key distinction between programmatic enforcement (hooks, gates) and prompt-based guidance (options A and B), which are probabilistic and can be overridden by model reasoning. Option D would force get_customer on every turn including non-refund interactions, breaking the agent's ability to handle other requests."
},
{
  id:11, module:1, scenario:"Customer Support Resolution Agent",
  text:"Your agent uses a <code>PostToolUse</code> hook on the <code>lookup_order</code> tool. The hook receives raw order data containing timestamps in three formats (Unix epoch, ISO 8601, and 'MM/DD/YYYY' strings) from different backend systems. What should this hook do?",
  options:[
    "Log the format inconsistencies and pass the raw data through unchanged for the model to interpret",
    "Normalize all timestamps to a single ISO 8601 format before the model processes the tool result, ensuring consistent data regardless of backend source",
    "Reject the tool result and return an error asking the backend team to fix their timestamp formats",
    "Add metadata tags to each timestamp indicating its original format so the model can choose which to use"
  ],
  correct:1,
  explanation:"PostToolUse hooks are ideal for data normalization — transforming heterogeneous formats into a consistent shape before the model sees them. This ensures the agent always works with clean, uniform data regardless of which backend system responded. Option A forces the model to handle format differences, adding complexity and error risk. Option C fails the customer's request due to a backend issue. Option D adds complexity without solving the underlying inconsistency."
},
{
  id:12, module:1, scenario:"Multi-Agent Research System",
  text:"Your coordinator routes research tasks to subagents. For a task on 'renewable energy policy in the EU,' it needs to decide whether to invoke just the web search subagent, just the document analysis subagent, or both. How should you structure this routing decision?",
  options:[
    "Hard-code routing rules: policy topics always go to both subagents, technical topics go to web search only",
    "Let the coordinator use model-driven reasoning to decide dynamically based on the specific research question, available subagents, and the type of information needed",
    "Always invoke all subagents for every query to maximize coverage, filtering irrelevant results later",
    "Create a lookup table in <code>.claude/rules/</code> mapping topic keywords to specific subagent combinations"
  ],
  correct:1,
  explanation:"Model-driven routing lets the coordinator flexibly decide which subagents to invoke based on the specific question and context. For an EU policy question, the coordinator might reason that both web search (for recent developments) and document analysis (for official policy documents) are needed. Option A creates brittle rules that can't handle nuance. Option C wastes resources on irrelevant work. Option D can't anticipate all topic-subagent combinations."
},
{
  id:13, module:1, scenario:"Code Generation with Claude Code",
  text:"You're designing a multi-step code generation workflow. Step 1 generates a module skeleton, Step 2 adds implementations, and Step 3 creates tests. All steps depend on the previous output. Should you use prompt chaining or dynamic task decomposition?",
  options:[
    "Both equally; the choice doesn't matter for structured workflows",
    "Prompt chaining, since each step follows predictably from the previous one",
    "Prompt chaining only if you can predict all possible outcomes in Step 1",
    "Dynamic task decomposition, which adapts based on intermediate results"
  ],
  correct:1,
  explanation:"Prompt chaining is the right pattern when steps are sequential and predictable. Each step (skeleton, implementation, tests) follows a known order with a clear dependency chain, making prompt chaining ideal. Dynamic task decomposition (D) is better for ambiguous tasks where the next step depends on analysis of intermediate results, not for a fixed three-step pipeline. The choice does matter (A) since prompt chaining avoids the overhead of dynamic planning. Option C adds an unnecessary condition — prompt chaining works well for predictable sequential workflows regardless of outcome variability."
},
{
  id:14, module:1, scenario:"Developer Productivity with Claude",
  text:"An engineer proposes using <code>fork_session</code> to explore two different refactoring approaches for the authentication module, which they previously analyzed in an earlier session. Each fork would explore a different approach independently. Why is <code>fork_session</code> particularly well-suited here?",
  options:[
    "fork_session is faster than starting new sessions because it pre-loads the model weights",
    "fork_session creates independent branches from the existing context, preserving the prior analysis while preventing cross-contamination between the two exploration paths",
    "fork_session automatically merges the results of both explorations into a single recommendation",
    "fork_session allows both approaches to share tool results in real time while maintaining separate conversation threads"
  ],
  correct:1,
  explanation:"fork_session creates independent context branches from a shared starting point. Both forks inherit the existing analysis of the authentication module, so the engineer doesn't need to re-explain the context. The branches are fully isolated — exploring approach A won't pollute the context for approach B. Option A mischaracterizes the mechanism. Option C is wrong — merging is the engineer's job. Option D contradicts the isolation purpose."
},
{
  id:15, module:1, scenario:"Customer Support Resolution Agent",
  text:"A customer returns four hours after their initial session. Resuming with stale tool results causes the agent to reference outdated information even after fresh tool calls provide newer facts. What approach most reliably handles returning customers?",
  options:[
    "Start a new session, inject a structured summary of the previous interaction, then make fresh tool calls before engaging.",
    "Resume with full history and add a system prompt telling the agent to always prefer the most recent tool results.",
    "Resume with full history but filter out previous tool_result messages, keeping only the human and assistant turns.",
    "Resume with full history and automatically re-call all previously used tools at session start."
  ],
  correct:0,
  explanation:"Starting a new session with a structured summary avoids the stale data problem entirely. The summary preserves key context (customer ID, issue history, prior resolution attempts) without carrying forward outdated tool results that could confuse the model. Fresh tool calls then provide current data. Resuming with full history and a preference prompt (B) is unreliable since models may still reference earlier tool results. Filtering tool_result messages (C) creates conversation gaps that break the model's understanding. Re-calling all tools (D) is wasteful and still leaves stale results in context alongside fresh ones."
},
{
  id:16, module:1, scenario:"Claude Code for Continuous Integration",
  text:"A Claude Code session is running a complex refactor. Partway through, you need to pause and resume later. What should you use to continue the session?",
  options:[
    "Save the session output and use it as a new prompt",
    "Start a new session and manually repeat prior steps",
    "The --resume flag to continue the session with previous context intact",
    "Use fork_session to create a parallel continuation"
  ],
  correct:2,
  explanation:"The --resume flag is specifically designed to continue an existing Claude Code session with all previous context intact. This preserves the refactoring progress, tool results, and conversation history so work can continue seamlessly. Saving output as a new prompt (A) loses tool state and conversation context. Manually repeating steps (B) is inefficient and error-prone. fork_session (D) creates a branch for parallel exploration, not for simple pause-and-resume of a single workflow."
}
);
