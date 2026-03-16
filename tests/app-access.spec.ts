import { test, expect } from "@playwright/test";
import { setMockPermissions } from "./auth-helper";
import { LABEL, LOAD_STATE, ONBOARDING_BUTTONS, PERM, TIMEOUT } from "./constants";

/**
 * App Access Control Tests
 *
 * Spec: specs/app-access.spec.md
 */

test.describe("App Access Control @app-access @permissions", () => {
  // Force serial execution — both tests mutate cookie state on the
  // same shared mock-Cognito server, so parallel runs cause races.
  test.describe.configure({ mode: "serial" });

  test("Scenario 1: User with App Access Token successfully loads the app", async ({
    page,
  }) => {
    // Given: user HAS GBA-APP-ACCESS permission
    await setMockPermissions(page, [PERM.APP_ACCESS]);

    // Brief wait so the mock-server cookie is fully committed
    await page.waitForTimeout(TIMEOUT.DEBOUNCE);

    // When: navigate to application root
    await page.goto("/");
    await page.waitForLoadState(LOAD_STATE.DOM);

    // Dismiss any onboarding dialogs that might appear
    for (const name of ONBOARDING_BUTTONS) {
      try {
        const btn = page.getByRole("button", { name, exact: true }).first();
        await btn.waitFor({ state: "visible", timeout: TIMEOUT.SHORT });
        await btn.click();
        await page.waitForLoadState(LOAD_STATE.IDLE);
      } catch (e) { }
    }

    // Then: the user successfully loads the application (dashboard or normal pages load)
    // We expect the main app elements to be visible instead of an access denied page
    const noAccessText = page.getByText(/You don't have access|Error Code: 403|no access|access denied|unauthorized/i);
    await expect(noAccessText).toHaveCount(0);

    // Look for a common app element, e.g. the toggle menu or user button
    const userMenuButton = page.getByRole("button", { name: LABEL.USER_MENU_BUTTON });
    await expect(userMenuButton).toBeVisible({ timeout: TIMEOUT.DEFAULT });
  });

  test("Scenario 2: User without App Access Token is denied access", async ({
    page,
  }) => {
    // Given: user does NOT have GBA-APP-ACCESS permission
    await setMockPermissions(page, []);

    // When: navigate to application root
    await page.goto("/");
    await page.waitForLoadState(LOAD_STATE.DOM);

    // Dismiss any onboarding dialogs that might appear
    for (const name of ONBOARDING_BUTTONS) {
      try {
        const btn = page.getByRole("button", { name, exact: true }).first();
        await btn.waitFor({ state: "visible", timeout: TIMEOUT.SHORT });
        await btn.click();
        await page.waitForLoadState(LOAD_STATE.IDLE);
      } catch (e) { }
    }

    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log("Scenario 2 DOM Body Text:");
    console.log(bodyText.substring(0, 500));

    // Then: the user should see an access denied or unauthorized page
    const noAccessText = page.getByText(/You don't have access|Error Code: 403|no access|access denied|unauthorized/i);
    await expect(noAccessText.first()).toBeVisible({ timeout: TIMEOUT.DEFAULT });
  });
});
