// Domain 5: Context Management & Reliability (15% of exam)
// 28 questions covering: context preservation, token optimization,
// prompt caching, error handling, testing/evaluation
QUESTIONS.push(
{
  id:109, module:5, scenario:"Customer Support Resolution Agent",
  text:"Your customer support agent handles multi-turn sessions averaging 18 exchanges. After turn 12, you notice the agent starts addressing customers by the wrong name and forgetting their loyalty tier, even though this was established in turn 2. The <code>/compact</code> summary condensed 'Premium customer Sarah Chen, Loyalty Tier Gold, active order ORD-7823' into 'returning customer with order.' What's the fix?",
  options:[
    "Increase the context window size to avoid compaction",
    "Extract transactional facts (customer name, loyalty tier, active order IDs) into a persistent <code>[CASE FACTS]</code> block that's re-injected into the system prompt every turn, surviving summarization",
    "Run <code>/compact</code> less frequently to preserve more conversation history",
    "Tell the agent to memorize customer details in its first response"
  ],
  correct:1,
  explanation:"A [CASE FACTS] block extracts critical information into a structured section that persists outside the summarizable conversation history. It's re-injected into every prompt, so the agent never loses the customer's identity, tier, or active orders — even after compaction. Option A delays but doesn't prevent the problem. Option C means worse compaction quality when it does happen. Option D is unreliable — the model doesn't have persistent memory."
},
{
  id:110, module:5, scenario:"Customer Support Resolution Agent",
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
  id:111, module:5, scenario:"Customer Support Resolution Agent",
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
  id:112, module:5, scenario:"Multi-Agent Research System",
  text:"Your multi-agent healthcare claims pipeline processes claims through three stages: Intake → Validation → Adjudication. When the Validation subagent encounters a timeout calling an external eligibility API, it raises a Python exception. The coordinator catches it as a generic <code>Exception</code> and logs 'Validation failed.' Investigation reveals 30% of 'failures' were actually transient timeouts that would succeed on retry. What's the architectural fix?",
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
  id:113, module:5, scenario:"Multi-Agent Research System",
  text:"Your claims processing pipeline runs nightly batches of 5,000 claims. Midway through processing (claim #2,847), the process crashes due to a memory error. When restarted, it begins processing from claim #1 again, duplicating work on 2,846 already-processed claims and double-billing some. What's the fix?",
  options:[
    "Increase the server's memory to prevent crashes",
    "Use a disk-backed scratchpad that records each claim's processing status. On restart, the coordinator reads the scratchpad and skips claims already marked as 'done' or 'failed,' resuming from the first unprocessed claim",
    "Process claims in smaller batches of 100 to reduce crash impact",
    "Add a database transaction wrapper around the entire batch so it either all succeeds or all rolls back"
  ],
  correct:1,
  explanation:"A disk-backed scratchpad (scratchpad.json) persists each claim's status to disk as it's processed. On crash recovery, the coordinator reads the scratchpad, skips claims marked 'done' or 'failed,' and resumes from claim #2,847. This prevents re-processing and double-billing. Option A prevents one crash but not all. Option C reduces impact but doesn't prevent re-processing. Option D is impractical for 5,000 independent claims."
},
{
  id:114, module:5, scenario:"Customer Support Resolution Agent",
  text:"Your agent has been running for 45 minutes with heavy tool usage. You notice responses are becoming less precise — the model references 'the previous order' instead of specific order numbers, and starts giving generic advice instead of account-specific guidance. What's happening and what should you do?",
  options:[
    "The model is experiencing 'fatigue' — restart the session entirely",
    "Context degradation: the context window is filling up, pushing important early context out of the model's effective attention. Run <code>/compact</code> proactively with a targeted prompt to preserve critical facts, or write key findings to a scratchpad file before compacting",
    "The API is throttling your requests, causing lower-quality responses",
    "Switch to a larger model that can handle longer contexts"
  ],
  correct:1,
  explanation:"Context degradation occurs in extended sessions: as the context fills with tool results and conversation turns, the model starts referencing 'typical patterns' rather than specific earlier findings. Proactive /compact at ~60% capacity or after milestones preserves context quality. Writing critical facts to a scratchpad file ensures they survive compaction. Option A loses all context. Option C isn't a real behavior. Option D delays but doesn't prevent the problem."
},
{
  id:115, module:5, scenario:"Multi-Agent Research System",
  text:"Your research system's coordinator spawns a subagent to investigate a complex codebase. The subagent produces 4,000 tokens of verbose discovery output (file listings, code snippets, dependency traces). If this output returns directly to the coordinator, it consumes a large portion of the coordinator's context. What's the solution?",
  options:[
    "Limit the subagent's output length with a max_tokens constraint",
    "Use the Explore subagent type, which isolates verbose discovery output in a separate context and returns only a concise summary to the main coordinator, preserving the coordinator's context budget",
    "Have the coordinator filter the subagent's output using regex to remove noise",
    "Split the investigation across multiple smaller subagent calls"
  ],
  correct:1,
  explanation:"Subagent delegation isolates verbose output. The Explore subagent does extensive investigation (reading files, tracing dependencies) in its own context window, then returns only a concise summary of key findings to the coordinator. This preserves the coordinator's context for high-level coordination. Option A might truncate important findings. Option C is brittle. Option D adds coordination overhead without solving the context problem."
},
{
  id:116, module:5, scenario:"Customer Support Resolution Agent",
  text:"Your agent needs to maintain critical customer information across a <code>/compact</code> operation. You write key findings to a scratchpad file (<code>case_notes.md</code>) before running /compact. Why is this more reliable than trusting /compact to preserve the information?",
  options:[
    "Scratchpad files are encrypted while /compact summaries are not",
    "Scratchpad files persist on disk and can be re-read after compaction, surviving context compression, session crashes, and --resume/--continue recovery. /compact summarization is lossy — it may condense specific details into vague generalizations",
    "/compact doesn't work correctly and always loses information",
    "Scratchpad files are automatically included in every API call"
  ],
  correct:1,
  explanation:"Scratchpad files persist on disk independently of the conversation context. After /compact compresses the conversation (potentially losing specific details like exact amounts, dates, and customer IDs), the scratchpad file can be re-read to recover those details. The file also survives session crashes and --resume recovery. /compact works but is inherently lossy on specifics."
},
{
  id:117, module:5, scenario:"Multi-Agent Research System",
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
  id:118, module:5, scenario:"Customer Support Resolution Agent",
  text:"Your agent processes a complex return involving a product that was damaged during shipping. The customer provides photos, order details, and a description of the damage. The agent's response includes: 'Based on the available information, a refund may be appropriate.' Your quality team flags this as insufficient. What's missing?",
  options:[
    "The agent should process the refund automatically without hedging language",
    "The response should include information provenance: cite the specific evidence (order #, damage description, photo reference) that supports the refund decision, so a reviewer can verify the basis for the action",
    "The agent should ask more clarifying questions before making a recommendation",
    "The response should include a confidence score"
  ],
  correct:1,
  explanation:"Information provenance — citing the specific evidence that supports each claim — enables verification. Instead of vague 'available information,' the response should say: 'Based on order ORD-7823, the customer's description of a cracked screen, and the attached photo showing impact damage, a full refund of $149 is recommended per policy 4.2.' This makes the decision auditable."
},
{
  id:119, module:5, scenario:"Multi-Agent Research System",
  text:"Your research subagents return findings that include statistical data. The web search agent finds 'AI market size: $200B (2024)' and the document agent finds 'AI market size: $150B.' The synthesis agent reports both as current figures, creating a misleading comparison. What data should subagents include in their outputs?",
  options:[
    "Only the most recent data point to avoid confusion",
    "All data points with publication dates or data collection dates, so the synthesis agent can correctly interpret temporal differences rather than treating all figures as concurrent",
    "Data points with confidence scores so the synthesis agent can pick the most reliable one",
    "Only data points from peer-reviewed sources"
  ],
  correct:1,
  explanation:"Temporal data requires publication/collection dates. The $200B and $150B figures likely come from different years or use different market definitions. Without dates, the synthesis agent can't tell if these are conflicting or complementary (e.g., 2024 vs. 2022 projections). Requiring subagents to include dates enables correct temporal interpretation."
},
{
  id:120, module:5, scenario:"Customer Support Resolution Agent",
  text:"You're at approximately 60% context capacity during a long debugging session. You've identified the root cause and have a plan for the fix. Should you run <code>/compact</code> now?",
  options:[
    "No — wait until you hit the context limit, when auto-compaction kicks in",
    "Yes — proactively compact at ~60% capacity or after completing a significant milestone (like identifying the root cause). This produces higher-quality summaries than emergency compaction at 95%",
    "No — /compact should only be run between sessions, not during active work",
    "Yes — but only with the default prompt, never with a custom prompt"
  ],
  correct:1,
  explanation:"Proactive compaction at ~60% capacity or after milestones produces higher-quality summaries because the model has room to work. Waiting until 95% forces emergency compaction under pressure, which often produces lower-quality summaries that lose important details. You can also pass a custom prompt to /compact to specify what to preserve: '/compact Preserve the root cause analysis and planned fix steps.'"
},
{
  id:121, module:5, scenario:"Multi-Agent Research System",
  text:"Your coordinator needs to summarize key findings from a Phase 1 exploration before spawning Phase 2 subagents. Currently, it passes the raw Phase 1 output (3,000 tokens) to each Phase 2 subagent. With 4 subagents, that's 12,000 tokens of context duplication. What's the optimization?",
  options:[
    "Skip passing Phase 1 context and let Phase 2 subagents re-discover the findings independently",
    "Summarize Phase 1 findings into a concise briefing (~500 tokens) and inject this summary into each Phase 2 subagent's initial context, reducing duplication from 12,000 to 2,000 tokens while preserving essential context",
    "Store Phase 1 results on disk and have Phase 2 subagents read the file",
    "Pass Phase 1 context only to the first Phase 2 subagent and have it share findings with others"
  ],
  correct:1,
  explanation:"Summarizing Phase 1 into a concise briefing preserves essential context while dramatically reducing token usage across multiple subagents. The coordinator (which understands the full context) produces the best summary. Option A wastes resources on re-discovery. Option C adds file I/O complexity. Option D creates sequential dependencies between parallel subagents."
},
{
  id:122, module:5, scenario:"Customer Support Resolution Agent",
  text:"Your agent encounters a long support document (50 pages) that it needs to analyze. The document is loaded into context, but the model consistently misses information from pages 20-35, finding details from the beginning and end but omitting the middle section. What phenomenon is this?",
  options:[
    "The document exceeded the token limit and pages 20-35 were truncated",
    "The 'lost in the middle' effect: models reliably process information at the beginning and end of long inputs but may omit findings from middle sections",
    "The model is rate-limited and skipping portions to save compute",
    "The document formatting is broken in the middle pages"
  ],
  correct:1,
  explanation:"The 'lost in the middle' effect is a known limitation: models reliably process the beginning and end of long inputs but may underweight or miss information from middle sections. Mitigations include: placing key findings summaries at the beginning, using explicit section headers, or splitting long documents into separate processing passes."
},
{
  id:123, module:5, scenario:"Multi-Agent Research System",
  text:"Your synthesis agent produces a research report that combines findings from 5 subagents. A reviewer notices that several claims in the report have no clear source — it's impossible to tell which subagent provided which finding. What output structure should you require from subagents?",
  options:[
    "Require subagents to tag their findings with their agent name",
    "Require subagents to output structured claim-source mappings: each finding includes the source URL/document name, relevant excerpt, and collection date — which the synthesis agent preserves through the final report",
    "Have the synthesis agent add generic citations like '[Source 1]' to all claims",
    "Require subagents to put all findings in a bulleted list format"
  ],
  correct:1,
  explanation:"Structured claim-source mappings ensure provenance is preserved through synthesis. Each subagent output includes: what was found, where it came from (URL, document name), the relevant excerpt, and when the data was collected. The synthesis agent preserves these mappings in the final report, making every claim traceable. Option A identifies the agent but not the original source. Options C and D provide format but not provenance."
},
{
  id:124, module:5, scenario:"Customer Support Resolution Agent",
  text:"Your compliance reviewer for financial reports needs to flag potential issues with specific citations from the source document. The current system flags issues but doesn't cite where in the report the issue appears. An auditor complains: 'How do I verify this finding?' What provenance structure should each finding include?",
  options:[
    "A summary of the issue and a recommendation",
    "The exact line reference, the quoted text from the source document (attached locally, never copied by the model), and the compliance rule it potentially violates — so an auditor can verify each flag in seconds and the citation can't be hallucinated",
    "A confidence score from 0-1 indicating how sure the model is about the finding",
    "A screenshot of the relevant section of the document"
  ],
  correct:1,
  explanation:"Tamper-proof provenance requires: (1) exact line reference, (2) quoted text from the source (attached from the local document, not generated by the model), and (3) the specific rule violated. This lets an auditor verify each finding in seconds by checking the quoted text against the actual document. If the citation is pulled locally rather than generated, it can't be hallucinated."
},
{
  id:125, module:5, scenario:"Multi-Agent Research System",
  text:"Your compliance reviewer runs two independent review passes on the same financial report. Pass A flags lines 15, 23, and 47. Pass B flags lines 23, 47, and 62. How should the system use these results?",
  options:[
    "Only report findings that both passes agree on (lines 23 and 47) and discard the rest",
    "Report all findings from both passes without distinction",
    "Lines flagged by both passes (23, 47) are 'confirmed' findings that can proceed automatically. Lines flagged by only one pass (15, 62) are 'contested' and should be surfaced for human judgment — the 'four-eyes' dual-review control",
    "Average the findings and report only the most severe"
  ],
  correct:2,
  explanation:"Dual-pass review enables a 'four-eyes' control: findings confirmed by both passes have high reliability and can proceed automatically or with minimal review. Findings flagged by only one pass are contested — they may be valid or false positives — and need human judgment. Option A discards potentially valid findings. Option B doesn't leverage the agreement signal. Option D doesn't apply to categorical findings."
},
{
  id:126, module:5, scenario:"Customer Support Resolution Agent",
  text:"Your confidence calibration system gives each AI compliance finding a score from 0 to 1. Findings above 0.8 are auto-cleared, findings below 0.4 go to human review, and 0.4-0.8 are triaged. After deployment, you discover that 15% of auto-cleared findings (>0.8 confidence) contain errors. What validation step was missed?",
  options:[
    "The confidence threshold should be raised to 0.95",
    "Before automating any confidence range, implement stratified random sampling of high-confidence extractions to measure actual error rates and detect novel error patterns that the confidence score doesn't capture",
    "Confidence scores should be generated by a separate model",
    "All findings should go through human review regardless of confidence"
  ],
  correct:1,
  explanation:"Confidence scores need calibration against actual accuracy. Stratified random sampling of high-confidence extractions reveals whether the model's 0.8+ confidence actually corresponds to high accuracy. The 15% error rate shows the confidence is miscalibrated — the model is incorrectly confident on some types of findings. This ongoing sampling also detects novel error patterns. Option A shifts the threshold without validating it. Option D defeats the purpose of automation."
},
{
  id:127, module:5, scenario:"Multi-Agent Research System",
  text:"Your agent synthesizes findings from multiple research subagents into a final report. The report presents financial data in paragraph form: 'The company's revenue was $50M, up from $42M the previous year, with operating margins of 12%.' A stakeholder asks why the data isn't in a table. What rendering principle should your synthesis follow?",
  options:[
    "Always use tables for all data to maintain consistency",
    "Always use prose for readability",
    "Render different content types appropriately: financial data as tables, news as prose, technical findings as structured lists — rather than converting everything to a uniform format",
    "Let the stakeholder choose their preferred format through a configuration option"
  ],
  correct:2,
  explanation:"Content-type-appropriate rendering improves comprehension: financial data is best in tables (easy to compare figures), news is best in prose (narrative context matters), and technical findings work well as structured lists (scannable, hierarchical). Forcing everything into one format loses the advantages of each. This should be instructed in the synthesis agent's prompt."
},
{
  id:128, module:5, scenario:"Customer Support Resolution Agent",
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
  id:129, module:5, scenario:"Multi-Agent Research System",
  text:"Your synthesis agent needs to combine findings about a company from 3 subagents. Subagent A reports market cap of $5B (from a Q1 press release). Subagent B reports market cap of $4.2B (from the annual report). Neither includes the publication date of their source. The synthesis reports them as conflicting findings. What metadata requirement would prevent this?",
  options:[
    "Require subagents to include reliability scores for each finding",
    "Require subagents to include publication or data collection dates in their structured outputs, so the synthesis agent can determine whether differences are contradictions or temporal changes",
    "Require subagents to agree on a single value before reporting",
    "Require subagents to cite only the most recent source"
  ],
  correct:1,
  explanation:"Without dates, the synthesis agent can't distinguish contradictions from temporal changes. The $5B (Q1 press release, March 2024) vs $4.2B (annual report, December 2023) is likely showing growth over time, not conflicting data. Requiring publication/collection dates in subagent outputs enables correct temporal interpretation."
},
{
  id:130, module:5, scenario:"Customer Support Resolution Agent",
  text:"Your agent needs to handle a customer's issue that involves a policy the agent has never seen before — the customer cites a recent promotion that isn't in the agent's training data or knowledge base. The agent confidently makes up a response about the promotion's terms. What architectural principle prevents this?",
  options:[
    "Update the agent's training data with all current promotions",
    "The agent should escalate when it encounters information gaps rather than generating plausible-sounding but potentially incorrect responses — inability to make meaningful progress is a legitimate escalation trigger",
    "Add a disclaimer to all agent responses: 'This information may not be accurate'",
    "Have the agent search the internet for the promotion details"
  ],
  correct:1,
  explanation:"When the agent encounters information it doesn't have (a promotion not in its knowledge base), it should escalate rather than confabulate. Three legitimate escalation triggers: (1) customer explicitly requests human, (2) policy gap or ambiguity, (3) inability to make meaningful progress. Confidently fabricating promotion terms creates liability and destroys trust. Option A isn't feasible in real-time. Option C undermines all agent responses."
},
{
  id:131, module:5, scenario:"Multi-Agent Research System",
  text:"Your synthesis agent produces a report on renewable energy but some sections are marked 'insufficient data — the wind energy subagent timed out before completing research on offshore installations.' A reviewer complains that these gaps aren't clearly indicated in the report summary. What output structure helps?",
  options:[
    "Remove sections with incomplete data from the report entirely",
    "Add coverage annotations to the synthesis output indicating which findings are well-supported versus which topic areas have gaps due to unavailable sources or subagent failures",
    "Retry the failed subagent until it succeeds and only then generate the report",
    "Lower quality standards so partial data is acceptable"
  ],
  correct:1,
  explanation:"Coverage annotations explicitly mark which sections are well-supported and which have gaps. Rather than hiding incomplete coverage (A) or blocking on retries (C), the report transparently communicates what it knows well and where gaps exist. This lets the reader make informed decisions about which findings to trust."
},
{
  id:132, module:5, scenario:"Customer Support Resolution Agent",
  text:"Your agent passes complete conversation history in every API request to maintain coherence. With 20 turns of conversation plus tool results, the input now exceeds 80% of the context window, leaving little room for the model's response. What's the mitigation?",
  options:[
    "Truncate old messages from the conversation history, keeping only the last 5 turns",
    "Pass complete conversation history to maintain coherence, but use tool output optimization to compress verbose tool results, and run /compact at ~60% capacity to proactively manage context. Place critical facts in a persistent block that survives compaction",
    "Stop passing conversation history and treat each turn as independent",
    "Increase the API's max_tokens parameter to accommodate the large context"
  ],
  correct:1,
  explanation:"The comprehensive approach: (1) keep complete history for coherence, (2) optimize tool outputs to reduce bloat, (3) proactively compact at 60% before emergency compression, (4) use persistent fact blocks for critical information. Option A breaks conversation coherence. Option C makes every turn stateless. Option D controls output length, not input context."
},
{
  id:133, module:5, scenario:"Multi-Agent Research System",
  text:"You're running an extended codebase exploration with Claude Code. After 30 minutes of intensive investigation (reading dozens of files, tracing dependencies), you notice the model's responses start referencing 'typical patterns' and 'common approaches' instead of the specific classes and methods it discovered earlier. What should you do?",
  options:[
    "Start a new session and re-do the investigation from scratch",
    "Write key findings (specific class names, dependency paths, architectural decisions) to a scratchpad file, then run <code>/compact</code> with a targeted prompt to preserve the investigation structure. Re-read the scratchpad after compaction to restore specific details",
    "Continue working — the model's general references are just as useful as specific ones",
    "Switch to a model with a larger context window"
  ],
  correct:1,
  explanation:"Context degradation is happening — the window is full of exploration output. Writing findings to a scratchpad before compaction ensures specific details (class names, method signatures, dependency paths) survive. The scratchpad persists on disk and can be re-read after /compact compresses the conversation. Running /compact with a targeted prompt ('preserve the architecture analysis') produces a better summary. Option A loses all accumulated context."
},
{
  id:134, module:5, scenario:"Customer Support Resolution Agent",
  text:"Your compliance review system uses self-reported confidence scores from the AI model (0-1). The model reports 0.9 confidence on a finding about a financial irregularity. A human auditor investigates and determines it's a false positive. This happens repeatedly — the model is overconfident on certain types of findings. Why are self-reported confidence scores unreliable here?",
  options:[
    "The model's confidence scores are based on temperature settings, not actual accuracy",
    "Sentiment-based and self-reported confidence scores are unreliable proxies for actual case complexity — the model may be incorrectly confident on hard cases because it doesn't know what it doesn't know",
    "Confidence scores are only accurate for classification tasks, not review tasks",
    "The model generates random confidence scores to fill the required field"
  ],
  correct:1,
  explanation:"Self-reported confidence scores are poorly calibrated: the model may assign high confidence based on surface-level pattern matching while missing deeper issues, or be overconfident on novel cases it hasn't been trained to handle well. Confidence doesn't correlate reliably with actual accuracy. This is why calibration using labeled validation sets (comparing stated confidence to actual accuracy) is essential before relying on confidence for automation decisions."
},
{
  id:135, module:5, scenario:"Multi-Agent Research System",
  text:"Your large codebase exploration agent needs to persist findings across context boundaries. After using <code>/compact</code>, the agent needs to continue investigation using the findings from before compaction. What's the most reliable persistence pattern?",
  options:[
    "Trust /compact to preserve all important findings in its summary",
    "Use a scratchpad file on disk — write key findings to <code>scratchpad.json</code> as you go. The file persists across /compact operations, session crashes, and --resume/--continue recovery. Read the scratchpad at the start of each new phase to restore context",
    "Store findings in the system prompt which persists across all turns",
    "Use environment variables to pass findings between compaction cycles"
  ],
  correct:1,
  explanation:"Scratchpad files are the most reliable persistence mechanism. They persist on disk, surviving /compact (which compresses conversation context), session crashes, and --resume recovery. The pattern: write findings progressively to scratchpad.json, read it back after compaction or restart. The system prompt (C) can't be dynamically updated with findings. Environment variables (D) don't persist across sessions."
},
{
  id:136, module:5, scenario:"Customer Support Resolution Agent",
  text:"Your support agent handles a customer complaint about a delayed shipment. During the conversation, the tool <code>check_shipping_status</code> returns a large tracking history with 47 status updates. The model includes all 47 updates in its response to the customer. What's wrong and what's the fix?",
  options:[
    "The model should be instructed to summarize — add 'be concise' to the system prompt",
    "Place key findings summaries at the beginning of tool results and organize detailed results with explicit section headers, so the model naturally focuses on the summary while having access to details if needed. Also consider trimming to only the most recent 5 status updates in the tool output optimization layer",
    "Remove the tracking history from the tool response entirely",
    "Return tracking data as a URL link instead of inline data"
  ],
  correct:1,
  explanation:"Two complementary fixes: (1) restructure tool output with a summary at the top ('Latest: Package in transit, ETA March 15') followed by organized detail sections, mitigating the 'lost in the middle' effect, and (2) use tool output optimization to trim to relevant recent updates. This gives the model a clear summary to present while preserving detail access. Option A is vague. Option C loses useful information."
}
);
