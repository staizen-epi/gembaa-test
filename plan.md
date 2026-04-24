---
name: AI-Driven E2E Test Strategy
overview: A comprehensive strategy for implementing AI-driven E2E testing using Playwright with API-based cleanup, CI workflow enforcement, and full migration of existing tests.
---

# AI-Driven E2E Test Strategy

## Core suggestions

### JavaScript is sufficient:

- Simpler for AI to generate (no type errors to debug)
- Faster execution (no transpilation)
- Playwright works identically with both

### Prompts

**Keep in `prompts/` (central location)**. Reasons:

- Prompts are reusable across features
- Easy to find all prompts in one place
- Structure:

```
e2e-tests/prompts/
│   ├── generate-test.md        # How to generate code
```

### Workflow Enforcement - CI Check (Not Pre-commit)

**CI workflow that comments on PR but doesn't block merge:**

```yaml
# .github/workflows/bdd-check.yml
name: BDD Sync Check
```

**Benefits:**

- Doesn't block developers
- Creates visibility in PR
- Easy to ignore for small changes
- No local tooling required

# BDD Scenarios examples

```
## Scenario 1: Upload Single File
**Given** user is on library page
**When** user clicks Browse Document and selects dummy.docx
**Then** file appears in table with status "uploaded"

## Scenario 2: Upload Multiple Formats
**Given** user is on library page
**When** user uploads files: docx, pdf, jpg
**Then** all 3 files appear in table

```

### Use test.extend Fixtures

Login happens once per worker.

**Benefits:** Cleaner tests, automatic setup/teardown, worker-scope option.

### API-Based Cleanup Mechanism

**Approach: Call backend API endpoints directly for cleanup**

Available API endpoints discovered in backend:

- `DELETE /api/v1/files/:fileId` - Delete files
- `DELETE /api/v1/tag-categories/:id` - Delete tag categories
- `DELETE /api/v1/document-type-categories/:id` - Delete document type categories
- `POST /api/v1/files/list` - List files (to find IDs)
- `GET /api/v1/tag-categories/` - List categories (to find IDs)

**Usage in tests:**

```javascript
import { test, expect } from '@playwright/test';
import { getAuthToken, deleteFilesByPattern } from '../helpers/api.js';

let authToken;

test.beforeAll(async ({ request }) => {
    authToken = await getAuthToken(request);
});

test.afterAll(async ({ request }) => {
    // Clean up any dummy files created during test
    await deleteFilesByPattern(request, authToken, /^dummy\./);
});

test('upload test', async ({ page, request }) => {
    // ... upload file ...
    // Cleanup happens automatically in afterEach via API
});
```

**Benefits:**

- Faster than UI-based cleanup
- Works even if test fails mid-flow
- No need to track individual items
- Pattern-based cleanup catches everything
- Devs don't need to maintain factories - just use patterns

## Recommended Workflow

```
1. DEVELOPER/QA ADDS/UPDATES BDD
   Decides if BDD update needed
              |
              v
2. DEVELOPER OPENS PR with BDD
   Push changes to branch
              |
              v
3. Someone approves BDD PR
              |
              v
4. DEVELOPER IMPLEMENTS FEATURE
              |
              v
5. AI GENERATES/UPDATES TESTS
   Prompt: "@generate-test.md for library.bdd.md on local/dev environment"
   - AI uses MCP to explore UI
   - AI writes/updates .spec.js
   - AI runs test to verify
              |
              v
6. NIGHTLY CI RUNS ALL TESTS
   npm run test:e2e:dev (on dev environment)
   npm run test:e2e:local (on localhost for debugging)
```

---
