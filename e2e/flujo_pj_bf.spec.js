import { test, expect } from '@playwright/test';

test('flujo persona juridica con beneficiarios finales', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'empleado@ddc.com');
  await page.fill('input[type="password"]', 'empleado123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');

  // Registrar PJ
  await page.goto('/clientes/nuevo-juridica');
  // ... pasos
  await expect(page.locator('text=Cliente registrado')).toBeVisible();
});
