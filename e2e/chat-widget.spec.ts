import { test, expect } from "@playwright/test";

test("el asistente responde en el sitio y Esc lo cierra", async ({ page }) => {
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, data: { reply: "Hola, ¿qué te gustaría pedir?" } }),
    }),
  );
  await page.goto("/");
  const launcher = page.getByRole("button", { name: "Pregúntanos" });
  await expect(launcher).toBeVisible();
  await launcher.click();
  const dialog = page.getByRole("dialog", { name: "Asistente de Pollos Juacos't" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Escribe tu mensaje").fill("¿Tienen pollo entero?");
  await dialog.getByRole("button", { name: "Enviar" }).click();
  await expect(dialog.getByText("Hola, ¿qué te gustaría pedir?")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(launcher).toBeFocused();
});

test("si el chat falla, ofrece los teléfonos", async ({ page }) => {
  await page.route("**/api/chat", (route) =>
    route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "No pude responder ahora. Llámanos o escríbenos por WhatsApp." }),
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Pregúntanos" }).click();
  const dialog = page.getByRole("dialog", { name: "Asistente de Pollos Juacos't" });
  await dialog.getByLabel("Escribe tu mensaje").fill("Hola");
  await dialog.getByRole("button", { name: "Enviar" }).click();
  await expect(dialog.getByRole("link", { name: "2282 10 53 30" })).toBeVisible();
});

test("el widget no aparece en el panel", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByLabel(/correo/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Pregúntanos" })).toHaveCount(0);
});
