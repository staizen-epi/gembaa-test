import { Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { LOAD_STATE } from "./constants";

/**
 * Sets mock Cognito permissions for the current test.
 *
 * Navigates to the mock server, directly fills the Access Token textbox
 * with updated cognito:groups, applies ISS overrides, and sets cookies.
 *
 * @param page - Playwright Page object
 * @param groups - Array of permission groups to assign (e.g., ["PER-VIEW-PERMISSIONS"])
 */
export async function setMockPermissions(page: Page, groups: string[]) {
  // Load base mock configuration
  const configPath = path.resolve(__dirname, "../docs/mock-cognito-config.json");
  const mockConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  // Update the groups in access token claims
  const updatedClaims = { ...mockConfig.accessTokenClaims };
  updatedClaims["cognito:groups"] = groups;

  // Navigate to mock server
  const baseURL = "http://localhost:1880";
  const mockUrl = mockConfig.mockServerUrl || `${baseURL}/mock/`;
  await page.goto(mockUrl);
  await page.waitForLoadState(LOAD_STATE.DOM);

  // Fill Access Token textbox
  const accessTokenTextbox = page.getByRole("textbox", {
    name: "Access Token:",
  });
  await accessTokenTextbox.click();
  await accessTokenTextbox.clear();
  await accessTokenTextbox.fill(JSON.stringify(updatedClaims));

  // Fill Identity textbox
  const identityTextbox = page.getByRole("textbox", {
    name: "Identity value:",
  });
  await identityTextbox.click();
  await identityTextbox.clear();
  await identityTextbox.fill(mockConfig.identity);

  // Fill Identity Token Claims textbox
  const updatedIdClaims = { ...mockConfig.idTokenClaims };
  // remove default app_roles if any so they don't bypass GBA-APP-ACCESS
  updatedIdClaims["custom:app_roles"] = "[]";

  const idTokenTextbox = page.getByRole("textbox", {
    name: "Identity Token Claims:",
  });
  await idTokenTextbox.click();
  await idTokenTextbox.clear();
  await idTokenTextbox.fill(JSON.stringify(updatedIdClaims));

  // Handle Access Token ISS override
  const atIss = mockConfig.tokenOptions?.accessToken?.issuer;
  if (atIss?.useCustomValue) {
    const atIssLabel = page.locator(
      'label[for="accessTokenOptionAddIssuerCustom"]'
    );
    const atIssCheckbox = page.locator('#accessTokenOptionAddIssuerCustom');
    if (!(await atIssCheckbox.isChecked())) {
      await atIssLabel.click();
    }

    const issValueInputs = page.getByRole("textbox", {
      name: "<issuer identifier>",
    });
    const atIssInput = issValueInputs.nth(0);
    await atIssInput.click();
    await atIssInput.clear();
    await atIssInput.fill(atIss.customValue);
  }

  // Handle Identity Token ISS override
  const idIss = mockConfig.tokenOptions?.identityToken?.issuer;
  if (idIss?.useCustomValue) {
    const idIssLabel = page.locator(
      'label[for="identityTokenOptionAddIssuerCustom"]'
    );
    const idIssCheckbox = page.locator('#identityTokenOptionAddIssuerCustom');
    if (!(await idIssCheckbox.isChecked())) {
      await idIssLabel.click();
    }

    const issValueInputs = page.getByRole("textbox", {
      name: "<issuer identifier>",
    });
    const idIssInput = issValueInputs.nth(1);
    await idIssInput.click();
    await idIssInput.clear();
    await idIssInput.fill(idIss.customValue);
  }

  // Clear and set cookie
  await page.getByRole("button", { name: "Clear Cookie" }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Set Cookie" }).click();
  await page.waitForTimeout(500);

  console.log(`🔑 Permissions set: ${groups.join(", ")}`);
}
