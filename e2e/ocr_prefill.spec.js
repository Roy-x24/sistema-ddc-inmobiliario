import { test, expect } from '@playwright/test';

const EMPLEADO = { correo: 'empleado@ddc.com', password: 'empleado123' };

async function login(page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', EMPLEADO.correo);
  await page.fill('input[type="password"]', EMPLEADO.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
}

test.describe('Prellenado OCR del empleado', () => {
  test('muestra comparacion registrado vs detectado y permite aplicar campos', async ({ page }) => {
    await login(page);

    await page.goto('/clientes/nuevo');
    await page.fill('input[name="numero_documento"]', '8-000-000');
    await page.setInputFiles(
      'input[type="file"]',
      'test-files/Nombre completo Juan Perez 8-123-456 Pais Panama juan.test@example.com 6000-0000.pdf',
    );
    await page.getByRole('button', { name: /Analizar/ }).click();

    await expect(page.getByText('Datos detectados por OCR')).toBeVisible();
    await expect(page.getByText(/La IA no guarda cambios sin confirmacion humana/)).toBeVisible();
    await expect(page.getByText('Registrado').first()).toBeVisible();
    await expect(page.getByText('Detectado').first()).toBeVisible();
    await expect(page.getByTestId('ocr-field-numero_documento').getByText('8-123-456')).toBeVisible();

    const documentoCard = page.getByTestId('ocr-field-numero_documento');
    await documentoCard.getByRole('button', { name: /^Usar$/ }).click();
    await expect(page.locator('input[name="numero_documento"]')).toHaveValue('8-123-456');
    await expect(page.getByText(/Campo actualizado desde OCR: numero documento/)).toBeVisible();
  });
});
