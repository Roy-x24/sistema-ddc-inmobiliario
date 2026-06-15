import { test, expect } from '@playwright/test';

const EMPLEADO = { correo: 'empleado@ddc.com', password: 'empleado123' };

function generarId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

test.describe('Flujo Persona Natural', () => {
  test('registro completo, adjunto de documentos y estado inicial', async ({ page }) => {
    const id = generarId();
    const nombre = `Juan_${id}`;
    const apellido = `Pérez_${id}`;
    const numeroDoc = `8-${id}`;

    await test.step('Login como empleado', async () => {
      await page.goto('/login');
      await page.fill('input[type="email"]', EMPLEADO.correo);
      await page.fill('input[type="password"]', EMPLEADO.password);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/dashboard');
    });

    await test.step('Registrar persona natural — paso 1', async () => {
      await page.goto('/clientes/nuevo');
      await page.fill('input[name="nombres"]', nombre);
      await page.fill('input[name="apellidos"]', apellido);
      await page.selectOption('select[name="tipo_documento"]', 'CEDULA');
      await page.fill('input[name="numero_documento"]', numeroDoc);
      await page.fill('input[name="fecha_nacimiento"]', '1985-06-15');
      await page.fill('input[name="nacionalidad"]', 'Panameña');
      await page.fill('input[name="pais_residencia"]', 'PA');
      await page.fill('input[name="direccion"]', 'Calle 50, Ciudad de Panamá');
      await page.fill('input[name="telefono"]', '+507 6000-0000');
      await page.fill('input[name="correo"]', `juan.${id}@test.com`);
      await page.fill('input[name="ocupacion"]', 'Ingeniero de software');
      await page.check('input[name="es_pep"]');
      await page.click('button:has-text("Siguiente")');
    });

    await test.step('Registrar persona natural — paso 2', async () => {
      await page.fill('input[name="fuente_ingresos"]', 'Salario mensual');
      await page.selectOption('select[name="rango_ingresos"]', '5001-15000');
      await page.fill('input[name="origen_fondos"]', 'Ahorros personales');
      await page.fill('input[name="proposito_transaccion"]', 'Compra de vivienda');
      await page.fill('input[name="monto_estimado"]', '350000');
      await page.click('button:has-text("Guardar cliente")');
    });

    await test.step('Verificar redirección y éxito', async () => {
      await expect(page).toHaveURL('/clientes');
      await expect(page.locator(`text=${nombre} ${apellido}`)).toBeVisible();
    });

    await test.step('Navegar a detalle del expediente', async () => {
      const row = page.locator('tr', { hasText: `${nombre} ${apellido}` }).first();
      await row.click();
      await expect(page).toHaveURL(/\/expediente\/.+/);
    });

    await test.step('Adjuntar documentos de identidad', async () => {
      const clientId = page.url().split('/').pop();
      await page.goto(`/documentos/${clientId}`);
      await page.selectOption('select[name="tipo_documento"]', 'DOCUMENTO_IDENTIDAD');
      await page.setInputFiles('input[type="file"]', 'test-files/cedula.pdf');
      await page.click('button:has-text("Subir documento")');
      await expect(page.locator('text=Documento subido correctamente')).toBeVisible();
    });

    await test.step('Adjuntar documento de ingresos', async () => {
      await page.selectOption('select[name="tipo_documento"]', 'COMPROBANTE_INGRESOS');
      await page.setInputFiles('input[type="file"]', 'test-files/comprobante_ingresos.jpg');
      await page.click('button:has-text("Subir documento")');
      await expect(page.locator('text=Documento subido correctamente')).toBeVisible();
    });

    await test.step('Adjuntar documento de residencia', async () => {
      await page.selectOption('select[name="tipo_documento"]', 'COMPROBANTE_RESIDENCIA');
      await page.setInputFiles('input[type="file"]', 'test-files/comprobante_residencia.png');
      await page.click('button:has-text("Subir documento")');
      await expect(page.locator('text=Documento subido correctamente')).toBeVisible();
    });

    await test.step('Verificar estado de documentos', async () => {
      const rows = page.locator('table tbody tr');
      await expect(rows.filter({ hasText: 'PENDIENTE VERIFICACION' })).toHaveCount(3);
    });
  });
});
