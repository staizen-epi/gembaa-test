import { chromium, type FullConfig } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import { BASE_URL } from "./tests/constants";

/**
 * Global setup: Authenticates with the Gembaa Mock Cognito Server.
 *
 * Reads mock-cognito-config.json, directly fills the mock server form fields,
 * applies ISS overrides, clears existing cookies, sets new ones, and saves
 * the authenticated browser state for reuse across all tests.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || BASE_URL;
  const configPath = path.resolve(__dirname, "docs/mock-cognito-config.json");
  const mockConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to mock server
  const mockUrl = mockConfig.mockServerUrl || `${baseURL}/mock/`;
  await page.goto(mockUrl);
  await page.waitForLoadState("networkidle");

  // --- Fill Access Token Claims ---
  const accessTokenTextbox = page.getByRole("textbox", {
    name: "Access Token:",
  });
  await accessTokenTextbox.click();
  await accessTokenTextbox.clear();
  await accessTokenTextbox.fill(JSON.stringify(mockConfig.accessTokenClaims));

  // --- Fill Identity Value ---
  const identityTextbox = page.getByRole("textbox", {
    name: "Identity value:",
  });
  await identityTextbox.click();
  await identityTextbox.clear();
  await identityTextbox.fill(mockConfig.identity);

  // --- Fill Identity Token Claims ---
  const idTokenTextbox = page.getByRole("textbox", {
    name: "Identity Token Claims:",
  });
  await idTokenTextbox.click();
  await idTokenTextbox.clear();
  await idTokenTextbox.fill(JSON.stringify(mockConfig.idTokenClaims));

  // --- Handle Access Token ISS override ---
  const atIss = mockConfig.tokenOptions?.accessToken?.issuer;
  if (atIss?.useCustomValue) {
    // Bootstrap btn-check: click the label instead of the checkbox
    // The checkbox id is "accessTokenOptionAddIssuerCustom"
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

  // --- Handle Identity Token ISS override ---
  const idIss = mockConfig.tokenOptions?.identityToken?.issuer;
  if (idIss?.useCustomValue) {
    // Bootstrap btn-check: click the label instead of the checkbox
    // The checkbox id for ID token would be similar pattern
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

  // --- Click "Clear Cookie" then "Set Cookie" ---
  await page.getByRole("button", { name: "Clear Cookie" }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Set Cookie" }).click();
  await page.waitForTimeout(1000);

  // Verify no errors in debug output
  const debugOutput = await page
    .getByRole("textbox")
    .last()
    .inputValue()
    .catch(() => "");
  if (debugOutput.includes("ERROR")) {
    console.error("⚠️  Mock server debug output:", debugOutput);
  }

  // Save the authenticated state (cookies) for all tests to reuse
  const storageStatePath = path.resolve(__dirname, "auth/storage-state.json");
  const authDir = path.dirname(storageStatePath);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  await context.storageState({ path: storageStatePath });

  await browser.close();

  console.log(
    "✅ Authentication setup complete — cookies saved to auth/storage-state.json"
  );
}
