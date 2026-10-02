import { defineConfig } from "@playwright/test";

// E2E básico. Requiere el servidor corriendo (npm run dev) o define E2E_BASE_URL.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
});
