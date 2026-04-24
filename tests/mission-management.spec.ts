import { test, expect } from "@playwright/test";
import { setMockPermissions } from "./auth-helper";
import { LABEL, LOAD_STATE, PERM, TIMEOUT, ENDPOINT, ROUTE, SELECTOR } from "./constants";
import { GbaApi, SOURCE_ENTITY, CUSTOM_FIELD_TYPE } from "./api";
import { BffApi } from "./api";

/**
 * Mission Management Tests
 *
 * Spec: specs/foundation/mission-management.spec.md
 *
 * Covers:
 * - Scenario 1: View Mission List
 * - Scenario 2 & 2.1: Create New Mission (Success + Validation Error)
 * - Scenario 3 & 3.1: Edit Mission via Dialog (Success + Validation Error)
 * - Scenario 4: Edit Mission via List Inline Edit
 * - Scenario 5 & 5.1: Edit Mission via Sidepanel Inline Edit (Success + Validation Error)
 * - Scenario 6: Side Panel Inline Edit — Each Field Type
 * - Scenario 7: Delete Mission via Context Menu
 * - Scenario 8: Read-Only UI for Users Without MSN-MANAGE-MISSION
 *
 * Scenarios 3+ pre-create a dedicated client (beforeAll) and a fresh mission
 * (beforeEach) via API, so each test runs independently without depending on
 * Scenario 2.
 */

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function selectDialogOption(
  page: any,
  dialog: any,
  fieldLabel: string,
  optionText: string
) {
  const field = dialog
    .getByRole("textbox", {
      name: new RegExp(`^${escapeRegex(fieldLabel)}\\*?$`, "i"),
    })
    .first();

  await expect(field).toBeVisible({ timeout: TIMEOUT.DEFAULT });
  await field.click();

  const optionName = new RegExp(`^${escapeRegex(optionText)}$`, "i");
  const listItem = page.getByRole("listitem").filter({ hasText: optionName }).first();
  await expect(listItem).toBeVisible({ timeout: TIMEOUT.DEFAULT });
  await listItem.click();
}

// ---------------------------------------------------------------------------
// Scenario 1: View Mission List (standalone)
// ---------------------------------------------------------------------------
test.describe("Mission Management - View @mission", () => {
  test("Scenario 1: should display the mission list for authorized users", async ({ page }) => {
    await page.goto(ROUTE.MISSIONS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const missionGrid = page.getByRole(SELECTOR.TREEGRID).first();
    await expect(missionGrid).toBeVisible({ timeout: TIMEOUT.DEFAULT });
  });
});

// ---------------------------------------------------------------------------
// Scenario 2 & 2.1: Create New Mission (standalone)
// ---------------------------------------------------------------------------
test.describe("Mission Management - Create @mission", () => {
  const timestamp = Date.now();
  const testMissionName = `Test Mission ${timestamp}`;
  const testClientName = `Test Client ${timestamp}`;
  let testClientId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(ROUTE.MISSIONS);
    const created = await BffApi.createClient(page, { displayName: testClientName });
    testClientId = created.entityId;
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!testClientId) return;
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(ROUTE.MISSIONS);
    try {
      await BffApi.deleteClient(page, { entityId: testClientId });
    } catch {
      // best-effort
    }
    await context.close();
  });

  test("Scenario 2.1: should show error toast when required fields are missing on create", async ({ page }) => {
    await page.goto(ROUTE.MISSIONS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const createBtn = page.getByRole("button", { name: /create|add|new/i });
    await expect(createBtn).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    await createBtn.click();

    const dialog = page.getByRole("dialog").first();
    await dialog.getByRole("button", { name: /save|submit|confirm/i }).click();

    const nameError = dialog.getByText(/Mission name is required/i);
    const clientError = dialog.getByText(/Client is required/i);
    await expect(nameError).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    await expect(clientError).toBeVisible({ timeout: TIMEOUT.DEFAULT });
  });

  test("Scenario 2: should successfully create a new mission", async ({ page }) => {
    await page.goto(ROUTE.MISSIONS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const createBtn = page.getByRole("button", { name: /create|add|new/i });
    await createBtn.click();

    const dialog = page.getByRole("dialog").first();
    await expect(dialog).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    const missionNameInput = dialog.getByRole("textbox", { name: /mission name/i }).first();
    await missionNameInput.fill(testMissionName);

    await selectDialogOption(page, dialog, "Status", "In Progress");
    await selectDialogOption(page, dialog, "Client", testClientName);

    await dialog.getByRole("button", { name: /save|submit|confirm/i }).click();

    const successToast = page.locator(SELECTOR.TOAST_ANY).filter({ hasText: /success|saved|created|added/i });
    await expect(successToast).toBeVisible({ timeout: TIMEOUT.TOAST });

    await expect(page.getByRole(SELECTOR.TREEGRID).filter({ hasText: testMissionName })).toBeVisible({ timeout: TIMEOUT.LONG });
  });
});

// ---------------------------------------------------------------------------
// Scenarios 3-8: each test gets a fresh mission via API (beforeEach).
// A dedicated client is created once for the suite (beforeAll) and removed
// after all tests finish (afterAll), so no test depends on Scenario 2.
// ---------------------------------------------------------------------------
test.describe("Mission Management - Edit & Delete @mission", () => {
  const suiteTimestamp = Date.now();
  const suiteClientName = `Test Client Suite ${suiteTimestamp}`;
  let suiteClientId: string;

  let seedMissionId: string;
  let seedMissionName: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(ROUTE.MISSIONS);
    const created = await BffApi.createClient(page, { displayName: suiteClientName });
    suiteClientId = created.entityId;
    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!suiteClientId) return;
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(ROUTE.MISSIONS);
    try {
      await BffApi.deleteClient(page, { entityId: suiteClientId });
    } catch {
      // best-effort
    }
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    const timestamp = Date.now();
    seedMissionName = `Seed Mission ${timestamp}`;

    await page.goto(ROUTE.MISSIONS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const created = await BffApi.createMission(page, {
      displayName: seedMissionName,
      clientEntityId: suiteClientId,
    });
    seedMissionId = created.entityId;
  });

  test.afterEach(async ({ page }) => {
    if (!seedMissionId) return;
    try {
      await BffApi.deleteMission(page, { entityId: seedMissionId });
    } catch {
      // best-effort cleanup; mission may have been deleted by the test itself
    }
  });

  // ── Scenario 3.1 ──────────────────────────────────────────────────────────
  test("Scenario 3.1: should show error toast on edit dialog when required field is empty", async ({ page }) => {
    await page.goto(ROUTE.MISSIONS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const dataRows = page.getByRole(SELECTOR.TREEGRID).first().getByRole('row').filter({ has: page.getByRole('gridcell') });
    await dataRows.first().getByRole('gridcell').nth(1).click();

    const sidePanel = page.locator(SELECTOR.SIDEPANEL).first();
    await expect(sidePanel).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    await sidePanel.locator('[data-icon="edit"]').first().click();

    const dialog = page.getByRole("dialog").last();

    const nameInput = dialog.getByRole("textbox", { name: /name/i }).first();
    await nameInput.fill("");
    await dialog.getByRole("button", { name: /save|submit|confirm/i }).click();

    const nameError = dialog.getByText(/Mission name is required/i);
    await expect(nameError).toBeVisible({ timeout: TIMEOUT.DEFAULT });
  });

  // ── Scenario 3 ────────────────────────────────────────────────────────────
  test("Scenario 3: should successfully edit mission details and show success toast", async ({ page }) => {
    await page.goto(ROUTE.MISSIONS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const dataRows = page.getByRole(SELECTOR.TREEGRID).first().getByRole('row').filter({ has: page.getByRole('gridcell') });
    await dataRows.first().getByRole('gridcell').nth(1).click();

    const sidePanel = page.locator(SELECTOR.SIDEPANEL).first();
    await sidePanel.locator('[data-icon="edit"]').first().click();

    const dialog = page.getByRole("dialog").last();
    const nameInput = dialog.getByRole("textbox", { name: /name/i }).first();
    await nameInput.fill(`${seedMissionName} Updated`);

    const responsePromise = page.waitForResponse((response) =>
      response.url().includes(ENDPOINT.BFF) && response.request().method() === 'POST'
    );
    await dialog.getByRole("button", { name: /save|submit|confirm/i }).click();
    await responsePromise;

    const successToast = page.locator(SELECTOR.TOAST_ANY).filter({ hasText: /success|saved|updated|edited/i });
    await expect(successToast).toBeVisible({ timeout: TIMEOUT.TOAST });
  });

  // ── Scenario 4 ────────────────────────────────────────────────────────────
  test("Scenario 4: should allow inline editing directly from the lists table", async ({ page }) => {
    await page.goto(ROUTE.MISSIONS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const grid = page.getByRole(SELECTOR.TREEGRID).first();
    const firstRow = grid.locator('[role="row"][row-index]').first();
    await expect(firstRow).toBeVisible({ timeout: TIMEOUT.LONG });

    const nameCell = firstRow.locator('[role="gridcell"]').nth(1);
    await nameCell.dblclick({ position: { x: 2, y: 4 } });

    const inlineInput = grid.getByRole("textbox").first();
    await expect(inlineInput).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    const originalValue = await inlineInput.inputValue();
    expect(originalValue).toBeDefined();

    await inlineInput.fill(`${originalValue} modified`);
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes(ENDPOINT.BFF) && response.request().method() === "POST"
    );
    await inlineInput.press("Enter");
    await responsePromise;

    const successToast = page.locator(SELECTOR.TOAST_ANY).filter({ hasText: /success|saved|updated|edited/i });
    await expect(successToast).toBeVisible({ timeout: TIMEOUT.TOAST });
  });

  // ── Scenario 5.1 ──────────────────────────────────────────────────────────
  test("Scenario 5.1: should display an error toast if inline edit clears a required field", async ({ page }) => {
    await page.goto(ROUTE.MISSIONS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const dataRows = page.getByRole(SELECTOR.TREEGRID).first().getByRole('row').filter({ has: page.getByRole('gridcell') });
    await dataRows.first().getByRole('gridcell').nth(1).click();

    const sidePanel = page.locator(SELECTOR.SIDEPANEL).first();
    await expect(sidePanel).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    const inlineTrigger = sidePanel.locator('.stz-dialog-body [data-testid^="inline-edit-"]').first();
    await inlineTrigger.hover();
    await inlineTrigger.click();

    const inlineInput = sidePanel.getByRole("textbox").first();
    await expect(inlineInput).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    await inlineInput.fill("");
    await inlineInput.press("Enter");

    const inlineError = sidePanel.getByText(/Mission name is required|required|cannot be empty/i).first();
    const errorToast = page.locator(SELECTOR.TOAST_ANY).filter({ hasText: /required|invalid|error|cannot/i });
    await expect(inlineError.or(errorToast)).toBeVisible({ timeout: TIMEOUT.DEFAULT });
  });

  // ── Scenario 5 ────────────────────────────────────────────────────────────
  test("Scenario 5: should allow inline editing in the side panel successfully", async ({ page }) => {
    await page.goto(ROUTE.MISSIONS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const dataRows = page.getByRole(SELECTOR.TREEGRID).first().getByRole('row').filter({ has: page.getByRole('gridcell') });
    await dataRows.first().getByRole('gridcell').nth(1).click();

    const sidePanel = page.locator(SELECTOR.SIDEPANEL).first();
    await expect(sidePanel).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    const inlineTrigger = sidePanel.locator('.stz-dialog-body [data-testid^="inline-edit-"]').first();
    await inlineTrigger.hover();
    await inlineTrigger.click();

    const inlineInput = sidePanel.getByRole("textbox").first();
    await expect(inlineInput).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    const currentData = await inlineInput.inputValue();
    expect(currentData).toBeDefined();

    const newValue = `${currentData} mod-sidepanel`;
    await inlineInput.fill(newValue);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(ENDPOINT.BFF) &&
        response.request().method() === "POST" &&
        response.status() === 200
    );
    await inlineInput.press("Enter");
    await responsePromise;

    await expect(sidePanel.getByText(newValue).first()).toBeVisible({ timeout: TIMEOUT.DEFAULT });
  });

  // ── Scenario 6 ────────────────────────────────────────────────────────────
  test("Scenario 6: should allow inline editing for each distinct field type in the side panel", async ({ page }) => {
    const allFields = await GbaApi.getProfilesBySourceEntity(SOURCE_ENTITY.MISSION);
    const editableFields = allFields.filter((f) => !f.isReferenceField);

    const byType = new Map<number, typeof editableFields[0]>();
    for (const field of editableFields) {
      if (!byType.has(field.fieldTypeId)) byType.set(field.fieldTypeId, field);
    }

    await page.goto(ROUTE.MISSIONS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const dataRows = page.getByRole(SELECTOR.TREEGRID).first().getByRole('row').filter({ has: page.getByRole('gridcell') });
    await dataRows.first().getByRole('gridcell').nth(1).click();

    const sidePanel = page.locator(SELECTOR.SIDEPANEL).first();
    await expect(sidePanel).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    for (const [fieldTypeId, field] of byType) {
      const fieldName = field.name ?? "";
      const trigger = sidePanel
        .locator('.stz-dialog-body [data-testid^="inline-edit-"]')
        .filter({ hasText: fieldName })
        .first();

      const triggerCount = await trigger.count();
      if (triggerCount === 0) continue;

      await trigger.hover();
      await trigger.click();

      if (fieldTypeId === CUSTOM_FIELD_TYPE.DATE) {
        const datepicker = page.locator('[role="dialog"], [data-testid*="datepicker"], .react-datepicker').first();
        await expect(datepicker).toBeVisible({ timeout: TIMEOUT.DEFAULT });
        await page.keyboard.press('Escape');
        continue;
      }

      if (
        fieldTypeId === CUSTOM_FIELD_TYPE.SELECT ||
        fieldTypeId === CUSTOM_FIELD_TYPE.STATUS
      ) {
        const dropdown = page.locator('[role="listbox"], [role="menu"]').first();
        await expect(dropdown).toBeVisible({ timeout: TIMEOUT.DEFAULT });
        await page.keyboard.press('Escape');
        continue;
      }

      const inlineInput = sidePanel.getByRole("textbox").first();
      await expect(inlineInput).toBeVisible({ timeout: TIMEOUT.DEFAULT });

      const currentValue = await inlineInput.inputValue();
      await inlineInput.fill(`${currentValue} edited`);

      const responsePromise = page.waitForResponse(
        (response) => response.url().includes(ENDPOINT.BFF) && response.request().method() === 'POST'
      );
      await inlineInput.press('Enter');
      await responsePromise;

      const successToast = page.locator(SELECTOR.TOAST_ANY).filter({ hasText: /success|saved|updated|edited/i });
      await expect(successToast).toBeVisible({ timeout: TIMEOUT.TOAST });
    }

    const referenceFields = allFields.filter((f) => f.isReferenceField);
    for (const refField of referenceFields) {
      const fieldName = refField.name ?? "";
      const trigger = sidePanel
        .locator('.stz-dialog-body [data-testid^="inline-edit-"]')
        .filter({ hasText: fieldName })
        .first();

      const triggerCount = await trigger.count();
      if (triggerCount === 0) continue;

      await trigger.hover();
      await trigger.click();

      const editInput = sidePanel.getByRole("textbox").first();
      await expect(editInput).not.toBeVisible({ timeout: TIMEOUT.SHORT });
    }
  });

  // ── Scenario 7 ────────────────────────────────────────────────────────────
  test("Scenario 7: should delete a mission using the context menu 'Delete mission' option", async ({ page }) => {
    await page.goto(ROUTE.MISSIONS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const dataRows = page.getByRole(SELECTOR.TREEGRID).first().getByRole('row').filter({ has: page.getByRole('gridcell') });
    await expect(dataRows.first()).toBeVisible({ timeout: TIMEOUT.LONG });

    const contextMenuBtn = dataRows.first().getByTestId('more-options-btn');
    await contextMenuBtn.click();

    const deleteOption = page.getByRole('menuitem', { name: /delete mission/i }).first();
    await expect(deleteOption).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    await deleteOption.click();

    const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete/i }).first();
    const confirmVisible = await confirmBtn.isVisible().catch(() => false);
    if (confirmVisible) await confirmBtn.click();

    const responsePromise = page.waitForResponse(
      (response) => response.url().includes(ENDPOINT.BFF) && response.request().method() === 'POST'
    );
    await responsePromise;

    const successToast = page.locator(SELECTOR.TOAST_ANY).filter({ hasText: /success|deleted|removed/i });
    await expect(successToast).toBeVisible({ timeout: TIMEOUT.TOAST });

    // Mission deleted via UI — skip afterEach API cleanup
    seedMissionId = "";
  });

  // ── Scenario 8 ────────────────────────────────────────────────────────────
  test("Scenario 8: should hide all mutation controls when user lacks MANAGE_MISSION permission", async ({ page }) => {
    await setMockPermissions(page, [PERM.APP_ACCESS, PERM.VIEW_MISSION]);

    await page.goto(ROUTE.MISSIONS);
    await page.waitForLoadState(LOAD_STATE.DOM);

    const createBtn = page.getByRole('button', { name: /create|add|new/i });
    await expect(createBtn).not.toBeVisible({ timeout: TIMEOUT.DEFAULT });

    const dataRows = page.getByRole(SELECTOR.TREEGRID).first().getByRole('row').filter({ has: page.getByRole('gridcell') });
    await dataRows.first().getByRole('gridcell').nth(1).click();

    const sidePanel = page.locator(SELECTOR.SIDEPANEL).first();
    await expect(sidePanel).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    const editIcon = sidePanel.locator('[data-icon="edit"]');
    const deleteIcon = sidePanel.locator('[data-icon="delete"]');
    await expect(editIcon).not.toBeVisible({ timeout: TIMEOUT.DEFAULT });
    await expect(deleteIcon).not.toBeVisible({ timeout: TIMEOUT.DEFAULT });

    const contextMenuBtn = dataRows.first().getByTestId('more-options-btn');
    await expect(contextMenuBtn).not.toBeVisible({ timeout: TIMEOUT.DEFAULT });
  });
});
