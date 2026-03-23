---
trigger: always_on
---

All questions asked are in the context of using the models within Antigravity IDE. Any requested MCP is in the perspective of having it added for Antigravity.

## Test Execution Rule
Whenever implementing code changes, test fixes, or any updates, **do not automatically run tests using terminal tools**. Instead, make the code changes and prompt the user to run the tests manually themselves.

## Prefer Constants Over Hardcoded Strings in Tests
When writing or modifying test code (especially UI automation tests like Playwright), ALWAYS use shared constants from your constants files (e.g., `constants.ts` or similar shared constants file) instead of hardcoding strings. This applies to:
- URLs, endpoints, and paths
- Form or element labels, generic texts, and toast messages
- Timeouts (e.g. use `TIMEOUT.DEFAULT` instead of `10000`)
- Permissions or test mock values

## Use API Utilities for Network Requests
Whenever there is a need to use APIs for tests (for setup, teardown, assertions, or triggering specific states), ALWAYS refer back to the existing API utilities located in `tests/api/*` (e.g., `BffApi`, `GbaApi`, `ScimApi`). Do not write raw `page.request` or `fetch` calls directly within the test files unless an appropriate utility method does not exist (in which case, add it to the utility class first).