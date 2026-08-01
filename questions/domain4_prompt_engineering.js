// Domain 4: Prompt Engineering & Structured Output (20% of exam = ~12 questions)
// Covers: 4.1 explicit criteria, 4.2 few-shot prompting, 4.3 tool_use/JSON schemas,
// 4.4 validation/retry loops, 4.5 batch processing, 4.6 multi-instance/multi-pass review
// IDs 40-51 (domain 3 ends at 39)
QUESTIONS.push(
// --- 4.1: Explicit criteria to improve precision and reduce false positives ---
{
  id:40, module:4, scenario:"Claude Code for Continuous Integration",
  text:"You want code review feedback to be specific and testable. Instead of 'improve error handling,' what should you specify?",
  options:[
    "\"Flag when exceptions are caught but not logged or re-raised\" with code examples",
    "\"Review error handling quality\"",
    "\"Ensure code is robust against failures\"",
    "\"Check for good error handling practices\""
  ],
  correct:0,
  explanation:"Explicit, testable criteria like 'Flag when exceptions are caught but not logged or re-raised' produce consistent, actionable feedback. Vague instructions like 'review quality' or 'ensure robustness' lead to inconsistent and unhelpful results because the model interprets them differently each time."
},
{
  id:41, module:4, scenario:"Code Generation with Claude Code",
  text:"You're building a code review system and getting too many false positives flagging suspicious patterns that are actually correct. What's the best approach?",
  options:[
    "Increase the confidence threshold to filter lower-confidence findings",
    "Use a veto process where engineers manually approve each finding",
    "Tell Claude Code to reduce false positives in the system prompt",
    "Define specific review criteria for each category and temporarily disable high false-positive categories"
  ],
  correct:3,
  explanation:"Defining specific criteria and temporarily disabling problematic categories addresses false positives at the root cause. Specific criteria reduce ambiguity that causes false flags, while disabling noisy categories preserves developer trust while you refine the prompts."
},
// --- 4.2: Few-shot prompting for output consistency and quality ---
{
  id:42, module:4, scenario:"Structured Data Extraction",
  text:"After implementing tool use with strict schema definitions, syntax errors disappear, but some extractions still have valid JSON with empty strings or null values for required fields even though the source documents contain that information in varied formats. What is the most effective way to address these failures?",
  options:[
    "Add few-shot examples showing extractions from documents with varied structures and how to locate the required information",
    "Build a regex-based post-processing layer that scans source documents for likely patterns",
    "Implement retry logic that re-sends requests when validation detects empty required fields",
    "Modify the schema to make those fields optional and flag incomplete records for manual review"
  ],
  correct:0,
  explanation:"Few-shot examples showing varied input structures teach the model where to find information in different document layouts. The issue isn't schema compliance (tool_use handles that) but the model not recognizing where data appears in unfamiliar formats. Examples bridge that gap."
},
{
  id:43, module:4, scenario:"Structured Data Extraction",
  text:"Your extraction system parses e-commerce product descriptions to extract fields such as dimensions, weight, and materials. The model inconsistently extracts the materials field and sometimes omits it even when the information is present. What is the most effective way to improve consistency?",
  options:[
    "Set temperature to zero for deterministic output",
    "Make the materials field required instead of optional",
    "Add few-shot examples showing complete input-output pairs with standardized material descriptions",
    "Switch to a more capable model tier"
  ],
  correct:2,
  explanation:"Few-shot examples with standardized material descriptions show the model exactly how to extract and format the materials field from varied product descriptions. This addresses the root cause: the model not recognizing diverse material descriptions as extraction targets."
},
// --- 4.3: Enforce structured output using tool_use and JSON schemas ---
{
  id:44, module:4, scenario:"Structured Data Extraction",
  text:"The extraction pipeline receives multiple document types, each with its own extraction tool and schema. With tool_choice set to 'auto', the model sometimes returns conversational text instead of calling a tool. You need guaranteed structured output without knowing the document type in advance. What is the most effective approach?",
  options:[
    "Add a preliminary classification call, then make a second call with tool_choice forced to the identified extraction tool",
    "Set tool_choice to 'any' with all extraction tools defined",
    "Consolidate all document types into a single unified schema extraction tool and force that tool",
    "Keep tool_choice as 'auto' and add system prompt instructions requiring tool use"
  ],
  correct:1,
  explanation:"Setting tool_choice to 'any' forces the model to always call one of the defined tools, guaranteeing structured output. The model selects the most appropriate extraction tool based on the document content. This avoids the extra latency and cost of a preliminary classification call while ensuring a tool is always called."
},
{
  id:45, module:4, scenario:"Structured Data Extraction",
  text:"Your extraction needs to handle receipts where the currency isn't always explicit. Some show '$' (could be USD, CAD, AUD), some show 'EUR', some have no currency symbol at all. Your schema currently has <code>currency</code> as a required enum of ['USD', 'EUR', 'GBP']. What's the best schema improvement?",
  options:[
    "Add all possible currencies to the enum",
    "Change <code>currency</code> to a free-text string so the model can write whatever it sees",
    "Add <code>'unclear'</code> to the enum and make a <code>currency_source</code> field noting where the currency was inferred from (e.g., 'symbol', 'document header', 'not specified')",
    "Remove the currency field entirely and let downstream systems figure it out"
  ],
  correct:2,
  explanation:"Adding 'unclear' to the enum lets the model express uncertainty rather than guessing. The currency_source field provides provenance so downstream systems know whether the currency was explicitly stated or inferred. This follows the 'other/unclear + detail' pattern for handling ambiguity."
},
// --- 4.4: Validation, retry, and feedback loops ---
{
  id:46, module:4, scenario:"Structured Data Extraction",
  text:"Your extraction system retries when validation fails, appending the validation error to the prompt each time. For which failure pattern would additional retries be least effective?",
  options:[
    "The model outputs 'et al.' for co-authors when the full list exists only in an external document not present in the input",
    "The model outputs a nested object where the schema requires a flat array",
    "Model outputs locale-formatted strings where the schema requires integers",
    "The model outputs ISO 8601 datetimes where the schema requires only dates"
  ],
  correct:0,
  explanation:"Retries are ineffective when the required information simply doesn't exist in the provided input. If co-author names are only in an external document not included in the context, no amount of retrying will produce them. The other options are format mismatches that the model can correct with error feedback."
},
{
  id:47, module:4, scenario:"Structured Data Extraction",
  text:"Monitoring shows many extractions fail Pydantic validation with specific errors such as 'expected float for quantity but got a range value like 2 to 3.' Retrying without modification produces identical failures. What is the most effective recovery?",
  options:[
    "Send a follow-up request including the validation error and ask the model to correct its output",
    "Use a larger model tier to reprocess failed documents",
    "Set temperature to zero to ensure consistent formatting",
    "Pre-process source documents to standardize problematic formats before extraction"
  ],
  correct:0,
  explanation:"Sending a follow-up request with the specific validation error gives the model targeted feedback about what went wrong and how to fix it. Retrying without modification repeats the same error, while pre-processing or model changes don't address the model's interpretation of ambiguous values."
},
// --- 4.5: Efficient batch processing strategies ---
{
  id:48, module:4, scenario:"Claude Code for Continuous Integration",
  text:"Your CI pipeline generates thousands of test cases across many PRs. The standard API would be very expensive. Which Claude API feature should you use?",
  options:[
    "Message Batches API for 50% cost savings on non-interactive requests",
    "Cache API to reuse test generation logic",
    "Streaming API to reduce token usage",
    "Clustering API to group similar test requests"
  ],
  correct:0,
  explanation:"The Message Batches API provides 50% cost savings on non-interactive, latency-tolerant requests. CI test generation is a perfect fit since results don't need to be real-time. Caching, streaming, and clustering don't address the core cost issue for high-volume batch workloads."
},
{
  id:49, module:4, scenario:"Structured Data Extraction",
  text:"Your batch processing job for 10,000 documents completes, but 200 documents failed extraction. Each failed result is identified by its <code>custom_id</code>. What's the correct recovery approach?",
  options:[
    "Resubmit the entire batch of 10,000 documents to ensure consistency",
    "Identify the 200 failed documents by their <code>custom_id</code> values, analyze the failure patterns, fix the issues, and resubmit only the failed subset as a new batch",
    "Skip the failed documents and report 98% success rate",
    "Switch the failed documents to synchronous processing for faster turnaround"
  ],
  correct:1,
  explanation:"custom_id fields exist for correlating batch request/response pairs so you can identify failures and resubmit only what failed. Analyze failure patterns first (context limits? unsupported format?) and fix before resubmitting. Resubmitting the entire batch wastes API calls on already-successful extractions."
},
// --- 4.6: Multi-instance and multi-pass review architectures ---
{
  id:50, module:4, scenario:"Claude Code for Continuous Integration",
  text:"Your CI system includes Claude Code's findings in pull request comments. Different team members see duplicate or contradictory comments in the same PR. Why are independent review instances better than self-review?",
  options:[
    "Independent instances require less configuration than a single instance",
    "Independent instances eliminate bias completely",
    "Independent instances run in parallel, completing reviews faster",
    "Independent instances catch issues the other misses; fresh perspective reduces blind spots from retained reasoning context"
  ],
  correct:3,
  explanation:"Independent review instances each evaluate code with a fresh perspective, catching issues that a single reviewer might miss due to its own reasoning blind spots. A model retains its reasoning context from the initial analysis, making it biased toward its own conclusions. A fresh independent instance evaluates findings without that bias."
},
{
  id:51, module:4, scenario:"Claude Code for Continuous Integration",
  text:"Your CI pipeline runs automated code review on every PR. For a codebase with hundreds of files changed, how should you structure Claude Code to avoid overwhelming developers with feedback?",
  options:[
    "Run per-file analysis first, then cross-file integration checks in separate passes",
    "Run multiple independent reviewers and aggregate findings",
    "Analyze all files together in one comprehensive review for consistency",
    "Review only files that changed significantly to reduce noise"
  ],
  correct:0,
  explanation:"Per-file analysis first, then cross-file integration checks, structures the review into manageable passes. This prevents context overload from analyzing hundreds of files at once and produces more focused, accurate feedback at each level."
}
);
