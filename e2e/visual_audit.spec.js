import { test, expect } from '@playwright/test';
import path from 'node:path';

const ARTIFACT_DIR = path.join('artifacts', 'visual-audit');

const USERS = {
  empleado: { correo: 'empleado@ddc.com', password: 'empleado123' },
  oficial: { correo: 'oficial@ddc.com', password: 'oficial123' },
  admin: { correo: 'admin@ddc.com', password: 'admin123' },
};

const TARGETS = [
  { role: 'empleado', path: '/dashboard', name: 'empleado-dashboard', heading: /Dashboard/ },
  { role: 'empleado', path: '/documentos', name: 'empleado-documentos', heading: /Documentos/ },
  { role: 'oficial', path: '/cumplimiento', name: 'oficial-cumplimiento', heading: /Bandeja de cumplimiento/ },
  { role: 'oficial', path: '/activacion', name: 'oficial-activacion', heading: /Activacion de clientes/ },
  { role: 'oficial', path: '/beneficiarios', name: 'oficial-beneficiarios', heading: /Beneficiarios Finales/ },
  { role: 'oficial', path: '/observaciones', name: 'oficial-observaciones', heading: /Observaciones/ },
  { role: 'admin', path: '/admin/dashboard', name: 'admin-dashboard', heading: /Dashboard Admin/ },
  { role: 'admin', path: '/admin/ia', name: 'admin-ia', heading: /Configuracion IA/ },
  { role: 'admin', path: '/admin/screening', name: 'admin-screening', heading: /Listas locales/ },
];

const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 1000 },
  { label: 'mobile', width: 390, height: 844 },
];

async function login(page, user) {
  await page.goto('/login');
  await page.fill('input[type="email"]', user.correo);
  await page.fill('input[type="password"]', user.password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);
}

test.describe('Auditoria visual runtime', () => {
  for (const viewport of VIEWPORTS) {
    test(`captura pantallas clave en ${viewport.label}`, async ({ page }) => {
      test.setTimeout(120000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      const consoleErrors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => consoleErrors.push(error.message));

      let currentRole = null;
      for (const target of TARGETS) {
        if (currentRole !== target.role) {
          await page.goto('/login');
          await page.evaluate(() => localStorage.clear());
          await login(page, USERS[target.role]);
          currentRole = target.role;
        }

        await page.goto(target.path);
        await expect(page.getByRole('heading', { name: target.heading })).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(700);
        await page.screenshot({
          path: path.join(ARTIFACT_DIR, `${viewport.label}-${target.name}.png`),
          fullPage: false,
        });
      }

      expect(consoleErrors.filter((error) => !/favicon|ResizeObserver/i.test(error))).toEqual([]);
    });
  }
});
