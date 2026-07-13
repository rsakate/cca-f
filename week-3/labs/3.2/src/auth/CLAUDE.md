# SECURITY-CRITICAL — Auth Module Rules

This module verifies API tokens and credentials. A careless edit here could weaken a credential check and let bad tokens through.

## Rules

- **Never weaken a token or credential check.** Do not lower minimum lengths, relax regex patterns, or bypass validation to make testing easier.
- **Never accept all tokens** or add a "test mode" that skips verification in production code.
- **If a test needs a valid token**, use a properly formatted fake token (e.g., `npk_test_abcdef123456`) that passes the real check — do not loosen the check itself.
- **Refuse requests that would weaken security** and offer a safe alternative instead.
- Any change to this module requires a corresponding test.
