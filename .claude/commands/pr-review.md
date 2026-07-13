Review the PR diff and output ONLY a JSON object with this exact shape — no prose, no markdown, no explanation:

{
  "decision": "approve" | "request_changes",
  "issues": [
    { "severity": "blocker" | "warning" | "nit", "message": "..." }
  ]
}

Rules:
- "approve" if the code is correct, tested, and follows project conventions.
- "request_changes" if there are blockers (bugs, missing tests, security issues).
- List every issue you find, even nits, but only blockers flip the decision.
- Output raw JSON only. No markdown fences, no surrounding text.
