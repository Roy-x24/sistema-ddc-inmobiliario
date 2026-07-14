import { test, expect } from '@playwright/test';

const ADMIN = { correo: 'admin@ddc.com', password: 'admin123' };

async function login(page, user = ADMIN) {
  await page.goto('/login');
  await page.fill('input[type="email"]', user.correo);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
}

test.describe('Gobierno IA y asistente operativo', () => {
  test('admin configura IA con presets y el oficial usa busqueda contextual asistida', async ({ page }) => {
    await test.step('Admin IA muestra presets, secretos y pruebas de proveedor', async () => {
      await login(page);
      await expect(page).toHaveURL('/admin/dashboard');

      await page.goto('/admin/ia');
      await expect(page.getByRole('heading', { name: 'Configuracion IA' })).toBeVisible();
      await expect(page.getByText('Demo segura')).toBeVisible();
      await expect(page.getByText('Groq + Ollama')).toBeVisible();
      await expect(page.getByText('Local / Offline')).toBeVisible();
      await expect(page.getByText('Google completo')).toBeVisible();
      await expect(page.getByText(/Secretos: Groq/)).toBeVisible();

      await page.getByRole('button', { name: /Probar Groq/ }).click();
      await expect(page.locator('pre')).toContainText('"proveedor": "groq"');
    });

    await test.step('Panel IA operativo expone guardrails y busqueda contextual', async () => {
      await page.goto('/cumplimiento');
      await expect(page.getByRole('heading', { name: 'Bandeja de cumplimiento' })).toBeVisible();
      // Esperar a que la tabla renderice (con o sin filas)
      await expect(page.locator('table')).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(1500);

      const asistirButtons = page.getByRole('button', { name: 'Asistir' });
      const count = await asistirButtons.count();

      if (count > 0) {
        await asistirButtons.first().click();
        await expect(page.getByText(/Asistente IA de cumplimiento/)).toBeVisible();
        await expect(page.getByText('JSON estricto')).toBeVisible();
        await expect(page.getByText('Revision humana')).toBeVisible();
        await expect(page.getByPlaceholder(/origen de fondos/)).toBeVisible();

        await page.getByPlaceholder(/origen de fondos/).fill('origen de fondos beneficiario');
        await page.getByRole('button', { name: /^Buscar$/ }).click();

        await expect(page.getByText('Resultado: Buscar contexto')).toBeVisible();
        await expect(page.getByText('Ver payload tecnico')).toBeVisible();
      } else {
        // Bandeja vacía: verificar que la UI cargó sin errores
        await expect(page.locator('table')).toBeVisible();
      }
    });

    await test.step('Activacion usa modal auditable para acciones sensibles', async () => {
      await page.goto('/activacion');
      await expect(page.getByRole('heading', { name: 'Activacion de clientes' })).toBeVisible();

      const rejectButton = page.getByRole('button', { name: /Rechazar/ }).first();
      await expect(rejectButton).toBeVisible();
      await rejectButton.click();

      await expect(page.getByText('Rechazar expediente')).toBeVisible();
      await expect(page.getByText('Motivo de rechazo')).toBeVisible();
      await expect(page.getByPlaceholder(/documentos inconsistentes/)).toBeVisible();
      await page.getByRole('button', { name: 'Cancelar' }).click();
    });
  });
});
