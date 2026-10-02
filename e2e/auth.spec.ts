import { test, expect } from "@playwright/test";

// Prueba crítica de seguridad: el módulo privado NO debe ser accesible sin sesión.
test("una ruta privada redirige al login sin sesión", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
});

test("el login muestra el formulario del dueño", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByLabel(/correo/i)).toBeVisible();
  await expect(page.getByLabel(/contraseña/i)).toBeVisible();
});
