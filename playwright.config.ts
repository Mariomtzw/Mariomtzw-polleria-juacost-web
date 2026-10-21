import { defineConfig } from "@playwright/test";

// E2E básico. Si defines E2E_BASE_URL, prueba contra esa URL. Si no, Playwright
// levanta `npm run dev` (o reutiliza el que ya corre en el puerto 3000) con el
// chat del sitio activado. Ojo: al reutilizar un servidor no se le inyectan
// variables, así que detén cualquier `npm run dev` que corra sin
// NEXT_PUBLIC_CHAT_ENABLED=1.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
        env: { NEXT_PUBLIC_CHAT_ENABLED: "1" },
      },
});
