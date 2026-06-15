import { test, expect } from '@playwright/test';

test('smoke - carga de login y dashboard', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('h2')).toContainText('Iniciar sesión');
  await page.fill('input[type="email"]', 'empleado@ddc.com');
  await page.fill('input[type="password"]', 'empleado123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
