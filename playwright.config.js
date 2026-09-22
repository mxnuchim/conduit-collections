import { defineConfig, devices } from "@playwright/test";

// Drive the real UI (Vite dev server) against the backend running on the test
// database. Both servers are started by Playwright and torn down afterwards.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run start -w backend",
      url: "http://localhost:3001/",
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
      env: { NODE_ENV: "test", PORT: "3001" },
    },
    {
      command: "npm run dev -w frontend",
      url: "http://localhost:3000/",
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],
});
