import { test, expect } from "@playwright/test";
import { setMockPermissions } from "./auth-helper";
import { LOAD_STATE, PERM, TIMEOUT } from "./constants";

/**
 * RAID (Risks, Assumptions, Issues, Dependencies) Tests
 *
 * Spec: specs/raid.spec.md
 *
 * Covers:
 * - Viewing the RAID register (Scenario 1)
 * - Denied access without GBA-VIEW-RAID (Scenario 2)
 * - Manage buttons visible with GBA-MANAGE-RAID (Scenario 3)
 * - Manage buttons hidden with view-only permission (Scenario 4)
 *
 * UI notes (from trace inspection):
 * - The grid is an AG Grid rendered as role="treegrid", NOT a native <table>
 * - Tabs: "All dependencies" | "All issues" (+ button to add more)
 * - Create button label: "Add dependency" (on the dependencies tab)
 * - Row context menu trigger: icon-only button in the leftmost column of each row
 *   — identified by its position as the first button within each data row
 *
 * Scenarios 2–4 mutate mock-server cookie state, so the full describe
 * block runs serially to prevent race conditions.
 */

test.describe("RAID Module @raid @permissions", () => {
  test.describe.configure({ mode: "serial" });

  // -------------------------------------------------------------------------
  // Scenario 1: View RAID list (default global-setup creds include GBA-VIEW-RAID)
  // -------------------------------------------------------------------------
  test("Scenario 1: should display the RAID list for users with GBA-VIEW-RAID", async ({
    page,
  }) => {
    // Given: default credentials include GBA-VIEW-RAID (from global-setup)
    // When: navigate to the RAID module
    await page.goto("/rid");
    await page.waitForLoadState(LOAD_STATE.DOM);

    // Then: the AG Grid treegrid is visible.
    // The treegrid data can be slow to render in CI, so we allow extra time.
    const raidGrid = page.getByRole("treegrid");
    await expect(raidGrid).toBeVisible({ timeout: TIMEOUT.LONG });

    // And: the "All dependencies" tab is present (using regex to handle flaky terminology keys)
    const dependenciesTab = page.getByRole("tab", { name: /All (dependencies|dependency\.value_plural_lower)/i });
    await expect(dependenciesTab).toBeVisible({ timeout: TIMEOUT.DEFAULT });
  });

  // -------------------------------------------------------------------------
  // Scenario 2: Deny access without GBA-VIEW-RAID
  // -------------------------------------------------------------------------
  test("Scenario 2: should deny access to users without GBA-VIEW-RAID", async ({
    page,
  }) => {
    // Given: user has app access but NOT GBA-VIEW-RAID
    await setMockPermissions(page, [PERM.APP_ACCESS]);
    await page.waitForTimeout(TIMEOUT.DEBOUNCE);

    // When: navigate to the RAID module
    await page.goto("/rid");
    await page.waitForLoadState(LOAD_STATE.IDLE);

    // Then: the treegrid is NOT rendered
    const raidGrid = page.getByRole("treegrid");
    await expect(raidGrid).toHaveCount(0);

    // And: either an access-denied message appears, or the RID nav link is absent
    const accessDenied = page.getByText(
      /You don't have access|Error Code: 403|no access|access denied|unauthorized/i
    );
    const ridNavLink = page.getByRole("link", { name: "RID" });
    const denied = await accessDenied.count() > 0;
    const navHidden = await ridNavLink.count() === 0;
    expect(denied || navHidden).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Scenario 3: Manage buttons visible with GBA-MANAGE-RAID
  // -------------------------------------------------------------------------
  test("Scenario 3: should show Add and context menu buttons for users with GBA-MANAGE-RAID", async ({
    page,
  }) => {
    // Given: user has both view and manage RAID permissions
    await setMockPermissions(page, [
      PERM.APP_ACCESS,
      PERM.VIEW_RAID,
      PERM.MANAGE_RAID,
    ]);
    await page.waitForTimeout(TIMEOUT.DEBOUNCE);

    // When: navigate to the RAID module (defaults to "All dependencies" tab)
    await page.goto("/rid");
    await page.waitForLoadState(LOAD_STATE.IDLE);

    // The grid might be slow to load, wait for it first
    const raidGrid = page.getByRole("treegrid");
    await expect(raidGrid).toBeVisible({ timeout: TIMEOUT.LONG });

    // Then: the "Add dependency" Create button is visible (handling terminology keys)
    const addButton = page.getByRole("button", { name: /add (dependency|dependency\.value_lower)/i });
    await expect(addButton).toBeVisible({ timeout: TIMEOUT.DEFAULT });

    // And: a row context menu trigger (...) is present in at least one data row
    // AG Grid marks data rows with a [row-index] attribute; header rows lack it.
    const dataRows = raidGrid.locator('[role="row"][row-index]');
    await expect(dataRows.first()).toBeVisible({ timeout: TIMEOUT.LONG });

    const firstRowContextBtn = dataRows.first().getByRole("button").first();
    await expect(firstRowContextBtn).toBeVisible({ timeout: TIMEOUT.DEFAULT });
  });

  // -------------------------------------------------------------------------
  // Scenario 4: Manage buttons disabled/hidden with view-only permission
  // -------------------------------------------------------------------------
  test("Scenario 4: should disable Add button and hide context menu buttons for view-only users", async ({
    page,
  }) => {
    // Given: user has view but NOT manage RAID permission
    await setMockPermissions(page, [
      PERM.APP_ACCESS,
      PERM.VIEW_RAID,
      // Deliberately omit PERM.MANAGE_RAID
    ]);
    await page.waitForTimeout(TIMEOUT.DEBOUNCE);

    // When: navigate to the RAID module
    await page.goto("/rid");
    await page.waitForLoadState(LOAD_STATE.IDLE);

    // Then: the grid loads but the "Add ..." Create button is disabled
    const raidGrid = page.getByRole("treegrid");
    await expect(raidGrid).toBeVisible({ timeout: TIMEOUT.LONG });

    const addButton = page.getByRole("button", { name: /add (dependency|dependency\.value_lower)|add (issue|issue\.value_lower)/i });
    await expect(addButton).toBeDisabled();

    // And: no row context menu trigger (...) is present in data rows
    // AG Grid marks data rows with a [row-index] attribute; header rows lack it.
    const dataRows = raidGrid.locator('[role="row"][row-index]');
    await expect(dataRows.first()).toBeVisible({ timeout: TIMEOUT.LONG });

    // Verify no context menu button (the "..." icon-only trigger) in rows
    const contextBtns = dataRows.first().getByRole("button");
    await expect(contextBtns).toHaveCount(0);
  });
});
