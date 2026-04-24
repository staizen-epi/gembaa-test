# Test Generation Guidelines

---

tools: ['playwright']
mode: 'agent'

---

Generate plain Playwright tests following these patterns and rules.

## Environment Selection

**When asking an LLM to generate or update tests, specify the target environment in your prompt.**

The test framework supports two environments:

| Environment        | Env File     | Test Command             | When to Use             |
| ------------------ | ------------ | ------------------------ | ----------------------- |
| **Local** (Docker) | `.env.local` | `npm run test:e2e:local` | Default for development |
| **DEV** (Deployed) | `.env`       | `npm run test:e2e:dev`   | After deploying to DEV  |

The environment choice affects:

1. **Which env file to read** for base URL and credentials (Step 3.1 of MCP Exploration)
2. **Which MCP base URL** to navigate to during UI exploration
3. **Which test command** to run for verification (Step 5)

**If no environment is specified, default to Local.**

### Developer Prompt Examples

**Generate new tests on local environment:**

```
Generate e2e tests for tests/library/content-library/tag-filters.bdd.md on local environment.
```

**Update existing tests on local environment:**

```
The tag-filters.bdd.md UX has changed. Modify tests following generate-test.md instructions on local env and verify they pass.
```

**Generate tests on DEV environment (after deploying):**

```
Generate e2e tests for tests/library/content-library/search.bdd.md on dev environment.
```

**Without specifying environment (defaults to local):**

```
Generate e2e tests for tests/library/content-library/file-upload.bdd.md
```

**Multiple BDD files changed:**

```
The BDD files tag-filters.bdd.md and file-details.bdd.md have been updated. Update their spec files on local env.
```

## CRITICAL: Only Modify Tests for Changed BDD Files

**NEVER modify tests for BDD files that were not changed.**

When generating or updating tests:

- Only work on spec files whose corresponding `.bdd.md` was modified
- DO NOT touch other spec files, even if they share the same directory
- If only `file-upload.bdd.md` was modified, ONLY update `file-upload.spec.js`

## CRITICAL: Complete Workflow (MUST FOLLOW IN ORDER)

**You MUST complete ALL steps in this order. Do NOT skip any step.**

### Step 1: Read BDD File

Read the matching `.bdd.md` file to understand scenarios to implement.
Located alongside spec file (e.g., `search.bdd.md` for `search.spec.js`).

### Step 2: Compare with Existing Tests

Check if spec file exists and what scenarios are already implemented.

### Step 3: MANDATORY - Explore UI with MCP Browser Tools

**STOP! You MUST actually call MCP browser tools NOW before writing any test code.**

**DO NOT write selectors, assertions, or any test code until you have explored the UI. DO NOT add TODO/placeholder comments for "later MCP exploration" - explore NOW.**

**If you skip this step or write placeholder selectors, the tests WILL fail and you WILL have to redo the work.**

#### Available MCP Tools

Use these tools via `CallMcpTool` with server `user-playwright`:

| Tool                          | Purpose                                                  |
| ----------------------------- | -------------------------------------------------------- |
| `playwright_navigate`         | Navigate to a URL                                        |
| `playwright_screenshot`       | Take screenshot (save to Downloads, then Read the image) |
| `playwright_click`            | Click an element                                         |
| `playwright_fill`             | Fill an input                                            |
| `playwright_get_visible_html` | Get HTML of matching elements                            |
| `playwright_get_visible_text` | Get visible text                                         |
| `playwright_evaluate`         | Run JavaScript in browser to inspect DOM                 |
| `playwright_press_key`        | Press keyboard key (e.g., Escape)                        |

#### MCP Exploration Procedure (EXECUTE THIS)

**You MUST actually execute these steps using the tools above. Not just read them.**

1. **Read the environment file to get the base URL and credentials:**
    - **Local environment** (default): Read `.env.local`
    - **DEV environment**: Read `.env`
    - **If not specified**: Read `.env.local` (fallback to `.env` if no `.env.local`)

2. **Navigate to the app** using PLAYWRIGHT_BASE_URL from the env file:

    ```
    CallMcpTool server=user-playwright toolName=playwright_navigate arguments={"url": "<PLAYWRIGHT_BASE_URL>"}
    ```

    - Local: `https://frontend.tao-neo-studio.test` (from `.env.local`)
    - DEV: `https://tao-neo-studio.taotesting.info` (from `.env`)

3. **Take a screenshot and READ IT to see current state:**

    ```
    CallMcpTool server=user-playwright toolName=playwright_screenshot arguments={}
    Read the screenshot file from Downloads/
    ```

4. **If login page, log in using credentials from the env file:**
    - Email: from TEST_USER_EMAIL_PATTERN with index 000
    - Password: from TEST_USER_PASSWORD
    - **IMPORTANT: Email format uses 3-digit index: `auto000`, `auto001`, etc.**

5. **Navigate to the exact page for your test and take screenshot:**

    ```
    CallMcpTool server=user-playwright toolName=playwright_navigate arguments={"url": "<PLAYWRIGHT_BASE_URL>/portal/library/content-library"}
    ```

6. **Get ALL data-testid attributes on the page:**

    ```
    CallMcpTool server=user-playwright toolName=playwright_evaluate arguments={"script": "Array.from(document.querySelectorAll('[data-testid]')).map(el => ({ testid: el.dataset.testid, tag: el.tagName, text: el.textContent?.substring(0, 80) }))"}
    ```

7. **For each UI element you need to test, click it and take screenshots:**
    - Click tabs, buttons, dropdowns
    - Take screenshots after each action
    - Get HTML structure of specific elements:

    ```
    CallMcpTool server=user-playwright toolName=playwright_get_visible_html arguments={"selector": "[data-testid='tag-panel']"}
    ```

8. **Record the EXACT selectors that work** - only use these in tests.

#### What You MUST Discover Before Writing Tests

For EVERY assertion in the test, you must have evidence from MCP exploration:

- The exact `data-testid` values on the page
- The exact text/names of tabs, buttons, headings
- The HTML structure of dropdowns, dialogs, panels
- Whether elements use `role="button"`, `role="tab"`, `role="checkbox"`, etc.
- How many elements match a given selector (to avoid strict mode violations)

### Step 4: Generate/Update Tests

Write tests using ONLY selectors discovered in Step 3. **If you didn't explore it, don't write it.**

### Step 5: MANDATORY - Run Tests Until They Pass on ALL Browsers

**DO NOT finish until ALL tests pass on ALL 3 browsers. You MUST execute the test commands and verify output.**

Run from the `frontend` directory (NOT `e2e-tests`):

#### Phase 1: Validate modified spec files on all 3 browsers

Run only the changed spec file(s) across all browsers first. This is fast and catches cross-browser issues early.

```bash
cd components/tao-neo-studio/frontend

# Local Docker environment (default)
npx cross-env E2E_ENV=local NODE_TLS_REJECT_UNAUTHORIZED=0 PLAYWRIGHT_RETRIES=0 npx playwright test e2e-tests/tests/<path-to-spec-file>.spec.js

# DEV environment
npx cross-env E2E_ENV=dev SKIP_ENV_LOCAL=true PLAYWRIGHT_RETRIES=0 npx playwright test e2e-tests/tests/<path-to-spec-file>.spec.js
```

**Note:** `PLAYWRIGHT_RETRIES=0` gives fast feedback — no retries during development. The command runs the spec across all 3 browser projects (chromium, firefox, webkit).

**Verification loop (MUST FOLLOW):**

1. Run the command above for each modified spec file
2. Read the output - check for "passed" or "failed"
3. **If tests fail on any browser:**
    - Read the error message and failure screenshot
    - Use MCP browser tools to re-explore the failing element
    - Fix the selector/assertion in the test file
    - Re-run on the failing browser to verify: `--project=firefox`
    - Then re-run on all 3 browsers to confirm no regressions
    - **Repeat until ALL tests pass on ALL browsers**
4. **If all tests pass on all 3 browsers:** Proceed to Phase 2

#### Phase 2: Run full test suite on all browsers

After modified specs pass on all browsers, run the full suite to verify no regressions:

```bash
# Local Docker environment
npm run test:e2e:all -- --retries=0

# DEV environment
npm run test:e2e:all:dev -- --retries=0
```

This runs all spec files across chromium, firefox, and webkit. Check the summary reporter output at the end for per-browser results.

**If any tests fail that were NOT modified**, investigate whether your changes caused a regression. If so, fix it. If the failure is pre-existing (unrelated to your changes), note it and proceed.

**NEVER finish with failing tests in the modified spec files. NEVER leave TODO comments in test files.**

### New vs Modified Scenario Detection

**Match scenarios by CONTENT (steps), not just title or number.**

Scenarios can be renumbered without changing content. Compare the **Given/When/Then steps**:

| BDD File                    | Spec File                    | Action                                                |
| --------------------------- | ---------------------------- | ----------------------------------------------------- |
| Steps match existing test   | Test exists with same steps  | **KEEP** - no changes needed (even if number changed) |
| New steps, no matching test | No test with these steps     | **ADD** new test                                      |
| Steps differ from existing  | Test exists but steps differ | **UPDATE** test to match new steps                    |

#### CRITICAL: Detecting Semantic Changes in BDD Steps

**Even small wording changes can be semantically significant. READ EACH WORD CAREFULLY.**

Compare BDD step text WORD-BY-WORD with the test implementation. Examples of semantic changes that REQUIRE test updates:

| BDD Before             | BDD After                                    | Change Required                                                |
| ---------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| `file is uploaded`     | `file is uploaded as qti-item document type` | **YES** - Must pass `documentTypeId: 'qti-item'` to upload API |
| `user uploads file`    | `user uploads file with AI tags enabled`     | **YES** - Must check AI tags checkbox                          |
| `3 files are uploaded` | `3 PDF files are uploaded`                   | **YES** - Must use PDF fixtures instead of any files           |
| `category is created`  | `mandatory category is created`              | **YES** - Must pass `mandatory: true` to API                   |

**When comparing BDD to test code:**

1. Read EVERY word in the BDD step
2. Check if the test code implements ALL the words
3. If BDD says "as qti-item document type" but test just calls `uploadFromFixtures()` without documentTypeId → **UPDATE REQUIRED**
4. If BDD says "with AI tags enabled" but test doesn't check AI checkbox → **UPDATE REQUIRED**

**Example: Semantic change requiring update**

```markdown
# BDD before:

**And** qti-item-example.zip file is uploaded

# BDD after (semantic change):

**And** qti-item-example.zip file is uploaded as qti-item document type
```

→ The phrase "as qti-item document type" means the test MUST now use:

```javascript
// BEFORE: await api.files.uploadFromFixtures(apiContext, 'qti-item-example.zip', fileName);
// AFTER:  await api.files.uploadWithMetadata(apiContext, 'qti-item-example.zip', fileName, 'qti-item');
```

**Example: Renumbered scenario (no change needed)**

```markdown
# BDD before:

### Scenario 3: Delete Multiple Files

**Given** 3 files uploaded **When** delete **Then** deleted

# BDD after (renumbered, same content):

### Scenario 5: Delete Multiple Files

**Given** 3 files uploaded **When** delete **Then** deleted
```

→ Same content = **no test changes needed**, just comment update if desired

### Shared Setup with Independent Tests

**When multiple scenarios share the same "Given" setup, use `beforeAll` to create data once, then each test navigates independently.**

**DO NOT use `serial` mode for data sharing.** Serial mode causes cascade failures in CI: if one test fails, `afterAll` cleans up data, then ALL tests retry but the shared data is gone.

```markdown
# BDD scenarios with shared Given:

### Scenario 3: Download Multiple Files

**Given** 3 files are uploaded via API
**When** selects Download action...

### Scenario 4: Edit Tags

**Given** 3 files are uploaded via API
**When** selects Edit Tags action...

### Scenario 5: Delete Multiple Files

**Given** 3 files are uploaded via API
**When** selects Delete action...
```

**Correct structure — independent tests with shared `beforeAll`:**

```javascript
test.describe('Bulk Operations (3 files)', () => {
    // NO serial mode — tests are independent
    const TEST_PREFIX = 'e2e-bulk';
    const UNIQUE_ID = Date.now();
    const testFiles = [
        `${TEST_PREFIX}-${UNIQUE_ID}-1.pdf`,
        `${TEST_PREFIX}-${UNIQUE_ID}-2.pdf`,
        `${TEST_PREFIX}-${UNIQUE_ID}-3.pdf`
    ];
    let setupComplete = false;

    // SHARED SETUP: beforeAll uploads files once for all tests
    test.beforeAll(async ({ authenticatedPage, apiContext }) => {
        await api.files.deleteByPattern(apiContext, new RegExp(TEST_PREFIX)); // Clean leftovers
        for (const fileName of testFiles) {
            await api.files.uploadFromFixtures(apiContext, 'dummy.pdf', fileName);
        }
        setupComplete = true;
    });

    // Each test navigates independently — wait for heading, NOT networkidle
    test('should download multiple files', async ({ authenticatedPage }) => {
        test.skip(!setupComplete, 'Setup failed');
        await authenticatedPage.goto('/portal/library/content-library');
        await expect(authenticatedPage.getByRole('heading', { name: 'Content Library' })).toBeVisible({
            timeout: 30000
        });
        // ... download test
    });

    test('should edit tags', async ({ authenticatedPage }) => {
        test.skip(!setupComplete, 'Setup failed');
        await authenticatedPage.goto('/portal/library/content-library');
        await expect(authenticatedPage.getByRole('heading', { name: 'Content Library' })).toBeVisible({
            timeout: 30000
        });
        // ... edit tags test
    });

    test('should delete multiple files', async ({ authenticatedPage }) => {
        test.skip(!setupComplete, 'Setup failed');
        await authenticatedPage.goto('/portal/library/content-library');
        await expect(authenticatedPage.getByRole('heading', { name: 'Content Library' })).toBeVisible({
            timeout: 30000
        });
        // ... delete test
    });

    test.afterAll(async ({ authenticatedPage }) => {
        // Always clean up
    });
});
```

**Key rules:**

1. **`beforeAll` for shared setup**: Upload files, create data once
2. **Each test navigates independently**: `goto()` + `expect(heading).toBeVisible()`
3. **`test.skip(!setupComplete)`**: Skip gracefully if setup failed
4. **Put destructive tests (Delete) last**: They still run even if earlier tests fail
5. **Always use `afterAll` for cleanup**: Even if delete test runs, it may not clean everything

### BDD Statement Mapping

**CRITICAL: ALL Given/And statements MUST be implemented. DO NOT skip any setup steps.**

| BDD Statement              | Maps To                    | Example                                                                            |
| -------------------------- | -------------------------- | ---------------------------------------------------------------------------------- |
| **Given** (all until When) | API setup code             | `await api.files.uploadFromFixtures(...)`                                          |
| **And** (after Given)      | Additional API setup       | `await api.categories.create(...)`, `await api.documentTypeCategories.assign(...)` |
| **When**                   | Browser actions            | `await page.click(...)`, `await page.fill(...)`                                    |
| **And** (after When)       | Additional browser actions | `await page.getByRole('button').click()`                                           |
| **Then**                   | Assertions                 | `await expect(page.getByText(...)).toBeVisible()`                                  |
| **And** (after Then)       | Additional assertions      | `await expect(...).toHaveCount(...)`                                               |

**If BDD says to do something, the test MUST do it. Examples:**

- "user selects qti-item as document type" → Test must click document type dropdown and select "qti-item"
- "user selects Math tag from Subject category" → Test must click category dropdown and select "Math"
- "user clicks Save and Next button" → Test must click "Save and Next", NOT "Skip & Upload"

**NEVER simplify or skip steps to make tests easier. If API methods are missing, add them to api.js first.**

### CRITICAL: Tests MUST FAIL When BDD Steps Cannot Be Completed

**DO NOT use `.catch(() => false)` or conditional logic to silently skip BDD steps.**

```javascript
// BAD: Silently skipping if dropdown not visible (test passes but BDD step not executed)
const categoryDropdown = dialog.getByRole('combobox', { name: /Subject/i });
const visible = await categoryDropdown.isVisible({ timeout: 3000 }).catch(() => false);
if (visible) {
    await categoryDropdown.click(); // BDD step only happens if visible
} else {
    console.log('Category dropdown not visible'); // BDD step silently skipped!
}

// GOOD: Test MUST fail if BDD step cannot be completed
const categoryDropdown = dialog.getByRole('combobox', { name: /Subject/i });
await expect(categoryDropdown).toBeVisible({ timeout: 5000 }); // Fails if not visible
await categoryDropdown.click();
await expect(authenticatedPage.getByRole('option', { name: 'Math' })).toBeVisible();
await authenticatedPage.getByRole('option', { name: 'Math' }).click();
```

**If a BDD step says "user selects X", the test MUST:**

1. Assert the element is visible (fail if not)
2. Perform the action
3. Assert the result (fail if action didn't work)

**Why tests should fail:** If API setup is wrong (e.g., category not assigned to document type), the test should FAIL immediately, not silently proceed. A passing test that skipped required steps gives false confidence.

### Auto-Generate Cleanup from Given Statements

**Cleanup is NOT specified in BDD files.** Auto-generate `afterAll` cleanup based on the Given statements:

| Given statement                            | Cleanup action                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| "API uploads file..."                      | `api.files.deleteByPattern(apiContext, /TEST_PREFIX/)`                         |
| "API creates tag category..."              | `api.tagCategories.deleteByPattern(apiContext, /TEST_PREFIX/)`                 |
| "API assigns category to document type..." | `api.documentTypeCategories.removeCategory(apiContext, docTypeId, categoryId)` |
| "API creates custom filter..."             | `api.templates.deleteByPattern(apiContext, /TEST_PREFIX/)`                     |

**Cleanup order matters** (reverse of creation):

1. Remove category assignments from document types
2. Delete tag categories (auto-deletes tags)
3. Delete files
4. Delete other created resources

#### CRITICAL: Use Flexible Cleanup Patterns (NO exact match)

**DO NOT use exact match patterns (`^...$`) for cleanup.** Use flexible partial match patterns to catch leftover files from previous failed test sessions.

```javascript
// BAD: Exact match - only deletes files named EXACTLY "qti-item-example.zip"
// If previous session left files, they won't be cleaned!
await api.files.deleteByPattern(apiContext, /^qti-item-example\.zip$/);

// GOOD: Partial match - deletes ALL files containing "qti-item-example.zip"
// This catches leftovers from previous sessions
await api.files.deleteByPattern(apiContext, /qti-item-example\.zip/);

// BAD: Exact match for prefix pattern
await api.files.deleteByPattern(apiContext, /^e2e-upload-file1\.pdf$/);

// GOOD: Flexible prefix pattern (catches any file starting with prefix)
await api.files.deleteByPattern(apiContext, /e2e-upload/);
```

**Why flexible patterns?** Tests may fail mid-execution, leaving test data behind. The next run's cleanup should delete ALL matching files, not just exact names. Partial match patterns ensure complete cleanup.

#### CRITICAL: Use afterAll for Cleanup (NOT inline in last test)

**NEVER put cleanup inside the last test.** If the test fails, cleanup won't run!

```javascript
// BAD: Cleanup in last test - if test fails, cleanup never runs!
test('should do final action', async ({ authenticatedPage, apiContext }) => {
    // ... test logic that might fail ...

    // This cleanup NEVER runs if the test above fails!
    await api.files.deleteByPattern(apiContext, new RegExp(TEST_PREFIX));
});

// GOOD: afterAll ALWAYS runs, even when tests fail
test.afterAll(async ({ authenticatedPage }) => {
    if (!authenticatedPage) {
        console.warn('[cleanup] No authenticated page, skipping cleanup');
        return;
    }
    try {
        const { apiContext } = await createApiContext(authenticatedPage);
        try {
            await api.files.deleteByPattern(apiContext, new RegExp(TEST_PREFIX));
        } finally {
            await apiContext.dispose();
        }
    } catch (error) {
        console.warn('[cleanup] Failed:', error.message);
    }
});
```

**Why afterAll is required:**

- `afterAll` runs even when tests fail
- Inline cleanup in last test means failed tests leave data behind
- Leftover data causes subsequent test runs to fail

### Example: BDD to Test

```markdown
### Scenario 3: Delete multiple files

**Given** user is on content library with files
**And** 3 files are uploaded
**When** user selects all 3 file checkboxes
**And** Selects Delete action from dropdown menu
**Then** Files gets deleted
```

Becomes (after MCP exploration to find actual selectors):

```javascript
test('should delete multiple files', async ({ authenticatedPage, apiContext }) => {
    // GIVEN: API setup (all Given/And statements before When)
    await api.files.uploadFromFixtures(apiContext, 'dummy.pdf', `${TEST_PREFIX}-file1.pdf`);
    await api.files.uploadFromFixtures(apiContext, 'dummy.pdf', `${TEST_PREFIX}-file2.pdf`);
    await api.files.uploadFromFixtures(apiContext, 'dummy.pdf', `${TEST_PREFIX}-file3.pdf`);
    await authenticatedPage.goto('/portal/library/content-library');
    await expect(authenticatedPage.getByRole('heading', { name: 'Content Library' })).toBeVisible({ timeout: 30000 });

    // WHEN: Browser actions (selectors discovered via MCP snapshot)
    // NOTE: Actual selectors depend on your UI - find them via browser_snapshot!
    const checkboxes = authenticatedPage.getByTestId('file-select-checkbox');
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    await authenticatedPage.getByTestId('actions-dropdown').click();
    await authenticatedPage.getByRole('menuitem', { name: /delete/i }).click();

    // Confirm in dialog
    const dialog = authenticatedPage.getByRole('alertdialog');
    await dialog.getByRole('button', { name: /delete|confirm/i }).click();

    // THEN: Assertions
    await expect(authenticatedPage.getByText(`${TEST_PREFIX}-file1.pdf`)).not.toBeVisible();
});
```

**IMPORTANT:** The selectors in this example are PLACEHOLDERS. You MUST:

1. Run `browser_navigate` to the content library page
2. Run `browser_snapshot` to see actual element structure
3. Replace placeholder selectors with real ones from the snapshot

## CRITICAL: Single Session Pattern

**ALL tests in a describe block share ONE authenticated session. NO additional logins or browser windows.**

### Key Rules

1. **ONE login per test file** - The `authenticatedPage` fixture handles login once per worker
2. **NO new browser contexts** - Never use `browser.newContext()` in tests
3. **beforeAll for API setup** - Move all API setup (create categories, upload files) to `beforeAll`
4. **afterAll for API cleanup** - Always use `test.afterAll` to ensure cleanup runs even if tests fail

### CRITICAL: Test Independence Pattern (RECOMMENDED)

**Tests should be INDEPENDENT - if one test fails, others should still run.**

In Playwright's `serial` mode, when ANY test fails, ALL subsequent tests are skipped. This is usually NOT what you want.

**RECOMMENDED: Independent tests (no serial mode)**

```javascript
import api, { createApiContext } from '../../../helpers/api.js';
import { expect, test } from '../../../helpers/fixtures.js';

const TEST_PREFIX = 'e2e-feature';

test.describe('Feature Name', () => {
    // NO serial mode - tests are independent

    let setupComplete = false;

    // API setup in beforeAll - if this fails, tests will error (not skip)
    test.beforeAll(async ({ authenticatedPage }) => {
        const { apiContext } = await createApiContext(authenticatedPage);
        try {
            await api.files.uploadFromFixtures(apiContext, 'dummy.pdf', `${TEST_PREFIX}-test.pdf`);
            setupComplete = true;
        } finally {
            await apiContext.dispose();
        }
    });

    // Helper: Navigate to page (used by each test independently)
    async function navigateToFeature(page) {
        await page.goto('/portal/feature-path');
        await expect(page.getByRole('heading', { name: 'Feature' })).toBeVisible({ timeout: 30000 });
    }

    // Each test navigates independently
    test('should display main page', async ({ authenticatedPage }) => {
        test.skip(!setupComplete, 'Setup failed');
        await navigateToFeature(authenticatedPage);
        await expect(authenticatedPage.getByRole('button', { name: 'Action' })).toBeVisible();
    });

    test('should do something', async ({ authenticatedPage }) => {
        test.skip(!setupComplete, 'Setup failed');
        await navigateToFeature(authenticatedPage); // Navigate independently
        await authenticatedPage.getByRole('button', { name: 'Action' }).click();
        await expect(authenticatedPage.getByText('Result')).toBeVisible();
    });

    test('should complete flow', async ({ authenticatedPage }) => {
        test.skip(!setupComplete, 'Setup failed');
        await navigateToFeature(authenticatedPage); // Navigate independently
        await expect(authenticatedPage.getByText('Done')).toBeVisible();
    });

    // Cleanup always runs
    test.afterAll(async ({ authenticatedPage }) => {
        if (!authenticatedPage) return;
        try {
            const { apiContext } = await createApiContext(authenticatedPage);
            try {
                await api.files.deleteByPattern(apiContext, new RegExp(TEST_PREFIX));
            } finally {
                await apiContext.dispose();
            }
        } catch (error) {
            console.warn('[cleanup] Failed:', error.message);
        }
    });
});
```

**Benefits of independent tests:**

- If Test 1 fails, Test 2 and 3 still run
- Each test starts from a clean page state
- Tests can run in any order
- Failures are isolated and easier to debug

### Alternative: Serial Mode (AVOID — only for multi-step wizards)

**DO NOT use serial mode for data sharing between tests.** Use `beforeAll` instead (see above).

Serial mode is only appropriate for true multi-step flows where each test is literally a step in a wizard and the browser state must carry over between tests.

**WARNING: Serial mode causes THREE problems in CI:**

1. **Cascade failures**: If ANY test fails, ALL subsequent tests are SKIPPED
2. **Retry destroys data**: On retry, Playwright retries the ENTIRE block. But `afterAll` already ran and cleaned up test data. New `Date.now()` generates a different ID, so the old data is gone.
3. **Flakiness**: Tests that pass locally become flaky in CI because timing differences cause one test to fail, which cascades to skip all others

```javascript
// ONLY use for true multi-step wizard flows (NOT for data sharing)
test.describe('Multi-Step Wizard', () => {
    test.describe.configure({ mode: 'serial' });

    test('Step 1: Enter details', async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/wizard');
        // If this fails, Step 2 and 3 are SKIPPED
    });

    test('Step 2: Review', async ({ authenticatedPage }) => {
        // Continues from Step 1 - no navigation
    });

    test('Step 3: Submit', async ({ authenticatedPage }) => {
        // Continues from Step 2 - no navigation
    });

    test.afterAll(async ({ authenticatedPage }) => {
        if (!authenticatedPage) return;
        try {
            const { apiContext } = await createApiContext(authenticatedPage);
            try {
                await api.files.deleteByPattern(apiContext, new RegExp(TEST_PREFIX));
            } finally {
                await apiContext.dispose();
            }
        } catch (error) {
            console.warn('[cleanup] Failed:', error.message);
        }
    });
});
```

## CRITICAL: API Helper Usage

**Use the `api` helper module for all API operations. See `helpers/api.js` for full documentation.**

### Available APIs

```javascript
import api, { createApiContext } from '../../../helpers/api.js';

// Files API
await api.files.list(apiContext);
await api.files.upload(apiContext, 'name.pdf', buffer, 'application/pdf');
await api.files.uploadFromFixtures(apiContext, 'dummy.pdf', 'test-file.pdf');
await api.files.uploadWithMetadata(apiContext, 'qti-item-example.zip', 'test.zip', 'qti-item'); // Upload with document type
await api.files.uploadWithMetadata(apiContext, 'qti-item-example.zip', 'test.zip', 'qti-item', {
    categoryId: ['tagId1', 'tagId2']
}); // Upload with document type and tags
await api.files.update(apiContext, fileId, { documentTypeId: 'qti-item' }); // Update file metadata
await api.files.delete(apiContext, fileId);
await api.files.deleteByPattern(apiContext, /e2e-/); // Use partial match, NOT exact match!

// Templates API (Custom Filters)
await api.templates.list(apiContext);
await api.templates.create(apiContext, { name: 'Test Filter' });
await api.templates.delete(apiContext, templateId);
await api.templates.deleteByPattern(apiContext, /^e2e-/);

// Tag Categories API (e.g., "Subject", "Grade Level")
// THREE types of categories - use the appropriate helper:
//
// 1. LIST: Predefined tag values users select from (e.g., "Subject" → Math, Science)
// 2. OPEN VALUE: Free-form values with data type (text, number, boolean, date)
// 3. HIERARCHICAL: Nested tags with parent-child relationships (e.g., Location → USA → California)

await api.tagCategories.list(apiContext);

// LIST category - predefined tag values (most common for document tagging)
const result = await api.tagCategories.createListCategoryWithTags(apiContext, {
    name: 'Subject', // Category name
    tagValues: ['Math', 'Science'], // Tag values to create
    source: 'admin' // Optional: 'system', 'user', 'ai', 'company', 'admin'
});
const categoryId = result.category.id; // Use this ID for document type assignment

// OPEN VALUE category - free-form user input
const openCategory = await api.tagCategories.createOpenValueCategory(apiContext, {
    name: 'Custom Field',
    openDataType: 'text', // Required: 'text', 'number', 'boolean', 'date'
    source: 'admin'
});

// HIERARCHICAL category - nested tags
const hierarchicalResult = await api.tagCategories.createHierarchicalCategory(apiContext, {
    name: 'Location',
    firstLevelTags: ['USA', 'UK'], // Optional first-level tags
    selectChildren: false, // Auto-select children when parent selected
    source: 'admin'
});

await api.tagCategories.delete(apiContext, categoryId);
await api.tagCategories.deleteByPattern(apiContext, /^e2e-/);

// Tags API (values within tag categories)
// IMPORTANT: category field must be category ID (UUID), NOT name
await api.tags.list(apiContext, { categories: 'Subject' }); // Filter by category name
await api.tags.create(apiContext, {
    name: 'Math', // Tag name
    category: categoryId, // MUST be category ID (UUID), NOT name
    source: 'user'
});
await api.tags.delete(apiContext, tagId);
await api.tags.deleteByPattern(apiContext, /^e2e-/, 'categoryName'); // Optional: filter by category

// Document Types API
await api.documentTypes.list(apiContext);
await api.documentTypes.getById(apiContext, 'qti-item');

// Document Type Categories API (assign tag categories to document types)
// IMPORTANT: The 'category' field must be category ID (UUID), NOT name
await api.documentTypeCategories.list(apiContext);
await api.documentTypeCategories.addCategory(apiContext, 'qti-item', categoryId, false); // categoryId, mandatory
await api.documentTypeCategories.removeCategory(apiContext, 'qti-item', categoryId); // Use ID, not name
await api.documentTypeCategories.removeCategory(apiContext, 'qti-item', 'Subject');

// Projects API
await api.projects.list(apiContext);
await api.projects.delete(apiContext, projectId);
await api.projects.deleteByPattern(apiContext, /^e2e-/);
```

### CRITICAL: Add Missing APIs First

**If a BDD scenario requires API setup that doesn't exist in api.js:**

1. **STOP** - Do not proceed with test generation
2. **Read backend router** - Check `backend/src/routers/*.router.js` for the API contract
3. **Add API method to api.js** - Follow existing patterns in the file
4. **Test the API** - Run a simple test to verify the API works
5. **THEN continue** - Generate the test using the new API method

This ensures tests are complete and maintainable. Never skip API setup steps or use browser workarounds.

### API Contract Reference

**Before adding new API helpers, read the backend routers for swagger documentation:**

```text
components/tao-neo-studio/backend/src/routers/
├── files.router.js                    # /api/v1/files
├── tagTemplates.router.js             # /api/v1/tag-templates (Custom Filters)
├── tagCategories.router.js            # /api/v1/tag-categories
├── tags.router.js                     # /api/v1/tags
├── documentTypes.router.js            # /api/v1/document-types
├── documentTypeCategories.router.js   # /api/v1/document-type-categories
├── projects.router.js                 # /api/v1/projects
└── ...
```

### Environment Variables

The API helper uses these environment variables:

| Variable              | Description                                                  | Local                                  | DEV                                          |
| --------------------- | ------------------------------------------------------------ | -------------------------------------- | -------------------------------------------- |
| `PLAYWRIGHT_BASE_URL` | Frontend URL                                                 | `https://frontend.tao-neo-studio.test` | `https://tao-neo-studio.taotesting.info`     |
| `API_BASE_URL`        | Backend API URL (optional, derived from frontend if not set) | `https://backend.tao-neo-studio.test`  | `https://tao-neo-studio-api.taotesting.info` |

The API base URL is determined by:

1. Use `API_BASE_URL` if explicitly set
2. Otherwise derive from `PLAYWRIGHT_BASE_URL` by replacing "frontend" with "backend"

## CRITICAL: MCP Browser Exploration (Reference)

**This section summarizes Step 3. See Step 3 above for the full MCP exploration procedure with tool examples.**

### Key Discovery Technique

The most effective way to discover all testable elements on a page:

```javascript
// Run this via playwright_evaluate to get ALL data-testid attributes
Array.from(document.querySelectorAll('[data-testid]')).map(el => ({
    testid: el.dataset.testid,
    tag: el.tagName,
    text: el.textContent?.substring(0, 80)
}));
```

This gives you every `data-testid` on the page, which are your primary selectors.

### What to Look For

- `data-testid="..."` - **USE THESE FIRST** (e.g., `getByTestId('browse-document-button')`)
- Element structure (is checkbox inside a row? what's the row selector?)
- Unique text or aria-labels for fallback selectors
- Dialog/menu patterns for confirmation flows

### Common Mistakes to Avoid

```javascript
// BAD: Guessing selectors without exploring
await page.getByRole('button', { name: /Browse Document/i }).click(); // May match 2+ elements!

// GOOD: Using data-testid found via MCP snapshot
await page.getByTestId('browse-document-button').click();

// BAD: Role selector without exact match for dynamic content
await page.getByRole('button', { name: fileName }).click(); // Matches multiple buttons!

// GOOD: Use exact: true for dynamic file names (matches filename link, not context menu)
await page.getByRole('button', { name: fileName, exact: true }).click();

// BAD: Assuming table structure
await page.locator('tbody input[type="checkbox"]').click(); // May not exist!

// GOOD: Using checkbox with aria-label pattern
await page.getByRole('checkbox', { name: /Select{fileName}/ }).click();
```

## CRITICAL: Smoke Tests Only

**E2E tests should be SMOKE TESTS that verify main functionality works.**

### What to Test

- Main user flows (create, view, edit, delete)
- Navigation works correctly
- Key UI elements are visible and functional

### What NOT to Test

- Edge cases (those belong in unit tests)
- Cleanup/restore behavior (cleanup is in afterAll, not a test)
- Case sensitivity, sorting variations (unit test territory)
- Validation scenarios (unit test territory)

## CRITICAL: Selector Strategy

### Priority Order (STRICT)

1. **`getByTestId()`** - MANDATORY first choice. Find test IDs via MCP snapshot.
2. **`getByRole()` with exact match** - Only if no testid AND you verified it's unique
3. **`getByPlaceholder()`** - For form inputs without testid
4. **`locator()` with testid** - For complex queries: `locator('[data-testid="row"]').filter(...)`
5. **CSS selectors** - LAST RESORT, must be verified via MCP

### NEVER Guess Selectors

```javascript
// BAD: Guessing without MCP exploration
await page.getByRole('button', { name: /Browse/i }).click(); // Strict mode violation!
await page.locator('tbody input[type="checkbox"]').click(); // May not exist!

// GOOD: Using selectors discovered via MCP snapshot
await page.getByTestId('browse-document-button').click();
await page.getByTestId('file-select-checkbox').first().click();
```

### CRITICAL: Handle Potential Duplicate Elements

**When asserting file names or other user-created content, ALWAYS use `.first()` to avoid strict mode violations.**

Even with proper cleanup in `afterAll`:

- Previous test runs may have crashed before cleanup executed
- Parallel test execution may create duplicates before cleanup runs
- Other test files may use the same fixture file names
- Network/backend issues may cause uploads to duplicate

```javascript
// BAD: Strict mode violation if multiple files with same name exist
await expect(page.getByRole('button', { name: 'uploaded-file.pdf', exact: true })).toBeVisible();
// Error: strict mode violation - resolved to 2 elements

// GOOD: Use .first() for file name buttons that may have duplicates
await expect(page.getByRole('button', { name: 'uploaded-file.pdf', exact: true }).first()).toBeVisible();

// BAD: Without .first(), clicking on file name fails with duplicates
await page.getByRole('button', { name: 'qti-item-example.zip', exact: true }).click();

// GOOD: Click first matching element
await page.getByRole('button', { name: 'qti-item-example.zip', exact: true }).first().click();
```

**When to use `.first()`:**

- File name buttons in content library tables
- Project names in project lists
- Any user-created content that uses fixture file names
- Elements that may persist from previous failed test runs

**When NOT to use `.first()`:**

- Unique UI elements (headings, dialogs, single buttons)
- Elements with unique test IDs
- Options in dropdowns (these should be unique within the dropdown)

### Verified Content Library Selectors (discovered via MCP 2026-02)

```javascript
// Page heading
await expect(page.getByRole('heading', { name: 'Content Library' })).toBeVisible();

// File upload button
await page.getByTestId('browse-document-button').click();
const fileInput = page.locator('input[type="file"]');
await fileInput.setInputFiles(filePath);

// Quick search input
await page.getByTestId('search-input').fill('search term');
await page.getByTestId('search-input').press('Enter');

// Selection count indicator
await expect(page.getByTestId('selected-count')).toHaveText('0 document selected');

// Actions dropdown (bulk actions)
await page.getByTestId('bulk-actions-dropdown').click();
// Menu items are role="option" not menuitem
await page.getByRole('option', { name: 'Delete' }).click();

// File checkbox - aria-label format is "Select{fileName}" (no space)
await page.getByRole('checkbox', { name: new RegExp(`Select.*${fileName}`) }).click();

// Wait for file in table - use .first() to handle potential duplicates from previous runs
// Even with cleanup, duplicate files may exist from crashed test runs or parallel execution
await expect(page.getByRole('button', { name: fileName, exact: true }).first()).toBeVisible();

// Confirmation dialog
const dialog = page.getByRole('alertdialog');
await dialog.getByRole('button', { name: /delete|confirm|yes/i }).click();
```

## Test Data Naming

**ALWAYS prefix test data with `e2e-` for automatic cleanup:**

```javascript
const TEST_PREFIX = 'e2e-feature';
const itemName = `${TEST_PREFIX}-item-${Date.now()}`;
```

## IMPORTANT: Use Small Files for API Uploads

**DEV environment has strict timeout limits for file uploads. Use the smallest possible fixture files for API-based uploads:**

```javascript
// GOOD: Small file (43 bytes) - fast upload
const TEST_FILE = 'dummy.txt';
await api.files.uploadFromFixtures(apiContext, 'dummy.txt', 'test-file.txt');

// BAD: Large file - may timeout on DEV (504 error)
const TEST_FILE = 'qti-item-example.zip'; // 38KB - too large for reliable API upload
```

**For browser-based uploads (When statements), any file size works because they go through the same-origin path.**

## Available Fixtures

```javascript
// Worker-scoped auth (shared across tests in same worker) - USE THIS
test('example', async ({ authenticatedPage }) => { ... });

// API context for setup/cleanup (uses same session) - USE THIS
test('example', async ({ apiContext }) => { ... });

// Fresh page for isolation (rarely needed)
test('needs isolation', async ({ freshPage }) => { ... });
```

## NO Retry Logic or Fallbacks

**DO NOT use retry loops or fallback patterns. Fix the underlying issue instead.**

```javascript
// BAD: Retry loops
for (let i = 0; i < 3; i++) { try { ... } catch { ... } }

// BAD: Browser fallback when API fails
const result = await api.files.upload(...);
if (!result) {
    // Fallback to browser upload - DO NOT DO THIS
    await uploadViaBrowser(page, file);
}

// GOOD: Let API failures fail the test (API needs fixing, not workaround)
await api.files.uploadFromFixtures(apiContext, 'dummy.pdf', testFileName);
// If API fails, test fails → investigate and fix API issue

// GOOD: Use proper timeouts for UI elements
await expect(page.getByRole('heading')).toBeVisible({ timeout: 10000 });
```

**Why no fallbacks?** If API fails but browser works, the API code is broken and needs fixing. Fallbacks mask bugs.

## File Naming

- Test files: `{feature-name}.spec.js`
- Test data prefix: `e2e-`
- Test names: Start with "should" + expected behavior

## CRITICAL: Test Verification (MANDATORY)

**DO NOT finish until tests pass on ALL 3 browsers. You MUST run tests and verify the output.**

### How To Run Tests

Run from the `frontend` directory using the Shell tool:

```bash
cd components/tao-neo-studio/frontend

# Phase 1: Run modified spec on ALL browsers (local)
npx cross-env E2E_ENV=local NODE_TLS_REJECT_UNAUTHORIZED=0 PLAYWRIGHT_RETRIES=0 npx playwright test e2e-tests/tests/<path>.spec.js

# Phase 1: Run modified spec on ALL browsers (DEV)
npx cross-env E2E_ENV=dev SKIP_ENV_LOCAL=true PLAYWRIGHT_RETRIES=0 npx playwright test e2e-tests/tests/<path>.spec.js

# Phase 2: Run full suite on ALL browsers (local)
npm run test:e2e:all -- --retries=0

# Phase 2: Run full suite on ALL browsers (DEV)
npm run test:e2e:all:dev -- --retries=0
```

**IMPORTANT: The working directory MUST be `frontend/`, NOT `e2e-tests/`.** The npm scripts are defined in `frontend/package.json`.

**Use `test:e2e:local` by default when developing.** Use `test:e2e:dev` only when testing against the deployed DEV environment.

### Fix-and-Retry Loop (MUST FOLLOW)

1. **Run the modified spec on all 3 browsers** (Phase 1 command above)
2. **Check the output** - look for the E2E TEST SUMMARY at the end showing per-browser results
3. **If any test fails on any browser:**
   a. Read the error message (e.g., "strict mode violation", "timeout", "element not found")
   b. If a screenshot was saved, READ IT to see what the page looked like at failure
   c. Use MCP browser tools to re-explore the problematic element
   d. Fix the selector in the test code
   e. **Re-run on the failing browser first**: add `--project=firefox`
   f. **Then re-run on all 3 browsers** (without `--project`) to confirm no regressions
   g. **Repeat** until ALL tests pass on ALL browsers
4. **Run the full suite** (Phase 2) to verify no regressions
5. **Only then** you are done

### Common Test Failures and Fixes

| Error                                           | Cause                                   | Fix                                                                                                               |
| ----------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `strict mode violation: resolved to N elements` | Selector matches multiple elements      | Use `getByTestId()`, add `.first()`, or make regex more specific (e.g., `/^QTI Item \(/` instead of `/QTI Item/`) |
| `Timeout waiting for locator`                   | Element doesn't exist or wrong selector | Re-explore with MCP, verify element exists                                                                        |
| `Element not visible`                           | Element hidden or loading               | Add wait: `await expect(el).toBeVisible()` before click                                                           |
| `Element detached`                              | Page navigated/re-rendered              | Re-query element after navigation                                                                                 |

### CRITICAL: CI Reliability (Avoid Flaky Tests)

**On CI, each browser runs in a separate container with only its own binaries installed, so browser projects have no dependencies. Locally, all 3 browsers run in the same process with up to 4 workers. CI uses 1 worker per shard; local uses up to 4. Tests MUST be resilient to timing variations and must NOT assume any specific browser execution order.**

#### Rule 1: NEVER use `waitForTimeout()` — Use Explicit Assertions Instead

```javascript
// BAD: Fixed delay — works locally but flaky in CI
await authenticatedPage.waitForTimeout(2000);
await expect(authenticatedPage.getByText('file.pdf')).toBeVisible();

// GOOD: Wait for the actual condition
await expect(authenticatedPage.getByText('file.pdf')).toBeVisible({ timeout: 30000 });

// BAD: Fixed delay after search
await authenticatedPage.getByTestId('search-input').fill('test');
await authenticatedPage.getByTestId('search-input').press('Enter');
await authenticatedPage.waitForTimeout(2000);

// GOOD: Wait for search results to appear
await authenticatedPage.getByTestId('search-input').fill('test');
await authenticatedPage.getByTestId('search-input').press('Enter');
await expect(authenticatedPage.getByRole('button', { name: 'test-file.pdf', exact: true }).first()).toBeVisible({
    timeout: 30000
});

// GOOD: Wait for empty results (when expecting no matches)
await expect(authenticatedPage.locator('tbody tr')).toHaveCount(0, { timeout: 15000 });
```

#### Rule 2: Verify UI State After Clicks

```javascript
// BAD: Click checkbox and immediately proceed — CI may not register the click
await checkbox.click();
await nextCheckbox.click(); // May fail because first click wasn't registered

// GOOD: Verify checkbox is checked before proceeding
await checkbox.click();
await expect(checkbox).toBeChecked({ timeout: 5000 });
await nextCheckbox.click();
await expect(nextCheckbox).toBeChecked({ timeout: 5000 });

// BAD: Click button and assume dialog closed
await dialog.getByRole('button', { name: 'Save' }).click();

// GOOD: Verify dialog closed
await dialog.getByRole('button', { name: 'Save' }).click();
await expect(dialog).not.toBeVisible({ timeout: 5000 });
```

#### Rule 3: Wait for Page Stability After Navigation — NEVER use `networkidle`

**`waitForLoadState('networkidle')` is unreliable and MUST NOT be used.** The Playwright team officially recommends against it. It waits for zero active network connections, which hangs indefinitely on SPAs with WebSockets, SSE, polling, or analytics. Firefox and WebKit are especially affected because they handle network state tracking differently from Chromium.

**Instead, wait for a specific UI element that indicates the page is ready.**

```javascript
// BAD: Navigate and immediately interact
await authenticatedPage.goto('/portal/library/content-library');
await authenticatedPage.getByTestId('search-input').fill('test');

// BAD: waitForLoadState('networkidle') — hangs in Firefox/WebKit with persistent connections
await authenticatedPage.goto('/portal/library/content-library');
await authenticatedPage.waitForLoadState('networkidle'); // CAN HANG FOR 60+ SECONDS!
await expect(authenticatedPage.getByRole('heading', { name: 'Content Library' })).toBeVisible({ timeout: 30000 });

// GOOD: Wait for a specific element that proves the page rendered
await authenticatedPage.goto('/portal/library/content-library');
await expect(authenticatedPage.getByRole('heading', { name: 'Content Library' })).toBeVisible({ timeout: 30000 });
await authenticatedPage.getByTestId('search-input').fill('test');

// GOOD: After reload, wait for content element instead of networkidle
await authenticatedPage.reload();
await expect(authenticatedPage.getByRole('heading', { name: 'Page Title' })).toBeVisible({ timeout: 30000 });
```

**The heading/element assertion IS the stability check** — it auto-retries until the element appears, which is more reliable than waiting for network silence.

#### Rule 4: Use Generous Timeouts for API-Uploaded Data

Files uploaded via API may take time to appear in the UI, especially in CI:

```javascript
// BAD: Short timeout for API-uploaded files
await expect(authenticatedPage.getByRole('button', { name: fileName })).toBeVisible(); // 5s default

// GOOD: Generous timeout — CI may need 15-30s for API data to appear
await expect(authenticatedPage.getByRole('button', { name: fileName, exact: true }).first()).toBeVisible({
    timeout: 30000
});
```

#### Rule 5: Verify Element Visibility Before Interaction

```javascript
// BAD: Click immediately — element may still be loading
await authenticatedPage.getByTestId('actions-dropdown').click();

// GOOD: Ensure element is ready before clicking
const actionsButton = authenticatedPage.getByTestId('actions-dropdown');
await expect(actionsButton).toBeVisible({ timeout: 10000 });
await actionsButton.click();
```

#### Rule 6: Wait for Delete/Action Confirmation

```javascript
// BAD: Fixed timeout after delete
await dialog.getByRole('button', { name: /delete/i }).click();
await authenticatedPage.waitForTimeout(2000);

// GOOD: Wait for element to disappear
await dialog.getByRole('button', { name: /delete/i }).click();
await expect(authenticatedPage.getByRole('button', { name: fileName, exact: true }).first()).not.toBeVisible({
    timeout: 15000
});
```

#### Rule 7: NEVER Use Escape to Close Dropdowns Inside Dialogs

**Pressing Escape in a nested context (dropdown inside a dialog) may close the parent dialog instead of the dropdown.**

```javascript
// BAD: Escape closes the DIALOG, not the dropdown
await dialog.getByRole('button', { name: 'Select categories...' }).click();
const listbox = authenticatedPage.getByRole('listbox');
await listbox.getByRole('option', { name: 'Subject' }).click();
await authenticatedPage.keyboard.press('Escape'); // CLOSES DIALOG!

// GOOD: Click on the dialog heading to close the dropdown without affecting the dialog
await dialog.getByRole('button', { name: 'Select categories...' }).click();
const listbox = authenticatedPage.getByRole('listbox');
await listbox.getByRole('option', { name: 'Subject' }).click();
await dialog.getByRole('heading').first().click(); // Closes dropdown, dialog stays open
await expect(listbox).not.toBeVisible({ timeout: 5000 });
```

**Why this happens:** When a dropdown auto-closes after selection (single-select), the Escape key targets the next focusable parent — the dialog. For multi-select dropdowns (`aria-multiselectable="true"`), they stay open after selection, so Escape closes the dropdown. But since behavior varies, always use a click-based approach.

#### Rule 8: Understand Multi-Select vs Single-Select Comboboxes

**Check `aria-multiselectable` before writing dropdown interaction code.**

```javascript
// Multi-select combobox: options toggle on/off, dropdown stays open
// - Shows "N selected" when multiple are chosen
// - Must explicitly close (click elsewhere)
// - Cannot save form with 0 selections (validation)
await categoryCombobox.click();
await options.nth(0).click(); // Toggles on
await options.nth(1).click(); // Toggles on (dropdown stays open)
await dialog.getByRole('heading').first().click(); // Must explicitly close

// Single-select combobox: selecting an option replaces previous and may auto-close
await categoryCombobox.click();
await authenticatedPage.getByRole('option', { name: 'Subject' }).click(); // Selects and may close
```

#### Rule 9: Avoid Save→Modify→Save Patterns for Form Dirty State

**Some forms only detect "dirty" state from the initial loaded state, not from a previously saved state. Avoid patterns like save→modify→save in the same test.**

```javascript
// FRAGILE: Save with 2 items, then remove 1 and save again — Save button may stay disabled
await selectItem1();
await selectItem2();
await saveButton.click(); // Save succeeds
await removeItem1(); // Modify after save
await saveButton.click(); // Button may be disabled — form doesn't detect change from saved state!

// ROBUST: Make all changes before the first save
await selectItem1();
await selectItem2();
await removeItem1(); // All changes happen before first save
await saveButton.click(); // Save with final state — works reliably
```

#### Rule 10: Ensure Clean State Per Test When Modifying Shared Resources

**When tests modify shared backend state (e.g., document type categories, project settings), each test MUST reset to a known state via API before running.** Don't rely on previous tests leaving data in a specific state.

```javascript
// BAD: Test 2 assumes Test 1 cleaned up correctly
test('should add and remove item', async ({ authenticatedPage }) => {
    // Adds item to shared resource, then removes it
    // If this test fails mid-way, item stays added
});

test('should toggle item property', async ({ authenticatedPage }) => {
    // Assumes item is NOT added — breaks if previous test failed
    await openDialog(authenticatedPage);
    // ... adds item and toggles property
});

// GOOD: Each test ensures its own clean state via API
async function ensureCleanState(page) {
    const { apiContext } = await createApiContext(page);
    try {
        if (createdItemId) {
            await ensureItemUnassigned(apiContext, createdItemId);
        }
    } finally {
        await apiContext.dispose();
    }
}

test('should add and remove item', async ({ authenticatedPage }) => {
    await ensureCleanState(authenticatedPage); // Always start clean
    // ... test logic
});

test('should toggle item property', async ({ authenticatedPage }) => {
    await ensureCleanState(authenticatedPage); // Always start clean
    // ... test logic — works regardless of what Test 1 did
});
```

#### Rule 11: Use Unique Test Data Names Per Run

**Test data names MUST include `Date.now()` to avoid collisions with leftovers from previous runs or parallel browser execution.**

```javascript
// BAD: Static name — collides with leftovers from previous failed runs
const TEST_CATEGORY_NAME = `${TEST_PREFIX}-Subject`;

// GOOD: Unique per run — each run has its own data
const UNIQUE_ID = Date.now();
const TEST_CATEGORY_NAME = `${TEST_PREFIX}-Subject-${UNIQUE_ID}`;
```

**Also use broad pattern-based cleanup in beforeAll/afterAll to catch leftovers from ALL runs:**

```javascript
// Clean up ALL test categories (from any previous run)
await removeAllTestItemsFromResource(apiContext); // Pattern-based removal
await api.tagCategories.deleteByPattern(apiContext, new RegExp(TEST_PREFIX));
```

#### Rule 12: Use Quick Search When Navigating to Content Library Files

**Files uploaded via API may not appear on the first page of the Content Library due to pagination or caching. Use the quick search input to filter by test prefix, ensuring test files are always visible.**

```javascript
// BAD: Assume file is on first page
await page.goto('/portal/library/content-library');
await expect(page.getByRole('heading', { name: 'Content Library' })).toBeVisible({ timeout: 30000 });
await expect(page.getByRole('button', { name: fileName, exact: true })).toBeVisible({ timeout: 30000 });

// GOOD: Use quick search to filter by test prefix — handles pagination
await page.goto('/portal/library/content-library');
await expect(page.getByRole('heading', { name: 'Content Library' })).toBeVisible({ timeout: 30000 });
const searchInput = page.getByTestId('search-input');
await searchInput.fill(TEST_PREFIX);
await searchInput.press('Enter');
await expect(page.getByRole('button', { name: fileName, exact: true })).toBeVisible({ timeout: 30000 });
```

**Create a reusable helper function:**

```javascript
async function navigateAndWaitForFiles(page, fileNames) {
    await page.goto('/portal/library/content-library');
    await expect(page.getByRole('heading', { name: 'Content Library' })).toBeVisible({ timeout: 30000 });
    const searchInput = page.getByTestId('search-input');
    await searchInput.fill(TEST_PREFIX);
    await searchInput.press('Enter');
    for (const fileName of fileNames) {
        await expect(page.getByRole('button', { name: fileName, exact: true })).toBeVisible({ timeout: 30000 });
    }
}
```

#### Rule 13: Wait for Buttons to Be Enabled, Not Just Visible

**Buttons that depend on prerequisites (like form completion) start disabled. Use `toBeEnabled()` instead of `toBeVisible()` before clicking.**

```javascript
// BAD: Button is visible but disabled — click waits for actionability timeout
const submitBtn = page.getByRole('button', { name: 'Submit' });
await expect(submitBtn).toBeVisible({ timeout: 10000 });
await submitBtn.click(); // Timeout! Button is visible but disabled

// GOOD: Wait for button to be enabled (prerequisites completed)
const submitBtn = page.getByRole('button', { name: 'Submit' });
await expect(submitBtn).toBeEnabled({ timeout: 30000 });
await submitBtn.click();
```

#### Rule 14: Extend beforeAll Timeout for Heavy API Setup

**When `beforeAll` does many API calls (create categories, upload files, wait for indexing), extend its timeout to prevent flakiness under CI load.**

```javascript
test.beforeAll(async ({ authenticatedPage, apiContext }) => {
    // Extend timeout for heavy API setup (category + 3 file uploads + indexing)
    // especially under CI load with 3 browsers hitting the backend concurrently
    test.setTimeout(180000);
    try {
        await api.tagCategories.createListCategoryWithTags(apiContext, { ... });
        await api.files.uploadFromFixtures(apiContext, ...);
        await api.files.uploadFromFixtures(apiContext, ...);
        await api.files.uploadFromFixtures(apiContext, ...);
        await api.files.waitForFile(apiContext, ...);
        setupComplete = true;
    } catch (error) {
        console.error(`[setup] beforeAll failed: ${error.message}`);
        setupComplete = false;
    }
});
```

#### Rule 15: Wrap beforeAll in try-catch for Graceful Degradation

**If `beforeAll` throws, Playwright fails the entire suite. Wrap API setup in try-catch so tests skip instead.**

```javascript
// BAD: Uncaught error in beforeAll crashes all tests
test.beforeAll(async ({ apiContext }) => {
    await api.files.uploadFromFixtures(apiContext, 'dummy.pdf', testFileName); // ECONNRESET = all tests fail
    setupComplete = true;
});

// GOOD: try-catch lets tests skip gracefully
test.beforeAll(async ({ apiContext }) => {
    try {
        await api.files.uploadFromFixtures(apiContext, 'dummy.pdf', testFileName);
        setupComplete = true;
    } catch (error) {
        console.error(`[setup] beforeAll failed: ${error.message}`);
        setupComplete = false;
    }
});

test('should do something', async ({ authenticatedPage }) => {
    test.skip(!setupComplete, 'Setup failed'); // Skips instead of erroring
    // ... test logic
});
```

#### Rule 16: Poll with Page Refresh for Async Backend Processing

**For features that depend on async backend processing (AI tags, summary generation), don't use a single long wait. Poll with page refresh.**

```javascript
// BAD: Single long wait — if backend hasn't processed yet, entire timeout is wasted
await expect(aiTagBadge).toBeVisible({ timeout: 120000 }); // Waits 2 min then fails

// GOOD: Poll with page refresh to pick up async results
const deadline = Date.now() + 90000;
let found = false;
while (Date.now() < deadline) {
    if (
        await aiTagBadge
            .first()
            .isVisible({ timeout: 3000 })
            .catch(() => false)
    ) {
        found = true;
        break;
    }
    // Close dialog, refresh page, reopen to get fresh data
    await authenticatedPage.keyboard.press('Escape');
    await authenticatedPage.waitForTimeout(15000);
    await authenticatedPage.reload();
    // Re-navigate to the element and check again
}
if (!found) {
    test.skip(true, 'Backend processing timed out');
}
```

### CRITICAL: Cross-Browser Reliability (Firefox & WebKit)

**Tests run across Chromium, Firefox, and WebKit. On CI, each browser runs in its own container. Locally, all browsers share workers. Firefox and WebKit have different rendering engines and timing characteristics that cause flakiness.**

#### Known Firefox/WebKit Differences

| Issue                             | Chromium      | Firefox/WebKit                                   | Impact                              |
| --------------------------------- | ------------- | ------------------------------------------------ | ----------------------------------- |
| `waitForLoadState('networkidle')` | Usually works | **Frequently hangs** with persistent connections | Tests timeout at 60s                |
| UI re-render after delete/update  | Fast (~100ms) | Slower (~500-2000ms)                             | `not.toBeVisible()` assertions fail |
| Dialog content rendering          | Immediate     | Can take 1-3s after dialog opens                 | Element assertions fail             |
| Click registration                | Reliable      | Occasionally needs element to be in viewport     | Actions don't trigger               |
| Frontend state caching            | Less frequent | Stale data shown after close/reopen dialogs      | Assertion mismatches                |

#### Rules for Cross-Browser Tests

1. **NEVER use `waitForLoadState('networkidle')`** — see Rule 3 above
2. **Use generous timeouts for `not.toBeVisible()` assertions** — at least 15000ms, prefer 30000ms for delete operations
3. **Wait for dialog content, not just dialog visibility** — dialogs may open with empty content in Firefox/WebKit. Wait for a SPECIFIC element inside the dialog. If dialog content varies by state, use `.or()` to handle multiple states.
4. **After `reload()`, wait for a specific element** — never rely on `networkidle` after reload
5. **Use `scrollIntoViewIfNeeded()` or `evaluate(() => window.scrollTo())` before clicking elements below the fold** — WebKit may not click off-screen elements
6. **Wait for API saves before closing dialogs** — When a UI action triggers an API call (like toggling a checkbox or adding an item), use `waitForResponse()` to ensure the save completes before closing the dialog. Frontend may cancel in-flight requests on dialog close.
7. **Navigate fresh before verifying persisted state** — When testing that a change persisted (close dialog → reopen → verify), do a full page navigation between close and reopen. Frontend state management may cache stale data.
8. **Verify deletions via fresh navigation, not inline assertions** — After deleting an item within a dialog, the UI may not reactively remove it in Firefox/WebKit. Close the dialog, navigate to a fresh page, reopen the dialog, and verify the item is gone.

```javascript
// BAD: Dialog open but content may not be rendered in Firefox
const dialog = page.getByRole('dialog');
await expect(dialog).toBeVisible({ timeout: 10000 });
await dialog.getByRole('button', { name: 'Action' }).click(); // May fail in Firefox

// GOOD: Wait for specific content inside dialog
const dialog = page.getByRole('dialog');
await expect(dialog).toBeVisible({ timeout: 10000 });
await expect(dialog.getByRole('button', { name: 'Action' })).toBeVisible({ timeout: 10000 });
await dialog.getByRole('button', { name: 'Action' }).click();

// GOOD: Wait for dialog content that varies by state
const dropdownBtn = dialog.getByRole('button', { name: 'Select items...' });
const noMoreMsg = dialog.getByText('No more items available.');
await expect(dropdownBtn.or(noMoreMsg)).toBeVisible({ timeout: 30000 });

// BAD: Tight timeout for delete confirmation
await expect(element).not.toBeVisible({ timeout: 5000 }); // Too short for Firefox/WebKit

// GOOD: Generous timeout accounts for slower re-renders
await expect(element).not.toBeVisible({ timeout: 15000 });

// BAD: Close dialog immediately after toggling checkbox — API save may not complete
await mandatoryCheckbox.click();
await expect(mandatoryCheckbox).toBeChecked({ timeout: 5000 });
await dialog.getByRole('button', { name: 'Close' }).click();

// GOOD: Wait for the API save to complete before closing
const savePromise = page.waitForResponse(response => response.request().method() === 'PUT' && response.ok());
await mandatoryCheckbox.click();
await expect(mandatoryCheckbox).toBeChecked({ timeout: 5000 });
await savePromise; // Ensure save reached the server
await dialog.getByRole('button', { name: 'Close' }).click();

// BAD: Close dialog and immediately reopen to verify persisted state
await dialog.getByRole('button', { name: 'Close' }).click();
await expect(dialog).not.toBeVisible({ timeout: 5000 });
const dialog2 = await openEditDialog(page, itemName); // May show stale data

// GOOD: Navigate fresh before reopening to force fresh data
await dialog.getByRole('button', { name: 'Close' }).click();
await expect(dialog).not.toBeVisible({ timeout: 5000 });
await navigateToPage(page); // Full page navigation forces fresh data
const dialog2 = await openEditDialog(page, itemName); // Gets fresh data from server
```

### CRITICAL: Timeouts

**Always use generous timeouts for all operations to ensure tests are reliable in all environments.**

**Timeout Guidelines:**

| Action                          | Timeout (ms) | Use For                                  |
| ------------------------------- | ------------ | ---------------------------------------- |
| Page heading visible            | 30000        | After `goto()`                           |
| Form inputs visible             | 60000        | Login forms, dialogs                     |
| Dialog appears                  | 10000-15000  | Modal dialogs (15000 for Firefox/WebKit) |
| Dialog content visible          | 10000-15000  | Buttons/inputs inside dialog             |
| Button becomes visible          | 5000-10000   | Dynamic buttons                          |
| File upload completes           | 30000        | File operations                          |
| Element disappears after delete | 15000-30000  | `not.toBeVisible()` assertions           |
| AI processing                   | 60000        | File quality generation                  |

```javascript
// BAD: Timeouts too short
await expect(page.getByRole('heading')).toBeVisible(); // Default 5s - may fail
await expect(emailInput).toBeVisible({ timeout: 5000 }); // Too short after redirect

// GOOD: Generous timeouts
await expect(page.getByRole('heading', { name: 'Content Library' })).toBeVisible({ timeout: 30000 });
await expect(emailInput).toBeVisible({ timeout: 60000 }); // After logout/redirect
```

**After logout/redirect, ALWAYS wait for the destination page to fully load:**

```javascript
// BAD: Only checks URL - may pass before page loads
await logoutButton.click();
const url = page.url();
expect(url.includes('login')).toBeTruthy(); // Page may still be loading!

// GOOD: Wait for actual content to appear
await logoutButton.click();
// Wait for login form to be visible (handles spinner/loading states)
await expect(emailInput).toBeVisible({ timeout: 60000 });
// Then verify URL
expect(page.url()).toContain('login');
```
