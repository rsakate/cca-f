// Domain 5: Context Management & Reliability (15% of exam — ~9 questions)
// Covers: 5.1 context preservation, 5.2 token optimization,
// 5.3 prompt caching, 5.4 error propagation, 5.5 human review & confidence,
// 5.6 information provenance & uncertainty
// IDs 52–60 (domain 4 ends at 51)
QUESTIONS.push(
{
  id:52, module:5, scenario:"Customer Support Resolution Agent",
  text:"Your agent handles a conversation that spans 25 turns. The customer's first message established they're a Premium Gold member with a $10,000 annual spending history. By turn 20, the agent applies a Standard tier discount instead of the Gold tier discount, costing the customer $50. The <code>/compact</code> summary had condensed 'Premium Gold member' to 'valued customer.' What's the root cause and fix?",
  options:[
    "The model's context window is too small for 25-turn conversations",
    "Progressive summarization risk: /compact condensed critical transactional data (exact tier, spending level) into vague generalizations. The fix is extracting these facts into a persistent [CASE FACTS] block or scratchpad that is re-injected every turn, outside the summarizable conversation",
    "The agent should confirm the customer's tier on every turn",
    "The /compact algorithm has a bug that loses membership information"
  ],
  correct:1,
  explanation:"This is a classic progressive summarization risk: lossy compression turns precise facts into vague labels. 'Premium Gold member, $10K annual spend' becomes 'valued customer,' losing the information needed for correct discount application. The fix is separating critical facts from the conversation stream into a persistent block (CASE FACTS or scratchpad) that survives summarization."
},
{
  id:53, module:5, scenario:"Customer Support Resolution Agent",
  text:"Your agent encounters a long support document (50 pages) that it needs to analyze. The document is loaded into context, but the model consistently misses information from pages 20–35, finding details from the beginning and end but omitting the middle section. What phenomenon is this?",
  options:[
    "The document exceeded the token limit and pages 20–35 were truncated",
    "The 'lost in the middle' effect: models reliably process information at the beginning and end of long inputs but may omit findings from middle sections",
    "The model is rate-limited and skipping portions to save compute",
    "The document formatting is broken in the middle pages"
  ],
  correct:1,
  explanation:"The 'lost in the middle' effect is a known limitation: models reliably process the beginning and end of long inputs but may underweight or miss information from middle sections. Mitigations include: placing key findings summaries at the beginning, using explicit section headers, or splitting long documents into separate processing passes."
},
{
  id:54, module:5, scenario:"Customer Support Resolution Agent",
  text:"Your <code>lookup_order</code> tool returns a 200-field JSON object for every order query, but the agent only uses 5 fields (status, items, total, shipping, tracking) for 95% of interactions. After 8 tool calls, the accumulated tool results consume 60% of the context window, pushing early conversation turns out of the model's effective attention. What pattern fixes this?",
  options:[
    "Increase the context window to accommodate larger tool results",
    "Route every tool result through an <code>optimize(tool_name, raw)</code> function that strips irrelevant fields before the model sees them, reducing each result from 200 fields to the ~5 relevant ones",
    "Ask the model to ignore fields it doesn't need",
    "Modify the backend API to return fewer fields"
  ],
  correct:1,
  explanation:"Tool output optimization trims verbose results to only relevant fields before they enter the context window. A 200-field JSON becomes 5 fields, dramatically reducing token consumption and keeping earlier conversation turns within the model's attention. Option A is expensive and doesn't scale. Option C doesn't reduce token count. Option D requires backend changes outside your control and might break other consumers."
},
{
  id:55, module:5, scenario:"Code Generation with Claude Code",
  text:"Your Claude Code integration sends a long system prompt (2,500 tokens of coding guidelines) plus tool definitions (1,800 tokens) on every API request. The system prompt and tools rarely change, but each request is billed for the full input. After 50 requests in a session, you've paid to process those 4,300 static tokens 50 times. What optimization reduces this cost?",
  options:[
    "Shorten the system prompt by removing less-important guidelines",
    "Place all static content (system prompt, tool definitions) at the beginning of the messages array and mark the last static block with <code>cache_control: { type: 'ephemeral' }</code>. Subsequent requests within the TTL (~5 minutes) pay only a cache-read fee instead of full input processing for those tokens",
    "Send the system prompt only on the first request and omit it from subsequent ones",
    "Move the system prompt into a tool description so it's only processed when the tool is called"
  ],
  correct:1,
  explanation:"Prompt caching with cache_control marks a prefix breakpoint. Static content (system prompt, tool definitions) placed before the breakpoint is cached and reused within the TTL (~5 minutes). Subsequent requests pay a reduced cache-read fee (~0.1x) instead of full input cost for the cached prefix. The key requirement: static content must come first, dynamic content (conversation turns) must come after. Option C breaks coherence — the model needs the system prompt every turn. Option D misunderstands tool definitions."
},
{
  id:56, module:5, scenario:"Multi-Agent Research System",
  text:"Your multi-agent healthcare claims pipeline processes claims through three stages: Intake, Validation, and Adjudication. When the Validation subagent encounters a timeout calling an external eligibility API, it raises a Python exception. The coordinator catches it as a generic <code>Exception</code> and logs 'Validation failed.' Investigation reveals 30% of 'failures' were actually transient timeouts that would succeed on retry. What's the architectural fix?",
  options:[
    "Add automatic retry logic with exponential backoff for all exceptions",
    "Wrap every subagent result in a <code>StageResult(stage, ok, data, error)</code> envelope — subagents never raise exceptions. The coordinator receives structured context (stage, failure type, partial results) and decides whether to log, retry, or escalate",
    "Have subagents handle all retries internally before returning results",
    "Add a global exception handler that retries any failed stage up to 3 times"
  ],
  correct:1,
  explanation:"StageResult envelopes ensure failures are always data, never exceptions. The coordinator receives structured context: which stage failed, why (timeout vs. invalid data), and any partial results. This enables intelligent decisions: retry timeouts, escalate validation errors, continue with partial data. Option A retries indiscriminately. Option C hides retry decisions from the coordinator. Option D doesn't distinguish transient from permanent failures."
},
{
  id:57, module:5, scenario:"Structured Data Extraction",
  text:"After deployment, you find that some extractions contain semantic errors that pass schema validation, and reviewers can check only a subset of outputs. Which approach most effectively allocates reviewer attention?",
  options:[
    "Randomly sample 20 percent of extractions for review",
    "Review all extractions from documents with formatting anomalies",
    "Have the model output field-level confidence scores and calibrate review thresholds using a labeled validation set",
    "Prioritize review of all extractions where required fields are empty or marked not found"
  ],
  correct:2,
  explanation:"Field-level confidence scores let the system prioritize reviewer attention on the extractions most likely to contain errors. Calibrating thresholds against a labeled validation set ensures the confidence scores correlate with actual accuracy, making review allocation data-driven rather than arbitrary or surface-level."
},
{
  id:58, module:5, scenario:"Customer Support Resolution Agent",
  text:"A customer says 'cancel my order' but has two open orders: ORD-5521 (headphones, $89) and ORD-5534 (laptop stand, $149). Your agent picks the cheaper order and cancels it. The customer is furious — they wanted to cancel the laptop stand. What design change prevents this?",
  options:[
    "Always cancel the most recent order when the customer doesn't specify",
    "Always cancel the most expensive order since customers are more likely to want to cancel high-value items",
    "Instruct the agent to ask for clarification when a request is ambiguous: 'I see two open orders — the headphones ($89) and the laptop stand ($149). Which one would you like to cancel?'",
    "Cancel both orders to be safe and let the customer re-order the one they wanted to keep"
  ],
  correct:2,
  explanation:"When a request is under-specified ('cancel my order' with multiple open orders), the agent should ask which order they mean rather than applying a heuristic. Any heuristic (cheapest, newest, most expensive) will be wrong in some cases. Asking takes one extra turn but prevents costly mistakes. Option D is extreme and creates a terrible customer experience."
},
{
  id:59, module:5, scenario:"Multi-Agent Research System",
  text:"Your synthesis agent combines findings from three research subagents. The web search agent reports 'revenue grew 15% in 2023,' while the document analysis agent reports 'revenue grew 12% in 2023' from a different source. The current synthesis just picks one number. What's the correct approach?",
  options:[
    "Always use the number from the most recent source",
    "Average the two numbers and report 13.5% growth",
    "Annotate the conflict with source attribution: 'Revenue grew 15% according to [Source A, Q3 press release] vs. 12% per [Source B, annual report]. The discrepancy may reflect different measurement periods or definitions.'",
    "Omit the revenue growth figure entirely since it's contested"
  ],
  correct:2,
  explanation:"When credible sources conflict, the synthesis should annotate the conflict with source attribution rather than arbitrarily selecting one value. This preserves provenance and lets the reader understand the discrepancy. Option A applies an arbitrary heuristic. Option B creates a number that no source actually reported. Option D loses potentially important information."
},
{
  id:60, module:5, scenario:"Multi-Agent Research System",
  text:"Your synthesis agent produces a report on renewable energy but some sections are marked 'insufficient data — the wind energy subagent timed out before completing research on offshore installations.' A reviewer complains that these gaps aren't clearly indicated in the report summary. What output structure helps?",
  options:[
    "Remove sections with incomplete data from the report entirely",
    "Add coverage annotations to the synthesis output indicating which findings are well-supported versus which topic areas have gaps due to unavailable sources or subagent failures",
    "Retry the failed subagent until it succeeds and only then generate the report",
    "Lower quality standards so partial data is acceptable"
  ],
  correct:1,
  explanation:"Coverage annotations explicitly mark which sections are well-supported and which have gaps. Rather than hiding incomplete coverage (A) or blocking on retries (C), the report transparently communicates what it knows well and where gaps exist. This lets the reader make informed decisions about which findings to trust."
}
);
