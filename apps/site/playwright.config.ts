import { defineConfig, devices } from "@playwright/test";

const offUrl = "http://127.0.0.1:5195";
const labUrl = "http://127.0.0.1:5196";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  outputDir: "/tmp/blackcrown-experience-traces/playwright",
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "VITE_BC_EXPERIENCE_MODE=off VITE_BC_EXPERIENCE_DEBUG=0 corepack pnpm dev --host 127.0.0.1 --port 5195",
      url: offUrl,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "VITE_BC_EXPERIENCE_MODE=lab VITE_BC_EXPERIENCE_DEBUG=1 corepack pnpm dev --host 127.0.0.1 --port 5196",
      url: labUrl,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "chromium-off",
      grep: /@off/,
      use: { ...devices["Desktop Chrome"], baseURL: offUrl, viewport: { width: 1440, height: 900 } },
    },
    {
      name: "webkit-off",
      grep: /@off/,
      use: { ...devices["iPhone 14"], baseURL: offUrl, viewport: { width: 390, height: 844 } },
    },
    {
      name: "chromium-lab",
      grep: /@lab/,
      use: { ...devices["Desktop Chrome"], baseURL: labUrl, viewport: { width: 1440, height: 900 } },
    },
    {
      name: "webkit-lab",
      grep: /@lab/,
      use: { ...devices["iPhone 14"], baseURL: labUrl, viewport: { width: 390, height: 844 } },
    },
  ],
});
