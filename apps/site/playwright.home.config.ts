import { defineConfig, devices } from "@playwright/test";

// Tests the already-built production-mode app, not a dev-mode substitute.
export default defineConfig({
  testDir: "./tests/integration",
  testMatch: "home.spec.ts",
  timeout: 75_000,
  expect: { timeout: 20_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "reports/integration-qa/home-results.json" }]],
  outputDir: "reports/integration-qa/browser",
  use: {
    baseURL: "http://127.0.0.1:5197",
    serviceWorkers: "block",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "corepack pnpm exec vite preview --host 127.0.0.1 --port 5197 --strictPort",
    url: "http://127.0.0.1:5197",
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    { name: "chromium-home", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "webkit-home-portrait", use: { ...devices["iPhone 14"], viewport: { width: 390, height: 844 } } },
    { name: "webkit-home-landscape", use: { ...devices["iPhone 14 landscape"], viewport: { width: 844, height: 390 } } },
  ],
});
