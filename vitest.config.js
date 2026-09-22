import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        // Pure backend unit tests (no database).
        test: {
          name: "backend-unit",
          globals: true,
          environment: "node",
          include: ["backend/**/*.test.js"],
          exclude: ["backend/test/**", "**/node_modules/**"],
        },
      },
      {
        // Backend API/integration tests against the test database.
        test: {
          name: "backend-api",
          globals: true,
          environment: "node",
          include: ["backend/test/**/*.test.js"],
          globalSetup: ["backend/test/globalSetup.js"],
          setupFiles: ["backend/test/setup.js"],
          fileParallelism: false,
          testTimeout: 20000,
          hookTimeout: 30000,
        },
      },
      {
        // Frontend component tests.
        plugins: [react()],
        test: {
          name: "frontend",
          globals: true,
          environment: "happy-dom",
          setupFiles: ["frontend/src/setupTests.js"],
          include: ["frontend/src/**/*.{test,spec}.{js,jsx}"],
          css: true,
        },
      },
    ],
  },
});
