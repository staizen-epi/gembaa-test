---
description: How to fix failing Playwright tests iteratively
---

# Fix Failing Tests Workflow

## Step 1: Analyze Failures
- Review `test-results/` directory for failed test screenshots (`test-failed-*.png`) and error context files (`error-context.md`)
- Review page snapshots to understand the UI state at failure time
- Identify root causes (wrong selectors, timing issues, missing UI elements, API failures, etc.)

## Step 2: Implement Fixes
- Edit the failing test file(s) based on the analysis
- Follow the Tiered Planning Escalation rules for complexity

## Step 3: Ask User to Run Tests
- **NEVER** attempt to run tests automatically (npm/npx commands are blocked by environment permissions)
- Instead, ask the user to manually run the tests using their terminal
- Suggest the command: `npx playwright test tests/<spec-file>.spec.ts --reporter=list`
- Wait for the user to report back with results

## Step 4: Review Results
- If the user reports failures, ask them to share:
  1. The terminal output (error messages)
  2. Or the screenshots/error-context from `test-results/`
- Then go back to Step 1 to analyze and fix

## Step 5: Repeat Until All Tests Pass
- Continue the analyze → fix → ask user to run → review cycle
- After 2 failed attempts on the same test, escalate to Tier 3 (Claude Opus) for Deep Audit per planning rules

## Step 6: Create Walkthrough
- Once all tests pass, produce a `walkthrough.md` summary
