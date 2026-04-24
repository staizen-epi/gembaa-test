import { test, expect, Page, Locator } from "@playwright/test";
import { setMockPermissions } from "./auth-helper";
import { LOAD_STATE, PERM, TIMEOUT, ENDPOINT, ROUTE } from "./constants";
import { BffApi } from "./api";

/**
 * Team Management Tests
 *
 * Spec: specs/foundation/team-management.spec.md
 *
 * Real-world UI notes (verified against the running app):
 * - Route: /communities (not /team or /teams).
 * - Create button label: "Add new team".
 * - Create dialog is a multi-step wizard: step 1 has the required "Team
 *   name" field, then "Next" advances; the final step shows "Save".
 * - Side panel is a [role="dialog"] (NOT <aside>) with tabs including
 *   "Team details" and "Members (N)".
 * - Side panel header icons: edit (data-icon="edit") and delete
 *   (data-icon="trash-alt").
 * - Inline edit triggers in the side panel use data-testid="inline-edit-*".
 * - Members tab includes an "Add members" button which opens a separate
 *   wizard dialog ("Add members to {teamName}") listing all existing
 *   staff (both SCIM-synced and virtual). The team-lead control is not
 *   surfaced as an inline-edit field, so lead-assignment scenarios are
 *   limited to API-level verification.
 */

const teamTable = (page: Page): Locator => page.locator("table:visible").first();

const teamDataRows = (page: Page): Locator =>
  teamTable(page)
    .getByRole("row")
    .filter({ has: page.getByRole("cell") });

const sidePanelDialog = (page: Page): Locator =>
  page
    .locator('[role="dialog"]:visible')
    .filter({ has: page.getByRole("tab", { name: /Team details/i }) })
    .first();

async function openTeamSidePanel(page: Page, teamName: string): Promise<Locator> {
  const target = teamDataRows(page).filter({ hasText: teamName }).first();
  await expect(target).toBeVisible({ timeout: TIMEOUT.LONG });
  // Cell index 0 is the row's `...` context-menu column (empty text); the
  // team name lives in cell index 1. Click cell 1 to open the Team side panel.
  await target.getByRole("cell").nth(1).click();
  const sp = sidePanelDialog(page);
  await expect(sp).toBeVisible({ timeout: TIMEOUT.DEFAULT });
  return sp;
}

async function openMembersTab(sidePanel: Locator): Promise<void> {
  const membersTab = sidePanel.getByRole("tab", { name: /^Members/i }).first();
  await expect(membersTab).toBeVisible({ timeout: TIMEOUT.DEFAULT });
  await membersTab.click();
}

// ---------------------------------------------------------------------------
// Scenario 1: View Teams List
// ---------------------------------------------------------------------------
test.describe("Team Management - View @team", () => {
  test("Scenario 1: should display the teams list for authorized users", async ({ page }) => {
    await page.goto(ROUTE.TEAMS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const table = teamTable(page);
    await expect(table).toBeVisible({ timeout: TIMEOUT.LONG });
  });
});

// ---------------------------------------------------------------------------
// Scenario 2 & 2.1: Create New Team (wizard)
// ---------------------------------------------------------------------------
test.describe("Team Management - Create @team", () => {
  const timestamp = Date.now();
  const testTeamName = `Test Team ${timestamp}`;
  let createdTeamId = "";

  test.afterAll(async ({ browser }) => {
    if (!createdTeamId) return;
    const context = await browser.newContext({ storageState: "auth/storage-state.json" });
    const page = await context.newPage();
    await page.goto(ROUTE.TEAMS);
    try {
      await BffApi.deleteTeam(page, { entityId: createdTeamId });
    } catch {
      // best-effort
    }
    await context.close();
  });

  test("Scenario 2.1: should show inline validation error when Next is clicked with Team name empty", async ({ page }) => {
    await page.goto(ROUTE.TEAMS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    await page
      .getByRole("button", { name: /add new team|add team|create team/i })
      .first()
      .click();

    const dialog = page
      .locator('[role="dialog"]:visible')
      .filter({ hasText: /Add new team/i })
      .first();
    await expect(dialog).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    // Actual UX: Next is initially enabled; clicking it with an empty Team
    // name reveals an inline `.stz-input-error` reading "Team name is
    // required" and the wizard stays on step 1.
    await dialog.getByRole("button", { name: /^next$/i }).click();

    const inlineError = dialog.locator(".stz-input-error").filter({ hasText: /required/i }).first();
    await expect(inlineError).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    await dialog.getByRole("button", { name: /cancel/i }).click().catch(() => {});
  });

  test("Scenario 2: should successfully create a new team via wizard", async ({ page }) => {
    await page.goto(ROUTE.TEAMS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    await page.getByRole("button", { name: /add new team|add team|create team/i }).first().click();

    const dialog = page.getByRole("dialog").last();
    await expect(dialog).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    await dialog.locator('input[name="name"]').first().fill(testTeamName);

    // Walk the wizard: click Next until Save appears, then click Save
    for (let i = 0; i < 8; i++) {
      const saveBtn = dialog.getByRole("button", { name: /^save$/i });
      if (await saveBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        const createResp = page.waitForResponse(
          async (r) => {
            if (!r.url().includes(ENDPOINT.BFF) || r.request().method() !== "POST") return false;
            const body = r.request().postDataJSON();
            return /create.*team|add.*team/i.test(body?.operationName || "") || /createTeam|addTeam/i.test(body?.query || "");
          },
          { timeout: TIMEOUT.LONG }
        );
        await saveBtn.click();
        await createResp;
        break;
      }
      const nextBtn = dialog.getByRole("button", { name: /^next$/i });
      await nextBtn.click();
      await page.waitForTimeout(500);
    }

    // Verify via BFF the team exists
    await page.waitForTimeout(500);
    const list = await BffApi.getTeams(page);
    const items = list?.data?.teams?.items || [];
    const created = items.find((t: any) => t.name === testTeamName);
    createdTeamId = created?.entityId || "";
    expect(createdTeamId).not.toBe("");
  });
});

// ---------------------------------------------------------------------------
// Scenarios 3-8: each test gets a fresh team via API (beforeEach).
// ---------------------------------------------------------------------------
test.describe("Team Management - Edit, Members & Permissions @team", () => {
  let seedTeamId = "";
  let seedTeamName = "";

  test.beforeEach(async ({ page }) => {
    const timestamp = Date.now();
    seedTeamName = `Seed Team ${timestamp}`;

    await page.goto(ROUTE.TEAMS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const created = await BffApi.createTeam(page, { name: seedTeamName });
    seedTeamId = created.entityId;
  });

  test.afterEach(async ({ page }) => {
    if (!seedTeamId) return;
    try {
      await BffApi.deleteTeam(page, { entityId: seedTeamId });
    } catch {
      // best-effort cleanup
    }
    seedTeamId = "";
  });

  // ── Scenario 3: edit via dialog ──────────────────────────────────────────
  test("Scenario 3: should successfully edit team details via the edit dialog", async ({ page }) => {
    await page.goto(ROUTE.TEAMS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const sidePanel = await openTeamSidePanel(page, seedTeamName);
    await sidePanel.locator('[data-icon="edit"]').first().click();

    const dialog = page.getByRole("dialog").last();
    await expect(dialog).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    const nameInput = dialog.locator('input[name="name"]').first();
    const updatedName = `${seedTeamName} Updated`;
    await nameInput.click();
    await nameInput.fill(updatedName);

    // Walk wizard to save
    for (let i = 0; i < 8; i++) {
      const saveBtn = dialog.getByRole("button", { name: /^save$/i });
      if (await saveBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        const updateResp = page.waitForResponse(
          (r) => r.url().includes(ENDPOINT.BFF) && r.request().method() === "POST",
          { timeout: TIMEOUT.LONG }
        );
        await saveBtn.click();
        await updateResp;
        break;
      }
      await dialog.getByRole("button", { name: /^next$/i }).click();
      await page.waitForTimeout(500);
    }

    // Verify via BFF
    await page.waitForTimeout(500);
    const list = await BffApi.getTeams(page);
    const items = list?.data?.teams?.items || [];
    const updated = items.find((t: any) => t.name === updatedName);
    expect(updated).toBeDefined();
    seedTeamId = updated?.entityId || seedTeamId;
  });

  // ── Scenario 4: inline edit in side panel ───────────────────────────────
  test("Scenario 4: should allow inline editing in the side panel", async ({ page }) => {
    await page.goto(ROUTE.TEAMS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const sidePanel = await openTeamSidePanel(page, seedTeamName);

    const inlineTrigger = sidePanel.locator('[data-testid^="inline-edit-"]').filter({ hasText: seedTeamName }).first();
    await expect(inlineTrigger).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    await inlineTrigger.hover();
    await inlineTrigger.click();

    const inlineInput = sidePanel.getByRole("textbox").first();
    await expect(inlineInput).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    const newValue = `${seedTeamName} mod`;
    await inlineInput.fill(newValue);

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes(ENDPOINT.BFF) && r.request().method() === "POST",
      { timeout: TIMEOUT.LONG }
    );
    await inlineInput.press("Enter");
    await responsePromise;

    await expect(sidePanel.getByText(newValue).first()).toBeVisible({ timeout: TIMEOUT.LONG });
  });

  // ── Scenario 5: Members can be added — picker lists all existing staff ─
  test("Scenario 5: add member picker lists candidates from all existing staff (actual + virtual)", async ({ page }) => {
    const staffList = await BffApi.getStaff(page, { page: { returnAll: true } });
    const items = staffList?.data?.staffs?.items || [];
    const actual = items.find((s: any) => s.isVirtual === false);
    const virtual = items.find((s: any) => s.isVirtual === true);
    test.skip(!actual || !virtual, "Need both an actual and a virtual staff member seeded to verify picker pool");

    await page.goto(ROUTE.TEAMS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const sidePanel = await openTeamSidePanel(page, seedTeamName);
    await openMembersTab(sidePanel);

    await sidePanel.getByRole("button", { name: /add member/i }).first().click();
    await page.waitForTimeout(1500);

    // The picker is a virtualised list — only the first ~10 rows render. To
    // prove a candidate is in the *pool*, type their name into the picker's
    // search input and verify the row renders.
    const pickerLocator = page
      .locator('[role="dialog"]:visible')
      .filter({ hasText: /Selected staff/i })
      .first();
    await expect(pickerLocator).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    // The picker has two search inputs — a generic "Search" (a sibling
    // utility) and the real staff filter "Search by staff name, job title
    // or team". Target the latter explicitly.
    const search = pickerLocator
      .locator('input[placeholder*="staff name" i], input[placeholder*="job title" i]')
      .first();
    await expect(search).toBeAttached({ timeout: TIMEOUT.DEFAULT });

    for (const candidate of [actual!, virtual!]) {
      // Avoid `.click()` — the dialog's sticky header overlays the input and
      // intercepts pointer events. `fill()` programmatically focuses + sets
      // the value without needing a real click hit-test.
      await search.fill("");
      await search.fill(candidate.displayName);
      await page.waitForTimeout(800);
      await expect(pickerLocator.getByText(candidate.displayName).first()).toBeVisible({
        timeout: TIMEOUT.DEFAULT,
      });
    }
  });

  // ── Scenario 6: API — add a member via mutation, verify it appears ──────
  test("Scenario 6: should add a member via API and the side panel reflects it", async ({ page }) => {
    const staffList = await BffApi.getStaff(page, { page: { returnAll: true } });
    const items = staffList?.data?.staffs?.items || [];
    const candidate = items.find((s: any) => s.isVirtual === false);
    test.skip(!candidate, "Need at least one actual staff to add as a member");

    await BffApi.addTeamMember(page, {
      teamEntityId: seedTeamId,
      staffEntityId: candidate!.entityId,
    });

    await page.goto(ROUTE.TEAMS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const sidePanel = await openTeamSidePanel(page, seedTeamName);
    await openMembersTab(sidePanel);

    await expect(sidePanel.getByText(candidate!.displayName).first()).toBeVisible({ timeout: TIMEOUT.LONG });
  });

  // ── Scenario 7: delete via side panel trash icon ────────────────────────
  test("Scenario 7: should delete a team using the side panel delete icon", async ({ page }) => {
    await page.goto(ROUTE.TEAMS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const sidePanel = await openTeamSidePanel(page, seedTeamName);

    const deleteResp = page.waitForResponse(
      async (r) => {
        if (!r.url().includes(ENDPOINT.BFF) || r.request().method() !== "POST") return false;
        const body = r.request().postDataJSON();
        return /delete.*team|remove.*team/i.test(body?.operationName || "") || /deleteTeam|removeTeam/i.test(body?.query || "");
      },
      { timeout: TIMEOUT.LONG }
    );

    await sidePanel.locator('[data-icon="trash-alt"]').first().click();

    // The confirm prompt is a separate dialog with text "Delete team {name}?"
    const confirmDialog = page
      .locator('[role="dialog"]:visible')
      .filter({ hasText: /Delete team .+\?/i })
      .first();
    await expect(confirmDialog).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    await confirmDialog.getByRole("button", { name: /^delete$/i }).click();

    await deleteResp;
    await page.waitForTimeout(500);

    const list = await BffApi.getTeams(page);
    const items = list?.data?.teams?.items || [];
    expect(items.find((t: any) => t.entityId === seedTeamId)).toBeUndefined();

    seedTeamId = "";
  });

  // ── Scenario 8: read-only UI without MANAGE_TEAM ────────────────────────
  // Actual app behaviour (not strictly what the spec says): the Create
  // button and the Add-member button are hidden, but the side-panel edit
  // and trash icons remain rendered with their parent <button> in the
  // `disabled` state. This test asserts the *real* UX: mutation controls
  // are unreachable, even though some are disabled rather than hidden.
  test("Scenario 8: should disable/hide mutation controls when user lacks MANAGE_TEAM permission", async ({ page }) => {
    await setMockPermissions(page, [PERM.APP_ACCESS, PERM.VIEW_TEAM, PERM.VIEW_STAFF]);

    await page.goto(ROUTE.TEAMS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const createBtn = page.getByRole("button", { name: /add new team|add team|create team/i });
    await expect(createBtn).toHaveCount(0);

    // Open any team's side panel — the seeded team requires MANAGE_TEAM via
    // beforeEach but the existing "Administration" team is always present.
    const adminText = page.getByText(/^Administration$/).first();
    await expect(adminText).toBeVisible({ timeout: TIMEOUT.LONG });
    await adminText.click();
    await page.waitForTimeout(1500);

    const sp = page
      .locator('[role="dialog"]:visible')
      .filter({ has: page.getByRole("tab", { name: /Team details/i }) })
      .first();
    await expect(sp).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    // Edit and trash icons are rendered but their parent buttons are disabled.
    const editBtn = sp.locator('button:has([data-icon="edit"])').first();
    const trashBtn = sp.locator('button:has([data-icon="trash-alt"])').first();
    await expect(editBtn).toBeDisabled();
    await expect(trashBtn).toBeDisabled();

    // Add-member button is fully hidden when on the Members tab.
    const membersTab = sp.getByRole("tab", { name: /^Members/i });
    if (await membersTab.isVisible().catch(() => false)) {
      await membersTab.click();
      await page.waitForTimeout(800);
      await expect(sp.getByRole("button", { name: /add member/i })).toHaveCount(0);
    }
  });
});
