import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for Gembaa test automation.
 *
 * BASE_URL env var points to the Docker-hosted application.
 * Default: http://localhost:1880
 */
export default defineConfig({
  // Global setup: authenticate via mock Cognito server before tests
  globalSetup: "./global-setup.ts",

  // Look for test files in the "tests" directory
  testDir: "./tests",

  // Maximum time a test can run (30 seconds)
  timeout: 30_000,

  // Expect timeout (5 seconds)
  expect: {
    timeout: 5_000,
  },

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if test.only is left in the source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests (2 retries on CI, 0 locally)
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration — HTML + console list
  reporter: [
    ["list"],
    ["html", { open: "never" }]
  ],

  // Shared settings for all projects
  use: {
    // Base URL for all tests — points to Docker app
    baseURL: process.env.BASE_URL || "http://localhost:1880",

    // Capture screenshot at the end of every test
    screenshot: "on",

    // Record trace for every test (very helpful for debugging)
    trace: "on",

    // Record video on failure
    video: "on-first-retry",

    // Use saved auth state from global setup
    storageState: "auth/storage-state.json",
  },

  // Browser projects
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    // Uncomment to test in Firefox
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // Uncomment to test in WebKit (Safari)
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});
