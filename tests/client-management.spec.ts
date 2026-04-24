import { test, expect, Page, Locator } from "@playwright/test";
import { setMockPermissions } from "./auth-helper";
import { LOAD_STATE, PERM, TIMEOUT, ENDPOINT, ROUTE, SELECTOR } from "./constants";
import { BffApi } from "./api";

/**
 * Client Management Tests
 *
 * Spec: specs/foundation/client-management.spec.md
 *
 * Real-world UI notes (verified against the running app):
 * - Route: /clients (plural).
 * - List uses an stz-table rendered as <table.stz-table-wrapper> wrapping
 *   role="row" virtual list items containing <td> cells; Playwright's
 *   getByRole('cell') still works on these <td>s.
 * - Side panel is a [role="dialog"] (NOT <aside>) that includes tabs:
 *   Client details, Missions, Milestone, Allocation, Knowledge, Pulse,
 *   RID, Contributors, Activity logs.
 * - Side panel header icons: edit (data-icon="edit") and delete
 *   (data-icon="trash-alt", NOT "delete").
 * - Inline edit triggers in the side panel use data-testid="inline-edit-*"
 *   (e.g. inline-edit-displayName).
 * - There is NO per-row "..." context menu on the list. Delete is
 *   performed from the side panel trash icon.
 */

const clientTable = (page: Page): Locator => page.locator("table:visible").first();

const clientDataRows = (page: Page): Locator =>
  clientTable(page)
    .getByRole("row")
    .filter({ has: page.getByRole("cell") });

/**
 * Returns the visible side-panel dialog. The Gembaa app may have multiple
 * [role="dialog"] elements concurrently (session-renew dialog, customise
 * panel, etc.). The side panel for an entity is the wide one that contains
 * `[role="tab"]` elements.
 */
const sidePanelDialog = (page: Page): Locator =>
  page
    .locator('[role="dialog"]:visible')
    .filter({ has: page.getByRole("tab") })
    .first();

async function openSidePanelForRow(page: Page, rowFilter?: { hasText: string }): Promise<Locator> {
  const rows = clientDataRows(page);
  const target = rowFilter ? rows.filter(rowFilter).first() : rows.first();
  await expect(target).toBeVisible({ timeout: TIMEOUT.LONG });
  await target.getByRole("cell").nth(1).click();
  const sp = sidePanelDialog(page);
  await expect(sp).toBeVisible({ timeout: TIMEOUT.DEFAULT });
  return sp;
}

// ---------------------------------------------------------------------------
// Scenario 1: View Client List
// ---------------------------------------------------------------------------
test.describe("Client Management - View @client", () => {
  test("Scenario 1: should display the client list for authorized users", async ({ page }) => {
    await page.goto(ROUTE.CLIENTS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const table = clientTable(page);
    await expect(table).toBeVisible({ timeout: TIMEOUT.LONG });
  });
});

// ---------------------------------------------------------------------------
// Scenario 2 & 2.1: Create New Client
// ---------------------------------------------------------------------------
test.describe("Client Management - Create @client", () => {
  const timestamp = Date.now();
  const testClientName = `Test Client ${timestamp}`;
  let createdClientId = "";

  test.afterAll(async ({ browser }) => {
    if (!createdClientId) return;
    const context = await browser.newContext({ storageState: "auth/storage-state.json" });
    const page = await context.newPage();
    await page.goto(ROUTE.CLIENTS);
    try {
      await BffApi.deleteClient(page, { entityId: createdClientId });
    } catch {
      // best-effort
    }
    await context.close();
  });

  test("Scenario 2.1: should show validation error when required fields are missing on create", async ({ page }) => {
    await page.goto(ROUTE.CLIENTS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const createBtn = page.getByRole("button", { name: /add new team|add client|add new client|add new|create client|new client/i }).first();
    await expect(createBtn).toBeVisible({ timeout: TIMEOUT.LONG });
    await createBtn.click();

    const dialog = page.getByRole("dialog").last();
    await expect(dialog).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    await dialog.getByRole("button", { name: /^save$|submit|confirm/i }).click();

    const inlineError = dialog.getByText(/required|cannot be empty/i).first();
    await expect(inlineError).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    // Close the dialog
    await dialog.getByRole("button", { name: /cancel/i }).click().catch(() => {});
  });

  test("Scenario 2: should successfully create a new client", async ({ page }) => {
    await page.goto(ROUTE.CLIENTS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const createBtn = page.getByRole("button", { name: /add client|add new client|add new|create client|new client/i }).first();
    await createBtn.click();

    const dialog = page.getByRole("dialog").last();
    await expect(dialog).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    const nameInput = dialog.locator('input[name="displayName"]').first();
    await nameInput.click();
    await nameInput.fill(testClientName);

    // Wait for the AddClient GraphQL mutation specifically
    const addClientResp = page.waitForResponse(
      async (r) => {
        if (!r.url().includes(ENDPOINT.BFF) || r.request().method() !== "POST") return false;
        const body = r.request().postDataJSON();
        return body?.operationName === "AddClient" || /createClient|addClient/i.test(body?.query || "");
      },
      { timeout: TIMEOUT.LONG }
    );
    await dialog.getByRole("button", { name: /^save$/i }).click();
    await addClientResp;

    // Verify the client was created via the BFF list query.
    await page.waitForTimeout(500);
    const list = await BffApi.getClients(page, { page: { returnAll: true } });
    const items = list?.data?.clients?.items || [];
    const created = items.find((c: any) => c.displayName === testClientName);
    createdClientId = created?.entityId || "";
    expect(createdClientId).not.toBe("");
  });
});

// ---------------------------------------------------------------------------
// Scenarios 3-8: each test gets a fresh client via API (beforeEach).
// ---------------------------------------------------------------------------
test.describe("Client Management - Edit, Delete & Permissions @client", () => {
  let seedClientId = "";
  let seedClientName = "";

  test.beforeEach(async ({ page }) => {
    const timestamp = Date.now();
    seedClientName = `Seed Client ${timestamp}`;

    await page.goto(ROUTE.CLIENTS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const created = await BffApi.createClient(page, { displayName: seedClientName });
    seedClientId = created.entityId;
  });

  test.afterEach(async ({ page }) => {
    if (!seedClientId) return;
    try {
      await BffApi.deleteClient(page, { entityId: seedClientId });
    } catch {
      // best-effort cleanup
    }
    seedClientId = "";
  });

  // ── Scenario 3: edit via dialog ─────────────────────────────────────────
  test("Scenario 3: should successfully edit client details via the edit dialog", async ({ page }) => {
    await page.goto(ROUTE.CLIENTS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const sidePanel = await openSidePanelForRow(page, { hasText: seedClientName });
    await sidePanel.locator('[data-icon="edit"]').first().click();

    const dialog = page.getByRole("dialog").last();
    await expect(dialog).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    const nameInput = dialog.locator('input[name="displayName"]').first();
    const updatedName = `${seedClientName} Updated`;
    await nameInput.click();
    await nameInput.fill(updatedName);

    const updateResp = page.waitForResponse(
      async (r) => {
        if (!r.url().includes(ENDPOINT.BFF) || r.request().method() !== "POST") return false;
        const body = r.request().postDataJSON();
        return /update.*client|edit.*client/i.test(body?.operationName || "") || /updateClient|editClient/i.test(body?.query || "");
      },
      { timeout: TIMEOUT.LONG }
    );
    await dialog.getByRole("button", { name: /^save$/i }).click();
    await updateResp;

    // Verify the change persisted via BFF
    await page.waitForTimeout(500);
    const list = await BffApi.getClients(page, { page: { returnAll: true } });
    const items = list?.data?.clients?.items || [];
    const updated = items.find((c: any) => c.displayName === updatedName);
    expect(updated).toBeDefined();
    seedClientId = updated?.entityId || seedClientId;
  });

  // ── Scenario 4: inline edit in side panel ───────────────────────────────
  test("Scenario 4: should allow inline editing in the side panel", async ({ page }) => {
    await page.goto(ROUTE.CLIENTS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const sidePanel = await openSidePanelForRow(page, { hasText: seedClientName });

    const inlineTrigger = sidePanel.locator('[data-testid="inline-edit-displayName"]').first();
    await expect(inlineTrigger).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    await inlineTrigger.hover();
    await inlineTrigger.click();

    const inlineInput = sidePanel.getByRole("textbox").first();
    await expect(inlineInput).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    const newValue = `${seedClientName} mod`;
    await inlineInput.fill(newValue);

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes(ENDPOINT.BFF) && r.request().method() === "POST"
    );
    await inlineInput.press("Enter");
    await responsePromise;

    await expect(sidePanel.getByText(newValue).first()).toBeVisible({ timeout: TIMEOUT.LONG });
  });

  // ── Scenario 5: list inline edit NOT supported ─────────────────────────
  test("Scenario 5: list inline edit is NOT supported (double-click does not toggle edit mode)", async ({ page }) => {
    await page.goto(ROUTE.CLIENTS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const dataRows = clientDataRows(page);
    const targetRow = dataRows.filter({ hasText: seedClientName }).first();
    await expect(targetRow).toBeVisible({ timeout: TIMEOUT.LONG });

    const targetCell = targetRow.getByRole("cell").nth(1);
    await targetCell.dblclick({ position: { x: 5, y: 5 } });

    // Double-click opens the side panel rather than enabling inline edit.
    // No editable textbox should appear inside the table.
    const inlineInput = clientTable(page).getByRole("textbox");
    await expect(inlineInput).toHaveCount(0);

    // Close the side panel if it opened
    await page.keyboard.press("Escape").catch(() => {});
  });

  // ── Scenario 6: side panel Mission tab lists missions for this client ──
  test("Scenario 6: side panel Mission tab lists missions belonging to this client", async ({ page }) => {
    const otherClient = await BffApi.createClient(page, { displayName: `Other Client ${Date.now()}` });
    const ownMissionName = `Own Mission ${Date.now()}`;
    const foreignMissionName = `Foreign Mission ${Date.now()}`;

    const ownMission = await BffApi.createMission(page, {
      displayName: ownMissionName,
      clientEntityId: seedClientId,
    });
    const foreignMission = await BffApi.createMission(page, {
      displayName: foreignMissionName,
      clientEntityId: otherClient.entityId,
    });

    try {
      await page.goto(ROUTE.CLIENTS);
      await page.waitForLoadState(LOAD_STATE.DOM);

      const sidePanel = await openSidePanelForRow(page, { hasText: seedClientName });

      const missionTab = sidePanel.getByRole("tab", { name: /^Missions$/i }).first();
      await expect(missionTab).toBeVisible({ timeout: TIMEOUT.DEFAULT });
      await missionTab.click();
      // Wait for the table inside the Missions tab to render
      await page.waitForTimeout(1000);

      const missionTable = sidePanel.locator("table").first();
      await expect(missionTable).toBeVisible({ timeout: TIMEOUT.LONG });
      await expect(missionTable.getByText(ownMissionName).first()).toBeVisible({ timeout: TIMEOUT.LONG });
      await expect(missionTable.getByText(foreignMissionName)).toHaveCount(0);
    } finally {
      await BffApi.deleteMission(page, { entityId: ownMission.entityId }).catch(() => {});
      await BffApi.deleteMission(page, { entityId: foreignMission.entityId }).catch(() => {});
      await BffApi.deleteClient(page, { entityId: otherClient.entityId }).catch(() => {});
    }
  });

  // ── Scenario 7: delete via side panel trash icon ───────────────────────
  test("Scenario 7: should delete a client using the side panel delete icon", async ({ page }) => {
    await page.goto(ROUTE.CLIENTS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const sidePanel = await openSidePanelForRow(page, { hasText: seedClientName });

    const deleteResp = page.waitForResponse(
      async (r) => {
        if (!r.url().includes(ENDPOINT.BFF) || r.request().method() !== "POST") return false;
        const body = r.request().postDataJSON();
        return /delete.*client|remove.*client/i.test(body?.operationName || "") || /deleteClient|removeClient/i.test(body?.query || "");
      },
      { timeout: TIMEOUT.LONG }
    );

    await sidePanel.locator('[data-icon="trash-alt"]').first().click();

    // A confirmation dialog appears with header "Delete client {name}" and
    // body "Delete {name}? Deleted clients cannot be recovered." Match on
    // the body's recovery copy to disambiguate from the side-panel dialog.
    const confirmDialog = page
      .locator('[role="dialog"]:visible')
      .filter({ hasText: /Deleted clients cannot be recovered/i })
      .first();
    await expect(confirmDialog).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    await confirmDialog.getByRole("button", { name: /^delete$/i }).click();

    await deleteResp;
    await page.waitForTimeout(500);

    // Verify via BFF the client no longer exists
    const list = await BffApi.getClients(page, { page: { returnAll: true } });
    const items = list?.data?.clients?.items || [];
    expect(items.find((c: any) => c.entityId === seedClientId)).toBeUndefined();

    // Client deleted via UI — skip afterEach API cleanup
    seedClientId = "";
  });

  // ── Scenario 8: read-only UI without MANAGE_CLIENT ─────────────────────
  test("Scenario 8: should hide all mutation controls when user lacks MANAGE_CLIENT permission", async ({ page }) => {
    await setMockPermissions(page, [PERM.APP_ACCESS, PERM.VIEW_CLIENT]);

    await page.goto(ROUTE.CLIENTS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const createBtn = page.getByRole("button", { name: /add client|add new client|create client|new client/i });
    await expect(createBtn).toHaveCount(0);

    // Click the first row's name cell — a side panel may or may not open
    const target = clientDataRows(page).first();
    await expect(target).toBeVisible({ timeout: TIMEOUT.LONG });
    await target.getByRole("cell").nth(1).click();
    await page.waitForTimeout(1500);

    // Either no side panel opened, or it opened but without edit/delete icons.
    const sp = page
      .locator('[role="dialog"]:visible')
      .filter({ has: page.getByRole("tab") })
      .first();
    if (await sp.isVisible().catch(() => false)) {
      await expect(sp.locator('[data-icon="edit"]')).toHaveCount(0);
      await expect(sp.locator('[data-icon="trash-alt"]')).toHaveCount(0);
    }
  });
});
