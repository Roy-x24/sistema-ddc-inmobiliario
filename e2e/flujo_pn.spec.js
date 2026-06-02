import { test, expect } from '@playwright/test';

test('flujo completo persona natural', async ({ page }) => {
  // Login como empleado
  await page.goto('/login');
  await page.fill('input[type="email"]', 'empleado@ddc.com');
  await page.fill('input[type="password"]', 'empleado123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');

  // Registrar PN
  await page.goto('/clientes/nuevo');
  // ... pasos de registro
  await expect(page.locator('text=Cliente registrado')).toBeVisible();
});
