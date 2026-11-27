import { defineConfig, devices } from "@playwright/test";

const chrome = process.env.PW_CHROME_PATH;

export default defineConfig({
  // Main tests live in tests/e2e. Showcase tests live next to the showcase pages and only run
  // when that folder exists.
  testDir: ".",
  testMatch: /(tests\/e2e|app\/\(showcase\)\/_e2e)\/.*\.spec\.ts$/,
  testIgnore: /node_modules/,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    ...(chrome ? { launchOptions: { executablePath: chrome, args: ["--no-sandbox"] } } : {}),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.BASE_URL
    ? undefined
    : [
        { command: "cd ../api && uvicorn app.main:app --port 8000", url: "http://localhost:8000/health", reuseExistingServer: true, timeout: 60_000 },
        { command: "npm run start", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
      ],
});
