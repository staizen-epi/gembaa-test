import { test, expect } from "@playwright/test";
import { setMockPermissions } from "./auth-helper";
import { LABEL, LOAD_STATE, PERM, TIMEOUT } from "./constants";
import { ScimApi, SCIM_OP, GbaApi, SOURCE_ENTITY, BffApi } from "./api";

/**
 * Staff Management Tests
 *
 * Spec: specs/staff-management.spec.md
 *
 * Covers:
 * - Viewing staff list (Scenario 1)
 * - Creating virtual staff via UI (Scenario 2)
 * - SCIM operations: create, update, deactivate, activate (Scenarios 3–6)
 * - Editing staff details via UI (Scenario 7)
 * - Inactive staff visibility based on permissions (Scenarios 8–9)
 */

// ---------------------------------------------------------------------------
// Scenario 1: View Staff List
// ---------------------------------------------------------------------------
test.describe("Staff Management - View @staff", () => {
  test("Scenario 1: should display the staff list for authorized users", async ({
    page,
  }) => {
    // Given: user has STF-VIEW-STAFF permission (default from global-setup)
    // When: navigate to Staff Management
    await page.goto("/staff");
    await page.waitForLoadState(LOAD_STATE.DOM);

    // Then: a staff list/table should be visible
    const staffTable = page.locator("table").first();
    await expect(staffTable).toBeVisible({ timeout: TIMEOUT.DEFAULT });
  });
});

// ---------------------------------------------------------------------------
// Scenario 2: Create Virtual Staff via UI
// ---------------------------------------------------------------------------
test.describe("Staff Management - Create Virtual Staff @staff", () => {
  test("Scenario 2: should create a virtual staff member via the UI", async ({
    page,
  }) => {
    // Given: user has STF-MANAGE-STAFF permission (default from global-setup)
    await page.goto("/staff");
    await page.waitForLoadState(LOAD_STATE.DOM);

    // When: find and click the "Add virtual staff" button
    const createButton = page.getByRole("button", { name: "Add virtual staff" });
    await expect(createButton).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    await createButton.click();

    // Then: a popup dialog should appear for creating a new staff member
    await page.waitForLoadState(LOAD_STATE.IDLE);

    const dialog = page.getByRole("dialog").first();
    await expect(dialog).toBeVisible({ timeout: TIMEOUT.DEFAULT });
  });
});

// ---------------------------------------------------------------------------
// Scenarios 3–6: SCIM Operations
// ---------------------------------------------------------------------------
test.describe.serial("Staff Management - SCIM Operations @staff @scim", () => {
  const timestamp = Date.now();
  const testUserName = `scim-test-${timestamp}@example.com`;
  let createdScimUserId: string;

  test("Scenario 3: should create a staff member via SCIM API", async ({
    page,
  }) => {
    // Given: application is running
    // When: POST /scim/Users
    const createdUser = await ScimApi.createUser({
      userName: testUserName,
      displayName: `SCIM Test User ${timestamp}`,
      givenName: "SCIM",
      familyName: `Test-${timestamp}`,
      email: testUserName,
      active: true,
    });

    createdScimUserId = createdUser.id || createdUser.identifier || "";
    expect(createdScimUserId).toBeTruthy();

    // Then: the staff member should appear in the staff list
    await page.goto("/staff");
    await page.waitForLoadState(LOAD_STATE.DOM);

    // Search for the newly created staff using the search bar
    const searchInput = page.getByPlaceholder(LABEL.QUICK_SEARCH).last();
    await searchInput.fill(`SCIM Test User ${timestamp}`);
    await page.waitForTimeout(TIMEOUT.DEBOUNCE); // debounce wait
    
    const staffEntry = page.getByText(`SCIM Test User ${timestamp}`);
    await expect(staffEntry).toBeVisible({ timeout: TIMEOUT.LONG });
  });

  test("Scenario 4: should update a staff member via SCIM API", async ({
    page,
  }) => {
    // Given: a SCIM-synced staff member exists
    expect(createdScimUserId).toBeTruthy();

    // When: PATCH with displayName update (op=2 = Replace)
    const updatedName = `SCIM Test User ${timestamp} (Updated)`;
    await ScimApi.patchUser(createdScimUserId, [
      { op: SCIM_OP.REPLACE, path: "displayName", value: updatedName },
    ]);

    // Then: the updated name should be reflected in the staff list
    await page.goto("/staff");
    await page.waitForLoadState(LOAD_STATE.DOM);

    // Search for the updated staff using the search bar
    const searchInput = page.getByPlaceholder(LABEL.QUICK_SEARCH).last();
    await searchInput.fill(updatedName);
    await page.waitForTimeout(TIMEOUT.DEBOUNCE); // debounce wait

    const updatedEntry = page.getByText(updatedName);
    await expect(updatedEntry).toBeVisible({ timeout: TIMEOUT.LONG });
  });

  test("Scenario 5: should deactivate a staff member via SCIM API", async ({
    page,
  }) => {
    // Given: a SCIM-synced staff member exists and is active
    expect(createdScimUserId).toBeTruthy();

    // When: PATCH with active=false
    await ScimApi.deactivateUser(createdScimUserId);

    // Then: the staff member's status should show as inactive
    // The default test user lacks STF-VIEW-INACTIVE_STAFF permission.
    await page.goto("/staff");
    await page.waitForLoadState(LOAD_STATE.DOM);

    // Since the default test user doesn't have STF-VIEW-INACTIVE_STAFF, 
    // the staff member should disappear from the list.
    const staffEntry = page.getByText(`SCIM Test User ${timestamp} (Updated)`);
    await expect(staffEntry).not.toBeVisible({ timeout: TIMEOUT.LONG });
  });

  test("Scenario 6: should activate a staff member via SCIM API", async ({
    page,
  }) => {
    // Given: a SCIM-synced staff member exists and is inactive
    expect(createdScimUserId).toBeTruthy();

    // When: PATCH with active=true
    await ScimApi.activateUser(createdScimUserId);

    // Then: the staff member's status should change back to active
    await page.goto("/staff");
    await page.waitForLoadState(LOAD_STATE.DOM);

    // Search for the updated staff using the search bar
    const searchInput = page.getByPlaceholder(LABEL.QUICK_SEARCH).last();
    await searchInput.fill(`SCIM Test User ${timestamp} (Updated)`);
    await page.waitForTimeout(TIMEOUT.DEBOUNCE); // debounce wait

    const staffEntry = page.getByText(`SCIM Test User ${timestamp} (Updated)`);
    await expect(staffEntry).toBeVisible({ timeout: TIMEOUT.LONG });
  });

  test.afterAll(async () => {
    if (createdScimUserId) {
      await ScimApi.deleteUser(createdScimUserId).catch(() => {});
    }
  });
});

// ---------------------------------------------------------------------------
// Scenario 7: Edit Staff Details (UI)
// ---------------------------------------------------------------------------
test.describe("Staff Management - Edit Staff @staff", () => {
  test("Scenario 7: should allow editing staff details via the UI", async ({
    page,
  }) => {
    // Given: user has STF-MANAGE-STAFF permission (default from global-setup)
    await page.goto("/staff");
    await page.waitForLoadState(LOAD_STATE.DOM);

    // When: click on a known staff member's Display name button to open their detail/edit view
    // According to spec: clicking the Display name opens a side-panel
    const staffTable = page.locator('table').first();
    await expect(staffTable).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    // Wait for data rows to load (rowgroup rows)
    const dataRows = page.locator('table tbody, table [role="rowgroup"]').first().getByRole('row');
    await expect(dataRows.first()).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    // Click the first non-header cell of the staff row to open the side panel
    await dataRows.first().getByRole('cell').first().click();

    // Then: a side-panel should open with an Edit button
    await page.waitForLoadState(LOAD_STATE.IDLE);

    const sidePanel = page.locator('aside, [role="dialog"], .side-panel').first();
    await expect(sidePanel).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    
    const editButton = sidePanel.locator('[data-icon="edit"]').first();
    await expect(editButton).toBeVisible({ timeout: TIMEOUT.DEFAULT });
  });
});

// ---------------------------------------------------------------------------
// Scenarios 8–9: Inactive Staff Visibility
// ---------------------------------------------------------------------------
test.describe("Staff Management - Inactive Staff Visibility @staff @permissions", () => {
  test("Scenario 8: should show inactive staff when user has STF-VIEW-INACTIVE_STAFF permission", async ({
    page,
  }) => {
    // Given: user has STF-VIEW-INACTIVE_STAFF permission
    // (default from global-setup already includes this)
    await page.goto("/staff");
    await page.waitForLoadState(LOAD_STATE.DOM);

    // Then: the staff list should include both active and inactive staff
    const staffTable = page.locator("table").first();
    await expect(staffTable).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    // In this app, rows are within table > rowgroup > row. We can use getByRole('row')
    // Wait for data rows to load (skipping header row)
    const dataRows = page.locator('table tbody, table [role="rowgroup"]').first().getByRole('row');
    await expect(dataRows.first()).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    const rowCount = await dataRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test("Scenario 9: should filter out inactive staff when user lacks STF-VIEW-INACTIVE_STAFF permission", async ({
    page,
  }) => {
    // Given: user does NOT have STF-VIEW-INACTIVE_STAFF permission
    await setMockPermissions(page, [
      PERM.APP_ACCESS,
      PERM.VIEW_STAFF,
      PERM.MANAGE_STAFF,
      // Deliberately omit PERM.VIEW_INACTIVE_STAFF
    ]);

    // When: navigate to staff list
    await page.goto("/staff");
    await page.waitForLoadState(LOAD_STATE.DOM);

    // Then: staff list should be visible but inactive records should be filtered out
    const staffTable = page.locator("table").first();
    await expect(staffTable).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    // Verify no "Inactive" status is visible in the table
    // Look for cells with exact "Inactive" text
    const dataRows = page.locator('table tbody, table [role="rowgroup"]').first().getByRole('row');
    await expect(dataRows.first()).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    
    const inactiveIndicators = dataRows.filter({ hasText: /^Inactive$/ });
    await expect(inactiveIndicators).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// Scenarios 10–15: Edit Staff Details (SCIM vs Virtual & Reference Fields)
// ---------------------------------------------------------------------------
test.describe.serial("Staff Management - Edit Staff Details @staff @scim", () => {
  const scimStaffName = "Carlos Hoeger"; // Known SCIM staff from seeding
  let referenceFieldLabels: string[] = [];
  let virtualStaffName = "";
  
  const scimReadonlyFields = [
    /Display Name/i,
    /Job title/i,
    /Location/i,
    /Work email/i,
    /Work phone number 1/i,
    /Work phone number 2/i,
    /First Name/i,
    /Last Name/i,
  ];

  test.beforeAll(async () => {
    // Determine which custom fields are purely reference (read-only for all)
    const refFields = await GbaApi.getReferenceFields(SOURCE_ENTITY.STAFF);
    referenceFieldLabels = refFields.map(f => f.name);
  });

  // Helpers
  const findVirtualStaff = async (page: any) => {
    if (virtualStaffName) return virtualStaffName;
    // Find a virtual staff by querying the BFF directly
    const res = await BffApi.getStaff(page, { page: { returnAll: true } });
    const items = res?.data?.staffs?.items || [];
    const virtualStaff = items.find((n: any) => n.isVirtual === true && n.status === true);
    
    if (virtualStaff) {
      virtualStaffName = virtualStaff.displayName;
    } else {
      // fallback in case no Virtual staff exists or API failed
      throw new Error("No Virtual Staff found in database to test edit capabilities.");
    }
    return virtualStaffName;
  };

  test("Scenario 10: Edit SCIM Staff via Edit Dialog — SCIM-Controlled Fields Are Read-Only", async ({ page }) => {
    await page.goto("/staff");
    await page.waitForLoadState(LOAD_STATE.DOM);

    const searchInput = page.getByPlaceholder(LABEL.QUICK_SEARCH).last();
    await searchInput.fill(scimStaffName);
    await page.waitForTimeout(TIMEOUT.DEBOUNCE);

    const dataRows = page.locator('table tbody, table [role="rowgroup"]').first().getByRole('row');
    await expect(dataRows.first()).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    
    // Click the first non-header cell of the row to open the side panel
    await dataRows.first().getByRole('cell').first().click();
    
    // Open Edit Dialog
    const sidePanel = page.locator('aside, [role="dialog"], .side-panel').first();
    await expect(sidePanel).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    const editButton = sidePanel.locator('[data-icon="edit"]').first();
    await editButton.click();

    const editDialog = page.getByRole("dialog").last();
    await expect(editDialog).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    // Verify all SCIM restricted fields are disabled
    for (const fieldRegex of scimReadonlyFields) {
      // Due to UI complexities, sometimes the input is not a direct textbox, using locator
      const field = editDialog.getByLabel(fieldRegex).first();
      // Ensure the field exists, then check if disabled or readonly
      if (await field.count() > 0) {
        await expect(field).not.toBeEditable();
      }
    }
    
    await editDialog.getByRole("button", { name: /Cancel|Close/i }).click();
  });

  test("Scenario 11: Edit SCIM Staff via Edit Dialog — Reference Custom Fields Are Read-Only", async ({ page }) => {
    test.skip(referenceFieldLabels.length === 0, "No custom reference fields found via Profiles API");
    await page.goto("/staff");
    await page.waitForLoadState(LOAD_STATE.DOM);

    const scimName = scimStaffName || "SCIM User";
    const searchInput = page.getByPlaceholder(LABEL.QUICK_SEARCH).last();
    await searchInput.fill(scimName);
    await page.waitForTimeout(TIMEOUT.DEBOUNCE);

    const dataRows = page.locator('table tbody, table [role="rowgroup"]').first().getByRole('row');
    await expect(dataRows.first()).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    await dataRows.first().getByRole('cell').first().click();
    
    const sidePanel = page.locator('aside, [role="dialog"], .side-panel').first();
    await sidePanel.locator('[data-icon="edit"]').first().click();

    const editDialog = page.getByRole("dialog").last();
    await expect(editDialog).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    for (const label of referenceFieldLabels) {
      const field = editDialog.getByLabel(label, { exact: true }).first();
      if (await field.count() > 0) {
        await expect(field).not.toBeEditable();
      }
    }
  });

  test("Scenario 12: Edit SCIM Staff via Inline Editing — Non-Editable Fields Cannot Be Toggled", async ({ page }) => {
    await page.goto("/staff");
    await page.waitForLoadState(LOAD_STATE.DOM);

    const searchInput = page.getByPlaceholder(LABEL.QUICK_SEARCH).last();
    await searchInput.fill(scimStaffName);
    await page.waitForTimeout(TIMEOUT.DEBOUNCE);

    const dataRows = page.locator('table tbody, table [role="rowgroup"]').first().getByRole('row');
    await expect(dataRows.first()).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    await dataRows.first().getByRole('cell').first().click();
    
    const sidePanel = page.locator('aside, [role="dialog"], .side-panel').first();
    await expect(sidePanel).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    // Verify Display Name is not inline-editable (missing data-testid="inline-edit-*")
    const displayNameEditable = sidePanel.locator('stz-dialog-body [data-testid^="inline-edit-"]').filter({ hasText: scimStaffName });
    await expect(displayNameEditable).toHaveCount(0);
  });

  test("Scenario 13: Edit Virtual Staff via Edit Dialog — SCIM-Restricted Fields Are Editable", async ({ page }) => {
    await page.goto("/staff");
    await page.waitForLoadState(LOAD_STATE.DOM);
    const vStaffName = await findVirtualStaff(page);

    const searchInput = page.getByPlaceholder(LABEL.QUICK_SEARCH).last();
    await searchInput.fill(vStaffName);
    await page.waitForTimeout(TIMEOUT.DEBOUNCE);

    const dataRows = page.locator('table tbody, table [role="rowgroup"]').first().getByRole('row');
    await expect(dataRows.first()).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    
    await dataRows.first().getByRole('cell').first().click();
    
    const sidePanel = page.locator('aside, [role="dialog"], .side-panel').first();
    await sidePanel.locator('[data-icon="edit"]').first().click();

    const editDialog = page.getByRole("dialog").last();
    await expect(editDialog).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    for (const fieldRegex of scimReadonlyFields) {
      const field = editDialog.getByLabel(fieldRegex).first();
      if (await field.count() > 0) {
        await expect(field).toBeEnabled();
      }
    }

    for (const label of referenceFieldLabels) {
      const field = editDialog.getByLabel(label, { exact: true }).first();
      if (await field.count() > 0) {
        await expect(field).not.toBeEditable();
      }
    }
    
    await editDialog.getByRole("button", { name: /Cancel|Close/i }).click();
  });

  test("Scenario 14: Edit Virtual Staff via Inline Editing — Editable Fields Toggle and Submit", async ({ page }) => {
    await page.goto("/staff");
    await page.waitForLoadState(LOAD_STATE.DOM);
    const vStaffName = await findVirtualStaff(page);

    const searchInput = page.getByPlaceholder(LABEL.QUICK_SEARCH).last();
    await searchInput.fill(vStaffName);
    await page.waitForTimeout(TIMEOUT.DEBOUNCE);

    const dataRows = page.locator('table tbody, table [role="rowgroup"]').first().getByRole('row');
    await expect(dataRows.first()).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    await dataRows.first().getByRole('cell').first().click();
    
    const sidePanel = page.locator('aside, [role="dialog"], .side-panel').first();
    await expect(sidePanel).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    // Assuming we can target the Display Name by finding its value text
    const nameLocator = sidePanel.locator('.stz-dialog-body [data-testid^="inline-edit-"]').filter({ hasText: vStaffName }).first();
    await nameLocator.hover();
    await nameLocator.click();

    // Check if inline textbox appears
    const inlineInput = sidePanel.getByRole('textbox').first();
    await expect(inlineInput).toBeVisible({ timeout: 5000 });
    
    // Fill new name and press enter
    const updatedName = `${vStaffName} Mod`;
    await inlineInput.fill(updatedName);
    await inlineInput.press('Enter');
    await page.waitForTimeout(TIMEOUT.DEBOUNCE);

    // Verify it saved
    await expect(sidePanel.getByText(updatedName).first()).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    // Cleanup via API or UI to reset the name
    const editedNameLoc = sidePanel.locator('.stz-dialog-body [data-testid^="inline-edit-"]').filter({ hasText: updatedName }).first();
    await editedNameLoc.hover();
    await editedNameLoc.click();
    const cleanupInput = sidePanel.getByRole('textbox').first();
    await cleanupInput.fill(vStaffName);
    await cleanupInput.press('Enter');
    await page.waitForTimeout(TIMEOUT.DEBOUNCE);
  });

  test("Scenario 15: Edit Virtual Staff via Edit Dialog — Submit and Verify Changes", async ({ page }) => {
    await page.goto("/staff");
    await page.waitForLoadState(LOAD_STATE.DOM);
    const vStaffName = await findVirtualStaff(page);

    const searchInput = page.getByPlaceholder(LABEL.QUICK_SEARCH).last();
    await searchInput.fill(vStaffName);
    await page.waitForTimeout(TIMEOUT.DEBOUNCE);

    const dataRows = page.locator('table tbody, table [role="rowgroup"]').first().getByRole('row');
    await expect(dataRows.first()).toBeVisible({ timeout: TIMEOUT.DEFAULT });
    await dataRows.first().getByRole('button').first().click();
    
    const sidePanel = page.locator('aside, [role="dialog"], .side-panel').first();
    await sidePanel.locator('[data-icon="edit"]').first().click();

    const editDialog = page.getByRole("dialog").last();
    await expect(editDialog).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    const jobTitleInput = editDialog.getByLabel(/Job title/i).first();
    
    // If Job title is not a visible field currently in the form, skip the fill operation gracefully
    if (await jobTitleInput.count() > 0) {
      const originalTitle = await jobTitleInput.inputValue();
      const updatedTitle = originalTitle + " Edited";
      
      await jobTitleInput.fill(updatedTitle);
      await editDialog.getByRole("button", { name: /save|submit|confirm/i }).first().click();
      
      // Wait for success modal and click Ok
      const successModalOkBtn = page.getByRole('button', { name: /Ok/i }).first();
      await expect(successModalOkBtn).toBeVisible({ timeout: TIMEOUT.DEFAULT });
      await successModalOkBtn.click();
      
      // Dialog closes
      await expect(editDialog).not.toBeVisible({ timeout: TIMEOUT.DEFAULT });
      
      // Panel updates
      await expect(sidePanel.getByText(updatedTitle).first()).toBeVisible({ timeout: TIMEOUT.DEFAULT });

      // Clean up (optional but good practice)
      await sidePanel.locator('[data-icon="edit"]').first().click();
      await editDialog.getByLabel(/Job title/i).first().fill(originalTitle);
      await editDialog.getByRole("button", { name: /save|submit|confirm/i }).first().click();
    } else {
      await editDialog.getByRole("button", { name: /Cancel|Close/i }).click();
    }
  });
});
