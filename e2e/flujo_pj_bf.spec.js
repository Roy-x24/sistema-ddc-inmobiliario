import { test, expect } from '@playwright/test';

const EMPLEADO = { correo: 'empleado@ddc.com', password: 'empleado123' };

function generarId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

test.describe('Flujo Persona Jurídica con Beneficiarios Finales', () => {
  test('registro completo, estado PENDIENTE BF y adjunto de documentos', async ({ page }) => {
    const id = generarId();
    const razon = `Empresa Test ${id} S.A.`;
    const ruc = `RUC-${id}`;

    await test.step('Login como empleado', async () => {
      await page.goto('/login');
      await page.fill('input[type="email"]', EMPLEADO.correo);
      await page.fill('input[type="password"]', EMPLEADO.password);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/dashboard');
    });

    await test.step('Registrar persona jurídica', async () => {
      await page.goto('/clientes/nuevo-juridica');
      await page.fill('input[name="razon_social"]', razon);
      await page.fill('input[name="ruc"]', ruc);
      await page.selectOption('select[name="tipo_pj"]', 'SA');
      await page.fill('input[name="pais_constitucion"]', 'PA');
      await page.fill('input[name="actividad_economica"]', 'Construcción inmobiliaria');
      await page.fill('input[name="domicilio_legal"]', 'Torre Banco, Piso 15, Ciudad de Panamá');
      await page.fill('input[name="telefono"]', '+507 200-0000');
      await page.fill('input[name="correo"]', `empresa.${id}@test.com`);
      await page.fill('input[name="proposito_adquisicion"]', 'Adquisición de terreno para desarrollo residencial');
      await page.getByTestId('btn-continuar').click();

      // Representante legal
      await page.fill('input[name="representante_legal.nombre_completo"]', 'María González');
      await page.fill('input[name="representante_legal.numero_identificacion"]', '8-987-654');
      await page.fill('input[name="representante_legal.cargo"]', 'Directora General');
      await page.fill('input[name="representante_legal.poderes_otorgados"]', 'Amplio y general para representar la empresa');
      await page.getByTestId('btn-continuar').click();

      // Beneficiario final (UBO)
      await page.fill('input[name="beneficiarios_finales.0.nombre_completo"]', 'Carlos Ruiz');
      await page.fill('input[name="beneficiarios_finales.0.numero_documento"]', '8-111-222');
      await page.fill('input[name="beneficiarios_finales.0.nacionalidad"]', 'Panameña');
      await page.fill('input[name="beneficiarios_finales.0.porcentaje_participacion"]', '50');
      await page.getByTestId('btn-continuar').click();

      // Perfil
      await page.fill('input[name="fuente_ingresos"]', 'Ventas de proyecto inmobiliario');
      await page.selectOption('select[name="rango_ingresos"]', '>15000');
      await page.fill('input[name="origen_fondos"]', 'Utilidades retenidas');
      await page.fill('input[name="monto_estimado"]', '750000');
      await page.getByTestId('btn-continuar').click();
      await page.getByTestId('btn-guardar').click();
    });

    await test.step('Verificar redirección y éxito', async () => {
      await expect(page).toHaveURL(/\/expediente\/.+/, { timeout: 15000 });
    });

    await test.step('Verificar estado PENDIENTE BF en detalle', async () => {
      await expect(page).toHaveURL(/\/expediente\/.+/);
      await expect(page.locator('text=PENDIENTE BF')).toBeVisible();
    });

    await test.step('Adjuntar documentos obligatorios de PJ', async () => {
      const clientId = page.url().split('/').pop();
      await page.goto(`/documentos/${clientId}`);

      await page.selectOption('select[name="tipo_documento"]', 'AVISO_OPERACION');
      await page.setInputFiles('input[type="file"]', 'test-files/cedula.pdf');
      await page.click('button:has-text("Confirmar y subir")');
      await expect(page.locator('text=Previsualizacion antes de subir')).toBeHidden();

      await page.selectOption('select[name="tipo_documento"]', 'CERTIFICADO_EXISTENCIA');
      await page.setInputFiles('input[type="file"]', 'test-files/comprobante_ingresos.jpg');
      await page.click('button:has-text("Confirmar y subir")');
      await expect(page.locator('text=Previsualizacion antes de subir')).toBeHidden();

      await page.selectOption('select[name="tipo_documento"]', 'IDENTIFICACION_REPRESENTANTE');
      await page.setInputFiles('input[type="file"]', 'test-files/comprobante_residencia.png');
      await page.click('button:has-text("Confirmar y subir")');
      await expect(page.locator('text=Previsualizacion antes de subir')).toBeHidden();

      await page.selectOption('select[name="tipo_documento"]', 'IDENTIFICACION_BENEFICIARIOS');
      await page.setInputFiles('input[type="file"]', 'test-files/beneficiario_id.pdf');
      await page.click('button:has-text("Confirmar y subir")');
      await expect(page.locator('text=Previsualizacion antes de subir')).toBeHidden();
    });

    await test.step('Verificar estado de documentos', async () => {
      await page.reload();
      await page.waitForTimeout(500);
      await page.waitForTimeout(500);
      const rows = page.locator('table tbody tr');
      console.log('TABLE TEXT PJ:', await page.locator('table tbody').innerText());
      await expect(rows.filter({ hasText: 'OBSERVADO' })).toHaveCount(4);
    });
  });
});
