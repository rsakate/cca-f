// Domain 4: Prompt Engineering & Structured Output (20% of exam)
// 24 questions covering: explicit criteria, few-shot prompting, tool use/JSON schemas,
// validation/retry loops, batch processing, multi-pass review
QUESTIONS.push(
{
  id:85, module:4, scenario:"Structured Data Extraction",
  text:"Your extraction pipeline processes invoices from 50 different vendors. Some invoices don't include a purchase order number. Your schema defines <code>po_number</code> as a required string field. In 8% of extractions, the model fabricates plausible-looking PO numbers to satisfy the required field constraint. What schema change prevents this?",
  options:[
    "Add 'Do not fabricate PO numbers' to the system prompt",
    "Make <code>po_number</code> an optional (nullable) field so the model can return <code>null</code> when the information isn't present in the source document, removing the incentive to hallucinate",
    "Add a regex pattern constraint for PO number format",
    "Post-process extractions to verify PO numbers against a database"
  ],
  correct:1,
  explanation:"When a field is required but the source document lacks the information, the model is forced to fabricate a value to satisfy the schema. Making the field nullable (optional) gives the model a legitimate way to express 'this information is not in the document' without hallucinating. Option A is probabilistic guidance. Option C validates format but not existence. Option D is reactive, not preventive."
},
{
  id:86, module:4, scenario:"Structured Data Extraction",
  text:"Your document classification tool has categories: 'invoice', 'receipt', 'contract', 'report'. You start receiving government regulatory filings that don't fit any category. The model forces them into 'report' (closest match) with low accuracy. What schema design handles this?",
  options:[
    "Add every possible document type to the enum as you encounter them",
    "Replace the enum with a free-text string field so the model can write any category",
    "Add an <code>'other'</code> value to the enum plus a <code>detail</code> string field where the model describes the actual document type when selecting 'other'",
    "Create a separate 'unknown documents' pipeline that skips classification entirely"
  ],
  correct:2,
  explanation:"The enum 'other' + detail pattern provides extensibility without sacrificing structure. The model selects 'other' for novel document types and describes them in the detail field, giving you structured classification for known types and rich metadata for unknown ones. Option A requires constant schema updates. Option B loses structured classification entirely. Option D skips useful classification."
},
{
  id:87, module:4, scenario:"Content Moderation System",
  text:"You're building a content moderation classifier with three categories: REMOVE, REVIEW, ALLOW. Your initial prompt says: 'Classify this content as appropriate or inappropriate.' Testing shows wildly inconsistent results — similar content gets different classifications across runs. What's the first improvement?",
  options:[
    "Increase the number of classification categories to capture more nuance",
    "Replace the vague prompt with explicit, testable criteria: 'REMOVE = contains direct threats OR illegal content; REVIEW = ambiguous but flagged by 2+ heuristics; ALLOW = everything else'",
    "Add a confidence score requirement and only accept high-confidence classifications",
    "Run each classification 3 times and use majority voting"
  ],
  correct:1,
  explanation:"Explicit, testable criteria produce consistent results because the model has clear decision boundaries. 'Appropriate' vs. 'inappropriate' is subjective and undefined — every model invocation interprets it differently. Concrete criteria ('direct threats OR illegal content') give the model an objective test to apply. Options C and D add complexity without fixing the root cause of inconsistency."
},
{
  id:88, module:4, scenario:"Content Moderation System",
  text:"After defining explicit criteria, your classifier handles clear cases well but produces inconsistent results on edge cases — a sarcastic joke about violence gets REMOVE 60% of the time and REVIEW 40%. What should you add?",
  options:[
    "More detailed written criteria with longer descriptions of each category",
    "A confidence threshold that routes low-confidence classifications to human review",
    "3-5 few-shot examples in <code>&lt;example&gt;</code> tags showing correct classification of similar edge cases, with reasoning for why each was classified that way",
    "A second classification pass that cross-checks the first"
  ],
  correct:2,
  explanation:"Few-shot examples are the second layer of precision prompting. They show the model how to apply criteria to ambiguous cases: 'This sarcastic violence joke → REVIEW because it's not a direct threat but could be misinterpreted.' 3-5 examples establish the pattern without overwhelming context. Option A doesn't help with ambiguity. Options B and D add infrastructure without fixing the classification logic."
},
{
  id:89, module:4, scenario:"Content Moderation System",
  text:"Your few-shot examples work well for content similar to the examples, but the model struggles with novel content types — memes, coded language, context-dependent references. Adding more examples for every possible type isn't scalable. What's the third layer to add?",
  options:[
    "A machine learning classifier trained on labeled data to handle novel content",
    "More examples covering every possible content variation",
    "Generalization principles that explain the reasoning behind the examples: 'The goal is to prevent genuine harm while preserving legitimate expression. Context matters: identical words can be threatening in a DM but harmless in a comedy review.'",
    "A keyword blocklist for common harmful terms"
  ],
  correct:2,
  explanation:"Generalization principles explain WHY the examples are classified the way they are, enabling the model to extrapolate reasoning to novel cases. This is more scalable than trying to cover every variation with examples. The model learns the underlying logic ('prevent genuine harm while preserving legitimate expression') rather than just matching patterns."
},
{
  id:90, module:4, scenario:"Structured Data Extraction",
  text:"You need Claude to extract structured data from invoices and return it as a predictable JSON object every time. During testing with a text-based prompt ('Please return the data as JSON'), 20% of responses have formatting issues — missing commas, extra text before the JSON, or slightly different field names. What's the most reliable approach?",
  options:[
    "Add stricter JSON formatting instructions and examples in the prompt",
    "Use regex to extract JSON from the model's text response",
    "Use <code>tool_use</code> with a JSON schema defining the exact extraction fields — the model fills in the schema parameters, guaranteeing valid, structured output",
    "Use a JSON repair library to fix malformed responses"
  ],
  correct:2,
  explanation:"tool_use with JSON schema is the most reliable approach for guaranteed structured output. The model must fill in the defined fields with correct types — there's no possibility of formatting issues, extra text, or missing fields. Options A, B, and D all try to work around unreliable text output instead of using the tool that guarantees structure."
},
{
  id:91, module:4, scenario:"Structured Data Extraction",
  text:"Your invoice extraction tool uses a JSON schema that defines <code>total_amount</code> as a number. The tool consistently returns syntactically valid JSON, but 5% of extractions have semantic errors: the line items don't sum to the total, or the tax calculation is wrong. How should you handle this?",
  options:[
    "Add validation instructions in the system prompt: 'Make sure line items sum to the total'",
    "Accept that tool_use schemas eliminate all errors since the JSON is always valid",
    "Add a semantic validator in your tool handler that checks business rules (line items sum to total, tax calculation) that the JSON schema can't express, and return validation errors as <code>tool_result</code> with <code>is_error: true</code>",
    "Switch to a larger model that makes fewer calculation errors"
  ],
  correct:2,
  explanation:"JSON schemas via tool_use eliminate syntax errors but NOT semantic errors. Values can be in the wrong fields, calculations can be incorrect, and cross-field constraints can be violated. A semantic validator checks these business rules and returns errors as tool_result with is_error: true, enabling the model to self-correct. Option A is probabilistic. Option B is a dangerous misconception."
},
{
  id:92, module:4, scenario:"Structured Data Extraction",
  text:"Your extraction pipeline fails on a medical invoice. The retry loop sends the failed extraction back with the error: 'Missing patient_id field.' After 3 retries, it still can't extract a patient_id. Investigation reveals the invoice genuinely doesn't contain a patient ID — it's a pre-registration document. What should you change?",
  options:[
    "Increase the retry limit to 5 to give the model more attempts",
    "Add logic to identify when retries are ineffective: if the information is absent from the source document (not a format or structural error), stop retrying and report the field as not found rather than repeatedly asking for something that doesn't exist",
    "Make the model hallucinate a placeholder patient_id to satisfy the schema",
    "Skip all medical invoices and route them to manual processing"
  ],
  correct:1,
  explanation:"Retries are effective for format mismatches and structural errors (the model extracted from the wrong section). They are ineffective when the information simply doesn't exist in the source document. Your pipeline needs to distinguish these cases: retry on extraction errors, report 'not found' when the field is genuinely absent. Option A just wastes more API calls. Option C produces invalid data. Option D is overly broad."
},
{
  id:93, module:4, scenario:"Structured Data Extraction",
  text:"Your extraction pipeline processes financial documents. You want to catch data inconsistencies automatically. An invoice states 'Total: $1,250' but the extracted line items sum to $1,150. How should you design the extraction schema to surface this?",
  options:[
    "Only extract the stated total and trust it",
    "Only extract line items and calculate the total yourself, ignoring what the document states",
    "Extract both <code>stated_total</code> and <code>calculated_total</code> (sum of line items), plus a <code>conflict_detected</code> boolean that flags when they disagree",
    "Add a validation step that rejects any document where the total doesn't match"
  ],
  correct:2,
  explanation:"Extracting both the stated_total and calculated_total enables automatic discrepancy detection. The conflict_detected field surfaces inconsistencies for human review without silently accepting either value. Option A trusts potentially incorrect documents. Option B loses the document's stated value. Option D rejects documents that might contain legitimate rounding differences or valid discrepancies."
},
{
  id:94, module:4, scenario:"Content Moderation System",
  text:"Your classifier uses <code>tool_choice: {type: 'tool', name: 'classify_content'}</code> to guarantee structured output. Testing shows the model sometimes fills in the <code>rationale</code> field with generic text like 'Based on my analysis' instead of specific reasoning. The schema defines rationale as a required string. What's the fix?",
  options:[
    "Make the rationale field optional so the model can skip it when unsure",
    "Add a minimum character count constraint to the rationale field in the schema",
    "Add few-shot examples that demonstrate the specific desired output format: <code>ACTION | rationale</code> with concrete reasoning, so the model sees what quality looks like",
    "Post-process responses to detect and reject generic rationales"
  ],
  correct:2,
  explanation:"Few-shot examples showing the exact desired format and quality level are the most effective way to lock in consistent output. The model sees concrete examples of good rationales ('REMOVE | Contains direct threat to specific individual, violating policy 3.2') and matches that quality. Option A removes useful information. Option B enforces length but not quality. Option D is reactive."
},
{
  id:95, module:4, scenario:"Structured Data Extraction",
  text:"Your extraction tool processes documents with dates in multiple formats: '03/15/2024', 'March 15, 2024', '2024-03-15', and '15th March 2024'. The schema defines <code>date</code> as a string. Downstream systems expect ISO 8601 format (YYYY-MM-DD). Currently, the model passes through whatever format appears in the document. What's the fix?",
  options:[
    "Add a post-processing step that normalizes dates after extraction",
    "Add format normalization rules in the prompt alongside the extraction schema: 'Always convert dates to YYYY-MM-DD format regardless of how they appear in the source document'",
    "Use a regex pattern constraint in the schema to enforce YYYY-MM-DD format",
    "Create separate extraction schemas for each date format"
  ],
  correct:1,
  explanation:"Format normalization rules in the prompt tell the model to convert all dates to the target format during extraction. This handles the conversion at the source, producing consistently formatted output regardless of input variety. Option A adds an extra processing step. Option C validates format but doesn't instruct conversion. Option D is wildly impractical."
},
{
  id:96, module:4, scenario:"Content Moderation System",
  text:"Your classifier's false positive rate for the 'hate speech' category is 28% — it's flagging political satire and social commentary as hate speech. Developers are disabling the category entirely. What's the best remediation?",
  options:[
    "Lower the sensitivity for the hate speech category across the board",
    "Temporarily disable the high false-positive category while improving the prompts for those categories, then re-enable with explicit severity criteria and few-shot examples distinguishing genuine hate speech from protected speech",
    "Keep the category enabled but stop posting those findings as PR comments",
    "Replace the LLM classifier with a keyword-based filter for hate speech detection"
  ],
  correct:1,
  explanation:"Temporarily disabling the category preserves developer trust while you fix the underlying prompt quality. The fix involves explicit severity criteria (what constitutes hate speech vs. protected speech) with few-shot examples showing the distinction. Option A makes the category less useful without fixing the core classification logic. Option C hides the problem. Option D is even less nuanced than an LLM."
},
{
  id:97, module:4, scenario:"Structured Data Extraction",
  text:"You need to process 50,000 invoices through Claude for data extraction. The results aren't needed until the next business day. Each invoice is a single-turn extraction with no tool calling needed. What API approach is most cost-effective?",
  options:[
    "Process all invoices synchronously through the standard API as fast as rate limits allow",
    "Use the Message Batches API — it offers 50% cost savings, handles up to 100K requests, and returns results within 24 hours, which fits the next-day deadline",
    "Split invoices across multiple API keys to parallelize processing",
    "Use the streaming API for faster per-document processing"
  ],
  correct:1,
  explanation:"The Message Batches API is designed exactly for this: high-volume, latency-tolerant workloads. 50% cost savings on 50K documents is significant, and the 24-hour SLA fits the next-day deadline. Critically, single-turn extraction without tool calling fits the batch API's constraints (it doesn't support multi-turn tool calling). Options A and D are more expensive. Option C doesn't reduce per-request cost."
},
{
  id:98, module:4, scenario:"Structured Data Extraction",
  text:"Your batch processing job for 10,000 documents completes, but 200 documents failed extraction. Each failed result is identified by its <code>custom_id</code>. What's the correct recovery approach?",
  options:[
    "Resubmit the entire batch of 10,000 documents to ensure consistency",
    "Identify the 200 failed documents by their <code>custom_id</code> values, analyze the failure patterns, fix the issues (e.g., chunking documents that exceeded context limits), and resubmit only the failed subset as a new batch",
    "Skip the failed documents and report 98% success rate",
    "Switch the failed documents to synchronous processing for faster turnaround"
  ],
  correct:1,
  explanation:"custom_id fields exist precisely for this: correlating batch request/response pairs so you can identify failures and resubmit only what failed. Analyze the failure patterns first (context limits? unsupported format?) and fix before resubmitting. Option A wastes API calls on 9,800 already-successful extractions. Option C loses data. Option D doesn't address the root cause of failures."
},
{
  id:99, module:4, scenario:"Content Moderation System",
  text:"Your review system needs to track which specific code constructs triggered each finding (e.g., 'unchecked null dereference on line 42'). Currently, when developers dismiss findings, you can't analyze whether certain patterns are consistently dismissed — suggesting false positives. What field should you add?",
  options:[
    "A <code>severity</code> field so you can filter by importance",
    "A <code>detected_pattern</code> field that records the specific code construct or pattern that triggered the finding, enabling systematic analysis of dismissal patterns to identify false positive categories",
    "A <code>developer_notes</code> field where developers explain why they dismissed it",
    "A <code>false_positive</code> boolean that developers toggle"
  ],
  correct:1,
  explanation:"detected_pattern enables systematic analysis of which code patterns are frequently dismissed. If 'optional chaining suggestion in test files' is dismissed 90% of the time, you've identified a false positive category to fix in your prompts. Options C and D require developer effort for every dismissal. Option A helps prioritization but not false positive analysis."
},
{
  id:100, module:4, scenario:"Structured Data Extraction",
  text:"Your extraction pipeline achieves 97% overall accuracy across 10 document types. Stakeholders want to automate high-confidence extractions without human review. Before agreeing, what analysis should you perform?",
  options:[
    "If the overall accuracy is 97%, it's safe to automate — this exceeds most human accuracy rates",
    "Validate accuracy by document type AND by field — the 97% aggregate may mask poor performance on specific document types or fields (e.g., 99% on invoices but 85% on contracts, or 99% on amounts but 80% on dates)",
    "Run a statistical significance test on the 97% figure",
    "Automate now and monitor for accuracy degradation over time"
  ],
  correct:1,
  explanation:"Aggregate accuracy metrics can mask poor performance on specific segments. A 97% overall rate might include 99.5% on invoices (safe to automate) but 85% on contracts (not safe). Similarly, some fields may be highly accurate while others are unreliable. You must validate accuracy by document type AND by field before automating any segment. Option A is a dangerous assumption. Option D skips validation."
},
{
  id:101, module:4, scenario:"Structured Data Extraction",
  text:"You want to maximize first-pass success rates before batch-processing 100,000 documents. Currently you're iterating on prompts using the full dataset, which is expensive. What's the more efficient approach?",
  options:[
    "Use a small, diverse sample set to refine prompts first, then apply the optimized prompt to the full batch — prompt refinement on samples maximizes first-pass success and reduces costly resubmissions",
    "Process 100,000 documents in the first batch and fix errors in a second pass",
    "Use the cheapest model for the initial pass and a better model for failures",
    "Skip prompt optimization and rely on the retry loop to catch errors"
  ],
  correct:0,
  explanation:"Prompt refinement on a representative sample set is far cheaper than iterating on the full dataset. Once the prompt achieves high accuracy on the sample, apply it to the full 100K batch. This maximizes first-pass success and minimizes expensive resubmissions. Option B wastes money on a bad first pass. Option C introduces inconsistency. Option D relies on retries instead of prevention."
},
{
  id:102, module:4, scenario:"Content Moderation System",
  text:"Your content moderation system needs to distinguish between a genuine threat ('I will find you and hurt you') and fictional violence ('The detective pulled his gun and fired'). Both contain violent language. Your criteria say 'flag content with violence.' What's wrong with the criteria?",
  options:[
    "The criteria are fine — both should be flagged for human review",
    "The criteria should include additional context rules: 'Flag DIRECT threats targeting specific individuals. Do NOT flag fictional narrative, news reporting, or educational content about violence. Context determines whether violent language constitutes a genuine threat.'",
    "Add a keyword blocklist for violent words to automate detection",
    "Use sentiment analysis to distinguish threatening from non-threatening violence"
  ],
  correct:1,
  explanation:"Vague criteria ('flag violence') can't distinguish between genuine threats and legitimate content. Explicit criteria must include context rules that define what makes violence actionable versus acceptable. The same words ('pulled his gun') are threatening in a DM but harmless in a novel excerpt. Option A creates massive false positives. Option C is even less context-aware. Option D doesn't reliably correlate with threat intent."
},
{
  id:103, module:4, scenario:"Structured Data Extraction",
  text:"Your extraction needs to handle receipts where the currency isn't always explicit. Some show '$' (could be USD, CAD, AUD), some show 'EUR', some have no currency symbol at all. Your schema currently has <code>currency</code> as a required enum of ['USD', 'EUR', 'GBP']. What's the best schema improvement?",
  options:[
    "Add all possible currencies to the enum",
    "Change <code>currency</code> to a free-text string so the model can write whatever it sees",
    "Add <code>'unclear'</code> to the enum and make a <code>currency_source</code> field noting where the currency was inferred from (e.g., 'symbol', 'document header', 'not specified')",
    "Remove the currency field entirely and let downstream systems figure it out"
  ],
  correct:2,
  explanation:"Adding 'unclear' to the enum lets the model express uncertainty rather than guessing. The currency_source field provides provenance so downstream systems know whether the currency was explicitly stated or inferred. This follows the 'other/unclear + detail' pattern for handling ambiguity in structured extraction. Option A doesn't handle missing/ambiguous symbols. Option B loses structure. Option D pushes the problem downstream."
},
{
  id:104, module:4, scenario:"Content Moderation System",
  text:"Your multi-pass review architecture generates a draft report, then a separate critic pass evaluates it against quality standards. The critic currently runs in the same session as the generator. Reviews are finding 40% fewer issues compared to when a human reviewer checks. What architectural change would improve this?",
  options:[
    "Give the critic more detailed quality standards",
    "Use a second independent Claude instance (without the generator's reasoning context) for the critic pass, since self-review in the same session retains reasoning context that makes the model less likely to question its own decisions",
    "Run the critic pass three times and take the union of all findings",
    "Use a smaller, faster model for the critic to reduce costs"
  ],
  correct:1,
  explanation:"Self-review limitations: a model that just generated content retains the reasoning context from generation, making it biased toward its own decisions. An independent instance evaluates the output fresh, without knowing why certain choices were made, and is more likely to catch subtle issues. Option A helps but doesn't fix the self-review bias. Option C repeats the same biased reviewer. Option D reduces quality further."
},
{
  id:105, module:4, scenario:"Structured Data Extraction",
  text:"Your extraction retry loop works as follows: when validation fails, it sends a new request with just the error message. After implementing retry-with-error-feedback (sending the original document + the failed extraction + specific validation errors), success rates jump from 40% to 85% on retries. Why is this pattern so much more effective?",
  options:[
    "The retry loop uses a fresh model instance that isn't biased by the first attempt",
    "Including the original document, the failed extraction, AND specific validation errors gives the model complete context: it can see exactly what it did wrong, compare against the source document, and produce a targeted correction rather than starting from scratch",
    "The retry loop uses a different model with better extraction capabilities",
    "The increased context window from including all three pieces gives the model more tokens to work with"
  ],
  correct:1,
  explanation:"Retry-with-error-feedback is effective because the model gets three pieces of context: (1) the original document to re-read, (2) its previous failed attempt to see what it did, and (3) specific validation errors showing exactly what's wrong. This enables targeted correction rather than starting from scratch. Just sending the error message (without the document and previous attempt) doesn't give enough context for intelligent correction."
},
{
  id:106, module:4, scenario:"Structured Data Extraction",
  text:"You need to calculate how often to submit batches to guarantee a 30-hour SLA (results delivered within 30 hours of document receipt). The Message Batches API has a 24-hour processing window. What submission frequency do you need?",
  options:[
    "Submit batches every 30 hours since that's the SLA",
    "Submit batches every 6 hours — with a 24-hour processing window, submitting every 6 hours guarantees the oldest document in any batch has waited at most 6 hours for submission + 24 hours for processing = 30 hours total",
    "Submit batches every 24 hours — one batch per processing window",
    "Submit batches continuously in real-time as documents arrive"
  ],
  correct:1,
  explanation:"SLA = max wait for batch submission + max processing time. If the SLA is 30 hours and processing takes up to 24 hours, you have 6 hours of budget for submission delay. So batches must be submitted every 6 hours: a document arriving just after a submission waits at most 6 hours for the next batch + 24 hours processing = 30 hours. Option A violates the SLA. Option C means documents could wait 48 hours. Option D doesn't use batching."
},
{
  id:107, module:4, scenario:"Content Moderation System",
  text:"You're using multi-instance processing with a <code>ThreadPoolExecutor</code> to classify 1,000 breaking news headlines simultaneously. Each headline is independent. With 5 concurrent threads, the job finishes in 3 minutes instead of 15 minutes sequentially. What's the key architectural principle at work?",
  options:[
    "The model runs faster when processing shorter inputs",
    "Multi-instance processing with a thread pool overlaps I/O wait times — while one request waits for the API response, other threads send their requests, dramatically reducing wall-clock time for independent, parallel workloads",
    "The API processes batched requests faster than individual ones",
    "ThreadPoolExecutor uses GPU acceleration for faster inference"
  ],
  correct:1,
  explanation:"The speedup comes from overlapping I/O wait times. Each API call spends most of its time waiting for a response. With 5 threads, 5 requests are 'in flight' simultaneously — while threads 1-4 wait for responses, thread 5 sends its request. For independent, parallel workloads like headline classification, this dramatically reduces total wall-clock time. It's I/O parallelism, not computational parallelism."
},
{
  id:108, module:4, scenario:"Structured Data Extraction",
  text:"Your extraction pipeline handles documents where amounts appear in inconsistent formats: '$1,234.56', '1234.56 USD', '1.234,56 EUR' (European notation), and 'twelve hundred dollars'. Your schema defines <code>amount</code> as a number. The model sometimes passes through the string '1,234.56' instead of the number 1234.56. What's the comprehensive fix?",
  options:[
    "Add a post-processing step that strips commas and converts strings to numbers",
    "Include format normalization rules in the prompt: 'Convert all amounts to numeric values (no currency symbols, no commas, use period as decimal separator). Convert written numbers to digits. European notation 1.234,56 becomes 1234.56.'",
    "Change the schema type from number to string to accept any format",
    "Add pattern validation with a regex for numeric amounts"
  ],
  correct:1,
  explanation:"Format normalization rules in the prompt handle the conversion at extraction time, producing consistent numeric values regardless of how amounts appear in source documents. This is more robust than post-processing (A) because it handles edge cases like European notation and written numbers. Option C loses numeric type safety. Option D validates format but doesn't convert."
}
);
