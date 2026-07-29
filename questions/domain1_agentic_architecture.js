// Domain 1: Agentic Architecture & Orchestration (27% of exam)
// 28 questions covering: agentic loops, multi-agent orchestration, subagent spawning,
// multi-step workflows, hooks, task decomposition, session management
QUESTIONS.push(
{
  id:1, module:1, scenario:"Customer Support Resolution Agent",
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
  id:2, module:1, scenario:"Customer Support Resolution Agent",
  text:"Production logs show the agent frequently calls <code>get_customer</code> when users ask about orders (e.g., 'check my order #12345'), instead of calling <code>lookup_order</code>. Both tools have minimal descriptions ('Retrieves customer information' / 'Retrieves order details') and accept similar identifier formats. What's the most effective first step to improve tool selection reliability?",
  options:[
    "Add few-shot examples to the system prompt demonstrating correct tool selection patterns, with 5-8 examples showing order-related queries routing to <code>lookup_order</code>",
    "Expand each tool's description to include input formats it handles, example queries, edge cases, and boundaries explaining when to use it versus similar tools",
    "Implement a routing layer that parses user input before each turn and pre-selects the appropriate tool based on detected keywords and identifier patterns",
    "Consolidate both tools into a single <code>lookup_entity</code> tool that accepts any identifier and internally determines which backend to query"
  ],
  correct:1,
  explanation:"Tool descriptions are the primary mechanism LLMs use for tool selection. When descriptions are minimal, models lack the context to differentiate between similar tools. Option B directly addresses this root cause with a low-effort, high-leverage fix. Few-shot examples (A) add token overhead without fixing the underlying issue. A routing layer (C) is over-engineered and bypasses the LLM's natural language understanding. Consolidating tools (D) is a valid architectural choice but requires more effort than a 'first step' warrants when the immediate problem is inadequate descriptions."
},
{
  id:3, module:1, scenario:"Customer Support Resolution Agent",
  text:"Your agent achieves 55% first-contact resolution, well below the 80% target. Logs show it escalates straightforward cases (standard damage replacements with photo evidence) while attempting to autonomously handle complex situations requiring policy exceptions. What's the most effective way to improve escalation calibration?",
  options:[
    "Add explicit escalation criteria to your system prompt with few-shot examples demonstrating when to escalate versus resolve autonomously",
    "Have the agent self-report a confidence score (1-10) before each response and automatically route requests to humans when confidence falls below a threshold",
    "Deploy a separate classifier model trained on historical tickets to predict which requests need escalation before the main agent begins processing",
    "Implement sentiment analysis to detect customer frustration levels and automatically escalate when negative sentiment exceeds a threshold"
  ],
  correct:0,
  explanation:"Adding explicit escalation criteria with few-shot examples directly addresses the root cause: unclear decision boundaries. This is the proportionate first response before adding infrastructure. Option B fails because LLM self-reported confidence is poorly calibrated — the agent is already incorrectly confident on hard cases. Option C is over-engineered, requiring labeled data and ML infrastructure when prompt optimization hasn't been tried. Option D solves a different problem entirely; sentiment doesn't correlate with case complexity, which is the actual issue."
},
{
  id:4, module:1, scenario:"Multi-Agent Research System",
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
  id:5, module:1, scenario:"Multi-Agent Research System",
  text:"The web search subagent times out while researching a complex topic. You need to design how this failure information flows back to the coordinator agent. Which error propagation approach best enables intelligent recovery?",
  options:[
    "Return structured error context to the coordinator including the failure type, the attempted query, any partial results, and potential alternative approaches",
    "Implement automatic retry logic with exponential backoff within the subagent, returning a generic 'search unavailable' status only after all retries are exhausted",
    "Catch the timeout within the subagent and return an empty result set marked as successful",
    "Propagate the timeout exception directly to a top-level handler that terminates the entire research workflow"
  ],
  correct:0,
  explanation:"Structured error context gives the coordinator the information it needs to make intelligent recovery decisions — whether to retry with a modified query, try an alternative approach, or proceed with partial results. Option B's generic status hides valuable context from the coordinator, preventing informed decisions. Option C suppresses the error by marking failure as success, which prevents any recovery and risks incomplete research outputs. Option D terminates the entire workflow unnecessarily when recovery strategies could succeed."
},
{
  id:6, module:1, scenario:"Multi-Agent Research System",
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
  id:7, module:1, scenario:"Customer Support Resolution Agent",
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
  id:8, module:1, scenario:"Customer Support Resolution Agent",
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
  id:9, module:1, scenario:"Multi-Agent Research System",
  text:"Your coordinator delegates a market analysis task to a research subagent. The subagent returns a comprehensive report, but the coordinator notices it's missing competitor pricing data — a critical component. You want the coordinator to automatically detect such gaps and trigger refinement. Where should this completeness-checking logic live?",
  options:[
    "In a PostToolUse hook attached to the Task tool that inspects subagent results before the coordinator sees them",
    "In the subagent's system prompt as a self-check rule: 'Before returning results, verify you've covered competitor pricing'",
    "In the coordinator's agentic loop — after receiving the Task tool result, the coordinator evaluates completeness and re-invokes the subagent with targeted gap-filling prompts if needed",
    "In a separate validation microservice that receives all subagent outputs and flags incomplete reports before they reach the coordinator"
  ],
  correct:2,
  explanation:"The coordinator's agentic loop is the right place: it receives the Task tool result, uses its own reasoning to evaluate completeness against the original request, and decides whether to re-invoke the subagent with specific gap prompts. This is the hub-and-spoke model in action. Option A runs after execution but before the coordinator can reason about the result. Option B relies on the subagent to self-assess, which is unreliable. Option D adds unnecessary infrastructure when the coordinator already has the context to make this judgment."
},
{
  id:10, module:1, scenario:"Customer Support Resolution Agent",
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
  id:11, module:1, scenario:"Multi-Agent Research System",
  text:"Your coordinator's refinement loop sometimes runs 8-10 iterations, with later iterations producing diminishing returns — the subagent keeps finding minor details but the core research is complete after 2-3 rounds. API costs have increased 4x. What's the most practical fix?",
  options:[
    "Use adaptive stopping: analyze each iteration's results and stop when new information drops below a relevance threshold",
    "Remove the refinement loop entirely and accept the first-pass results",
    "Set a hard limit (e.g., max 3 rounds) to control costs and latency, accepting that 2-3 rounds capture the high-value findings",
    "Have the subagent self-report when it has found everything relevant and terminate based on its assessment"
  ],
  correct:2,
  explanation:"A hard limit is the most practical and reliable approach. While adaptive stopping (A) sounds ideal, implementing a reliable 'diminishing returns' detector is complex and error-prone. A fixed limit of 3 rounds captures the high-value findings (as observed in logs) with predictable costs. Option B sacrifices quality unnecessarily. Option D relies on the subagent's self-assessment, which is unreliable — the current problem is precisely that the agent keeps finding things to report."
},
{
  id:12, module:1, scenario:"Customer Support Resolution Agent",
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
  id:13, module:1, scenario:"Multi-Agent Research System",
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
  id:14, module:1, scenario:"Customer Support Resolution Agent",
  text:"Your agent handles a customer who says 'cancel my order.' The <code>lookup_customer</code> tool returns two active accounts matching the customer's name and email — Account A with 1 open order and Account B with 3 open orders. The agent picks Account A (fewer orders, 'simpler') and cancels that order. The customer is furious — they wanted to cancel an order on Account B. What architectural change prevents this?",
  options:[
    "Add logic to always select the account with the most recent activity",
    "Have the agent ask a clarifying question when tool results return multiple matches, requesting additional identifiers to disambiguate",
    "Merge the duplicate accounts in the backend database so this situation can't occur",
    "Add a confirmation step where the agent reads back the selected account details before taking any action"
  ],
  correct:1,
  explanation:"When tool results return multiple matches, the agent should ask for clarification rather than applying heuristics to pick one. Heuristic selection (A) will be wrong in unpredictable cases. Backend deduplication (C) is outside the agent's scope and doesn't solve the general ambiguity problem. Confirmation (D) is better than silent selection but still picks for the customer — asking which account they mean is more direct and reliable."
},
{
  id:15, module:1, scenario:"Customer Support Resolution Agent",
  text:"A customer explicitly says: 'I want to speak to a human agent right now.' Your agent's logs show it responds with: 'I understand your frustration. Let me try to resolve this for you first — what seems to be the issue?' The customer repeats the request twice before finally being escalated. What's the correct design principle being violated?",
  options:[
    "The agent should use sentiment analysis to detect frustration and auto-escalate when sentiment is negative",
    "The agent should honor explicit customer requests for human agents immediately without first attempting investigation or resolution",
    "The agent needs more empathetic language in its responses to make customers feel heard before escalation",
    "The agent should have a maximum-turns threshold that auto-escalates after 3 turns regardless of content"
  ],
  correct:1,
  explanation:"The principle is clear: explicit customer requests for human agents must be honored immediately. The agent should escalate on first request, not attempt to resolve first. Option A uses an unreliable proxy (sentiment) instead of honoring the direct request. Option C focuses on the wrong problem — the customer doesn't want better language, they want a human. Option D is too blunt and would escalate productive conversations unnecessarily."
},
{
  id:16, module:1, scenario:"Multi-Agent Research System",
  text:"Your synthesis subagent needs findings from both the web search and document analysis subagents. Currently the coordinator invokes all three subagents in parallel, but the synthesis agent produces low-quality output because it runs before the other two complete. How should you restructure this?",
  options:[
    "Have all three subagents write to a shared file; the synthesis agent polls until both research files exist",
    "Run web search and document analysis in parallel first, then pass the coordinator's summary of both subagents' findings to the synthesis subagent via the Task tool",
    "Give the synthesis agent direct access to the web search and document analysis tools so it can gather its own data",
    "Chain all three subagents sequentially: web search first, then document analysis, then synthesis"
  ],
  correct:1,
  explanation:"Explicit context passing is the recommended pattern: run the research subagents first (in parallel for speed), then the coordinator summarizes both subagents' findings and passes them to the synthesis subagent via the Task tool. Option A introduces file-system coupling and polling complexity. Option C violates separation of concerns — the synthesis agent should focus on synthesis, not research. Option D is unnecessarily sequential — web search and document analysis are independent and should run in parallel."
},
{
  id:17, module:1, scenario:"Customer Support Resolution Agent",
  text:"Your agent's policy says it can price-match competitors when the product is identical and the competitor's price is verifiable. A customer asks: 'Amazon has this same tent for $50 less, can you match that?' The policy document only covers price-matching against the company's own website promotions, not external competitors. What should the agent do?",
  options:[
    "Match the competitor price to keep the customer happy — the intent of the policy is to retain customers",
    "Refuse the request and cite the exact policy language about own-website promotions only",
    "Escalate to a human agent because the policy is ambiguous or silent on the customer's specific request",
    "Ask the customer to provide a link to the competitor listing so the agent can verify the price before deciding"
  ],
  correct:2,
  explanation:"When policy is ambiguous or silent on a specific request, the agent should escalate rather than guess. Competitor price-matching may have financial implications the agent isn't authorized to decide. Option A makes a potentially unauthorized business decision. Option B is too rigid — the policy doesn't explicitly forbid competitor matching, it just doesn't address it. Option D delays without resolving the underlying authorization question."
},
{
  id:18, module:1, scenario:"Multi-Agent Research System",
  text:"You're designing the <code>AgentDefinition</code> for a data-cleaning subagent in your research pipeline. This agent should only be able to read CSV files and write cleaned output — it should never access the web, delete files, or execute arbitrary commands. How do you configure this?",
  options:[
    "List all dangerous tools in the subagent's system prompt with instructions to never use them",
    "Use the <code>allowedTools</code> configuration to whitelist only <code>Read</code> and <code>Write</code>, and set a focused <code>description</code> explaining the agent cleans CSV data",
    "Use the <code>disallowedTools</code> configuration to blacklist <code>Bash</code>, <code>WebSearch</code>, and <code>WebFetch</code>",
    "Run the subagent in a sandboxed container with restricted filesystem access"
  ],
  correct:1,
  explanation:"allowedTools provides a whitelist — the subagent literally cannot call tools not on the list. Combined with a focused description, the AgentDefinition constrains both the agent's capabilities and its understanding of its role. Option A is prompt-based and can be ignored. Option C uses a blacklist which is risky — you might miss dangerous tools. Option D is infrastructure-level but doesn't restrict which Claude tools the agent calls within the container."
},
{
  id:19, module:1, scenario:"Customer Support Resolution Agent",
  text:"Your agent receives <code>stop_reason: 'max_tokens'</code> while generating a detailed refund explanation to the customer. The response is truncated mid-sentence. What should your orchestration code do?",
  options:[
    "Return the truncated response to the customer with a note that the explanation continues",
    "Discard the response and retry with a shorter system prompt to free up output tokens",
    "Append the truncated assistant message to conversation history and send a continuation request, allowing the model to complete its response",
    "Increase <code>max_tokens</code> to the maximum allowed value and retry the entire request"
  ],
  correct:2,
  explanation:"When stop_reason is 'max_tokens', the output was truncated. The correct pattern is to append the partial assistant message to conversation history and send it back — the model will continue from where it was cut off. Option A gives the customer an incomplete response. Option B loses the work done so far. Option D might help but wastes the partial response and requires a full re-generation."
},
{
  id:20, module:1, scenario:"Multi-Agent Research System",
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
  id:21, module:1, scenario:"Customer Support Resolution Agent",
  text:"You're designing an escalation workflow. When the agent decides a customer issue needs human review, what format best enables reliable handoff to the human agent?",
  options:[
    "Generate a free-text summary of the conversation and pass it to the human agent queue",
    "Transfer the entire conversation transcript to the human agent without any summary",
    "Call <code>escalate_to_human</code> with structured fields: customer ID, issue summary, root cause analysis, attempted resolution steps, and recommended next actions",
    "Store escalation details in a database and send only the ticket reference ID to the human agent"
  ],
  correct:2,
  explanation:"A structured escalation with defined fields ensures consistent handoff quality — the human agent gets actionable context immediately. Option A produces variable-quality summaries. Option B forces the human to read the entire conversation to understand the issue. Option D requires the human to look up context in a separate system, adding friction."
},
{
  id:22, module:1, scenario:"Multi-Agent Research System",
  text:"Your web search subagent needs to refine its queries based on initial results before returning findings. The first search for 'AI chip manufacturing' returns mostly consumer product reviews, and the agent needs to narrow to semiconductor fabrication. How should this refinement work in the agentic loop?",
  options:[
    "Have the coordinator detect low-quality results and re-invoke the subagent with a refined query",
    "Create a pre-defined query expansion chain that runs all variations of the search query sequentially",
    "Let the subagent iterate internally — it sees the initial tool results, evaluates them, decides they're too broad, and calls the search tool again with a refined query like 'semiconductor fabrication AI chips'",
    "Queue all possible search refinements in advance and execute them in parallel"
  ],
  correct:2,
  explanation:"The agentic loop is designed for exactly this: the subagent sees tool results, evaluates quality, and decides whether to call the search tool again with refined queries. Its stop_reason stays 'tool_use' while iterating and becomes 'end_turn' when satisfied. Option A adds unnecessary coordinator round-trips for a task the subagent can handle. Options B and D can't adapt to what the initial results actually contain."
},
{
  id:23, module:1, scenario:"Customer Support Resolution Agent",
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
  id:24, module:1, scenario:"Multi-Agent Research System",
  text:"You're designing a coordinator that needs to handle 5 different types of research tasks. For each type, the coordinator should select from 3 specialized subagents. A junior developer proposes defining all routing logic in the coordinator's system prompt as a detailed decision tree. What's the problem with this approach?",
  options:[
    "System prompts have a strict token limit that can't accommodate a detailed decision tree",
    "Decision trees in prompts are probabilistic guidance that the model may override, and they can't adapt to novel task types not covered in the tree",
    "System prompts are only read once at session start and can't be updated during the conversation",
    "The decision tree would cause the coordinator to always select the same subagent regardless of the actual task"
  ],
  correct:1,
  explanation:"Prompt-based decision trees are 'soft' constraints — the model may deviate based on its reasoning, and rigid trees can't handle tasks that fall between categories or represent novel combinations. Model-driven routing is more flexible: the coordinator reasons about each specific task against available subagents. Option A is incorrect — token limits are generous. Option C is wrong — system prompts are included in every API call. Option D overstates the problem; the model would follow the tree somewhat, just unreliably."
},
{
  id:25, module:1, scenario:"Customer Support Resolution Agent",
  text:"Your agent handles a customer who first asks about a billing discrepancy, then mid-conversation switches to asking about returning a different item. The coordinator needs to handle both issues. What's the most effective approach?",
  options:[
    "Finish the billing issue completely before addressing the return — never context-switch mid-issue",
    "Deploy parallel subagents: a billing specialist subagent and a returns specialist subagent, each receiving relevant context from the coordinator, allowing specialized handling of both issues simultaneously",
    "Tell the customer to open a separate support ticket for the return issue",
    "Handle both issues in a single conversation thread without any subagent delegation"
  ],
  correct:1,
  explanation:"Parallel subagents leverage specialization — each subagent has domain-specific tools and prompts (billing vs. returns) and runs simultaneously, reducing latency. The coordinator merges results and presents a unified response. Option A forces unnecessary sequential processing. Option C is poor customer experience. Option D works but misses the opportunity for specialized handling and parallelism."
},
{
  id:26, module:1, scenario:"Multi-Agent Research System",
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
  id:27, module:1, scenario:"Customer Support Resolution Agent",
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
  id:28, module:1, scenario:"Multi-Agent Research System",
  text:"Your multi-agent system silently fails on 5% of research tasks. Investigation reveals that subagents sometimes return empty results (no matching documents found) which the coordinator treats as successful completions. The synthesis agent then produces reports based on incomplete data without any indication of missing coverage. What's the architectural fix?",
  options:[
    "Have subagents throw exceptions when they find no results, which terminates the workflow and alerts the operator",
    "Add a minimum-result-count threshold — if a subagent returns fewer than 3 results, automatically retry with broader search terms",
    "Require subagents to distinguish between access failures (timeouts, errors) and valid empty results (query succeeded, no matches), using structured error context that the coordinator uses for intelligent recovery decisions",
    "Have the synthesis agent independently verify that it received results from all expected subagents before generating the report"
  ],
  correct:2,
  explanation:"The core issue is that the coordinator can't distinguish 'search failed' from 'search succeeded but found nothing.' Structured error context (failure type, attempted query, partial results) lets the coordinator make intelligent decisions: retry on failures, note coverage gaps on valid empties. Option A is too aggressive — empty results aren't always errors. Option B applies a one-size-fits-all fix that may not be appropriate. Option D catches the symptom but not the root cause."
}
);
