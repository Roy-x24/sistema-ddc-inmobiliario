# Plan de Acción para Implementar Cambios Pendiendes — MVP DDC/KYC

**Sistema:** Sistema de Debida Diligencia de Clientes — Sector Inmobiliario  
**Universidad:** Universidad Tecnológica de Panamá (UTP)  
**Grupo:** 1GS-241  
**Profesora:** María Mosquera  
**Fecha:** 14 de junio de 2026  
**Referencia:** Análisis exhaustivo del código (contexto previo)

---

## 1. Resumen Ejecutivo

**Veredicto general:** El sistema está **parcialmente listo**, pero faltan ajustes críticos antes de pasar a QA. El backend core está sólido, el frontend tiene todas las pantallas, pero hay **3 bloqueos principales** que deben corregirse y **6 acciones inmediatas** que deben ejecutarse para declarar el MVP como "listo para QA".

**Lo que SÍ está listo:**
- Backend core: RBAC completo, refresh tokens, matriz de riesgo versionada, auditoría dual (admin + expediente), observaciones accionables, estados `PENDIENTE_BF`/`OBSERVADO`, SHA-256 en documentos, exportación CSV.
- BD: 17 tablas, seed determinista en `init.sql`, constraints y FKs correctos.
- Frontend: Todas las 20 páginas existen, routing protegido, `AdminShell`, manejo de sesión expirada.

---

## 2. Los 3 Bloqueos Principales (Críticos)

### Bloqueo 1: Bug en cálculo de riesgo
- **Archivo:** `backend/app/services/riesgo_service.py`
- **Líneas:** 180 y 196
- **Problema:** Usa `perfil_transaccional.monto_estimado` (campo inexistente) en lugar de `perfil_transaccional.monto_total_propiedad`. El fallback cualitativo falla con `AttributeError` si no hay matriz activa.
- **Impacto:** Ningún cliente puede calcularse riesgo sin matriz publicada. Toda la lógica de riesgo se rompe en el fallback.
- **Prioridad:** ALTA — debe corregirse antes de cualquier otra cosa.

### Bloqueo 2: Datos de Persona Jurídica descartados
- **Archivo:** `backend/app/routers/clientes.py` (líneas 67-116) y `backend/app/schemas/cliente.py` (líneas 55-58)
- **Problema:** El schema `PersonaJuridicaCreate` recibe `fuente_ingresos`, `rango_ingresos`, `origen_fondos`, `monto_estimado` pero el router nunca los asigna al modelo `PersonaJuridica` ni `Cliente`. Los datos se reciben por la API y se descartan silenciosamente.
- **Impacto:** La API miente al cliente (acepta campos que no guarda). Los perfiles financieros/transaccionales de PJ no pueden alimentar el motor de riesgo correctamente.
- **Prioridad:** ALTA — inconsistencia de contrato API.

### Bloqueo 3: Tests E2E vacíos
- **Archivos:** `e2e/flujo_pn.spec.js` y `e2e/flujo_pj_bf.spec.js`
- **Problema:** Son esqueletos de ~15 líneas. Solo hacen login y navegan a la página de registro. No interactúan con formularios, no suben documentos, no verifican estados.
- **Impacto:** No hay validación automatizada de los flujos críticos. QA no puede ejecutar suite de regresión.
- **Prioridad:** ALTA — requisito de entrega para el parcial.

---

## 3. Plan de Acción Paso a Paso (Orden de ejecución)

### Fase 1: Correcciones críticas de Backend (Bloqueos 1 y 2)
**Objetivo:** Eliminar los bugs que rompen funcionalidad core.
**Tiempo estimado:** 2-3 horas.
**Responsable:** Backend (Roy o quien tenga acceso a backend).

**Estado de la fase:**  
- [x] Paso 1.1 completado  
- [x] Paso 1.2 completado  

**Rama Git:** `feature/25-20-correcciones-backend-criticas`

**Reglas a seguir:**
1. Crear desde `master`.
2. Abrir PR hacia `qa`, nunca directo a `master`.
3. En el PR incluir: enlace al issue, resultado de pruebas, captura de evidencia.

---

#### Paso 1.1: Corregir bug en `riesgo_service.py`

- [x] **Listo**

**Archivo:** `backend/app/services/riesgo_service.py`

**Acciones concretas:**
 1. Abrir el archivo y localizar la función `_calcular_riesgo_cualitativo`.
2. Buscar las líneas 180 y 196 donde aparece `perfil_transaccional.monto_estimado`.
3. Reemplazar `perfil_transaccional.monto_estimado` por `perfil_transaccional.monto_total_propiedad` en ambas líneas.

**Ejemplo de cambio:**
```python
# Línea 180 - ANTES
if perfil_transaccional.monto_estimado and perfil_transaccional.monto_estimado > 500000:

# Línea 180 - DESPUÉS
if perfil_transaccional.monto_total_propiedad and perfil_transaccional.monto_total_propiedad > 500000:

# Línea 196 - ANTES
monto = perfil_transaccional.monto_estimado or 0

# Línea 196 - DESPUÉS
monto = perfil_transaccional.monto_total_propiedad or 0
```

**Verificación:**
- Ejecutar el backend.
- Registrar un cliente PN con perfil financiero y transaccional.
- Llamar `POST /clientes/{id}/riesgo/calcular` sin tener matriz activa.
- Confirmar que retorna 200 con nivel de riesgo calculado (no 500 por AttributeError).

---

#### Paso 1.2: Corregir persistencia de datos en `routers/clientes.py`

- [x] **Listo**

**Archivos:**
- `backend/app/routers/clientes.py`
- `backend/app/models/persona_juridica.py`
- `backend/app/schemas/cliente.py`

**Acciones concretas:**

1. Revisar si `PersonaJuridica` (modelo SQLAlchemy) tiene columnas para `fuente_ingresos`, `rango_ingresos`, `origen_fondos`, `monto_estimado`.
   - Si **NO** existen, hay dos opciones:
     - **Opción A (Recomendada):** Agregar las 4 columnas al modelo `PersonaJuridica` en `backend/app/models/persona_juridica.py`.
     - **Opción B:** Eliminar los 4 campos del schema `PersonaJuridicaCreate` si no aplican a PJ (pero esto requiere revisión de requerimientos).
   - Si **SÍ** existen, simplemente agregar la asignación en el router.

2. Si se agregan columnas al modelo, ejecutar `alembic revision --autogenerate -m "add_campos_financieros_pj"` (ver Paso 5.1) o regenerar `init.sql`.

3. En `backend/app/routers/clientes.py`, dentro de `registrar_persona_juridica`, agregar los campos al crear `PersonaJuridica`:

```python
pj = PersonaJuridica(
    id=cliente.id_cliente,
    razon_social=datos.razon_social,
    ruc=datos.ruc,
    tipo_pj=datos.tipo_pj,
    pais_constitucion=datos.pais_constitucion,
    actividad_economica=datos.actividad_economica,
    domicilio_legal=datos.domicilio_legal,
    telefono=datos.telefono,
    correo=datos.correo,
    proposito_adquisicion=datos.proposito_adquisicion,
    # NUEVO: agregar estos campos
    fuente_ingresos=datos.fuente_ingresos,
    rango_ingresos=datos.rango_ingresos,
    origen_fondos=datos.origen_fondos,
    monto_estimado=datos.monto_estimado
)
```

**Verificación:**
- Ejecutar backend.
- Llamar `POST /clientes/juridica` con todos los campos incluyendo los 4 nuevos.
- Llamar `GET /clientes/{id}` y confirmar que los 4 campos aparecen en la respuesta.
- Verificar que el motor de riesgo puede usar `monto_estimado` para PJ (si es la intención del diseño).

---

### Fase 2: Tests E2E Completos (Bloqueo 3)
**Objetivo:** Tener tests E2E que validen flujos críticos PN y PJ.
**Tiempo estimado:** 4-6 horas.
**Responsable:** QA (Angélica) o Frontend con apoyo de Backend.

**Estado de la fase:**  
- [x] Paso 2.1 completado  
- [x] Paso 2.2 completado  

**Rama Git:** `feature/32-tests-e2e-pn-pj-completos`

**Reglas a seguir:**
1. Crear desde `master`.
2. Abrir PR hacia `qa`, nunca directo a `master`.
3. En el PR incluir: enlace al issue, resultado de pruebas, captura de evidencia.

---

#### Paso 2.1: Completar `e2e/flujo_pn.spec.js`

- [x] **Listo**

**Archivo:** `e2e/flujo_pn.spec.js`

**Acciones concretas:**

1. Reemplazar el contenido actual con un test completo que incluya:
   - Login como empleado (`empleado@ddc.com` / `empleado123`).
   - Navegar a `/clientes/nuevo`.
   - Completar **Paso 1 — Datos personales:**
     - Seleccionar tipo de documento (cédula/pasaporte).
     - Llenar número de identificación, nombre completo, fecha de nacimiento, nacionalidad, país de residencia, dirección, teléfono, correo.
     - Marcar `es_pep` si aplica.
     - Avanzar al siguiente paso.
   - Completar **Paso 2 — Perfil:**
     - Seleccionar propósito de adquisición.
     - Llenar perfil financiero (fuente de ingresos, rango, origen de fondos, monto estimado).
     - Llenar perfil transaccional (monto total propiedad, método de pago, tipo de operación, banco origen).
     - Enviar formulario.
   - Verificar mensaje de éxito: `text=Cliente registrado`.
   - Verificar redirección a detalle del expediente o listado.
   - Adjuntar documentos (identidad, ingresos, residencia) en `/clientes/{id}/documentos`.
   - Verificar que documentos aparecen como `PENDIENTE`.
   - (Opcional avanzado) Login como OC, verificar documentos, aprobar, verificar que estado cambia a `EN_REVISION`, activar cliente.

2. Usar `page.fill()`, `page.selectOption()`, `page.click()`, `page.setInputFiles()` para interactuar con formularios.

3. Usar `test.step()` para agrupar pasos y mejorar legibilidad del reporte.

**Ejemplo de estructura (parcial):**
```javascript
import { test, expect } from '@playwright/test';

test('flujo completo persona natural', async ({ page }) => {
  await test.step('Login como empleado', async () => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'empleado@ddc.com');
    await page.fill('input[type="password"]', 'empleado123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  await test.step('Registrar persona natural', async () => {
    await page.goto('/clientes/nuevo');
    await page.fill('input[name="nombre_completo"]', 'Juan Pérez');
    await page.fill('input[name="numero_identificacion"]', '8-123-456');
    // ... completar todos los campos
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Cliente registrado')).toBeVisible();
  });

  await test.step('Adjuntar documentos', async () => {
    const url = page.url(); // /clientes/{id}
    const clientId = url.split('/').pop();
    await page.goto(`/clientes/${clientId}/documentos`);
    await page.setInputFiles('input[type="file"]', 'test-files/cedula.pdf');
    await page.selectOption('select[name="tipo_documento"]', 'DOCUMENTO_IDENTIDAD');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Documento adjuntado')).toBeVisible();
  });
});
```

**Verificación:**
- Ejecutar `npx playwright test e2e/flujo_pn.spec.js`.
- Confirmar que pasa en ambiente limpio con `docker-compose up`.
- Si falla, inspeccionar con `npx playwright show-report`.

---

#### Paso 2.2: Completar `e2e/flujo_pj_bf.spec.js`

- [x] **Listo**

**Archivo:** `e2e/flujo_pj_bf.spec.js`

**Acciones concretas:**

1. Replicar la estructura de `flujo_pn.spec.js` pero para Persona Jurídica.
2. Pasos adicionales obligatorios:
   - **Datos de la empresa:** razón social, RUC, tipo PJ, país de constitución, actividad económica, domicilio legal.
   - **Representante legal:** nombre completo, identificación, cargo, poderes otorgados.
   - **Beneficiarios finales:** agregar al menos 1 UBO con porcentaje >= 25% o control efectivo.
   - Verificar que `estado` del cliente empieza en `PENDIENTE_BF`.
   - (Opcional avanzado) Login como OC, aprobar beneficiarios finales, verificar que estado cambia a `PENDIENTE`.
   - Activar cliente con perfil financiero y transaccional completos.

3. Verificar que la suma de porcentajes de UBOs no excede 100% (caso negativo: intentar agregar 2 UBOs de 60% cada uno y esperar error).

**Verificación:**
- Ejecutar `npx playwright test e2e/flujo_pj_bf.spec.js`.
- Confirmar que pasa. Si falla, corregir selectores o agregar `data-testid` en frontend.

---

### Fase 3: Exportación CSV en Frontend
**Objetivo:** Agregar botón de exportación CSV en la UI.
**Tiempo estimado:** 1-2 horas.
**Responsable:** Frontend (Derlin o Eliel).

**Estado de la fase:**  
- [x] Paso 3.1 completado  

**Rama Git:** `feature/30-22-export-csv-seguridad-ui`

**Reglas a seguir:**
1. Crear desde `master`.
2. Abrir PR hacia `qa`, nunca directo a `master`.
3. En el PR incluir: enlace al issue, resultado de pruebas, captura de evidencia.

---

#### Paso 3.1: Agregar botón en `Auditoria.jsx`

- [x] **Listo**

**Archivo:** `frontend/src/pages/Auditoria.jsx`

**Acciones concretas:**

1. Localizar la sección de botones o acciones de la página (cerca de filtros o título).
2. Agregar un botón "Exportar CSV" condicional al rol:

```jsx
{ (usuario.rol === 'auditor' || usuario.rol === 'admin') && (
  <button
    onClick={exportarCSV}
    className="btn-exportar-csv"
    disabled={exportando}
  >
    {exportando ? 'Exportando...' : 'Exportar CSV'}
  </button>
)}
```

3. Crear la función `exportarCSV`:

```javascript
const exportarCSV = async () => {
  setExportando(true);
  try {
    const response = await api.get('/auditoria/exportar-csv', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `auditoria_expediente_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showMensaje('CSV exportado correctamente');
  } catch (error) {
    showError('Error al exportar CSV');
  } finally {
    setExportando(false);
  }
};
```

4. Agregar estado `exportando` (boolean) al componente.

5. (Opcional) Agregar botón similar para "Auditoría Administrativa" pero solo para rol `admin` (llamar a `/auditoria-admin/exportar-csv`).

**Verificación:**
- Login como auditor.
- Ir a `/auditoria`.
- Click en "Exportar CSV".
- Verificar que se descarga un archivo `.csv` con registros.
- Login como empleado y confirmar que el botón NO aparece.

---

### Fase 4: Seguridad UI en Documentos
**Objetivo:** Corregir que botones de aprobar/rechazar se filtren por rol.
**Tiempo estimado:** 30 minutos.

**Estado de la fase:**  
- [x] Paso 4.1 completado  

**Rama Git:** `feature/30-22-export-csv-seguridad-ui`

**Reglas a seguir:**
1. Crear desde `master`.
2. Abrir PR hacia `qa`, nunca directo a `master`.
3. En el PR incluir: enlace al issue, resultado de pruebas, captura de evidencia.

---

#### Paso 4.1: Filtrar botones por rol en `Documentos.jsx`

- [x] **Listo**

**Archivo:** `frontend/src/pages/Documentos.jsx`

**Acciones concretas:**

1. Buscar el renderizado de botones "Aprobar" y "Rechazar" para cada documento.
2. Agregar condición de rol:

```jsx
{ (usuario.rol === 'oficial_cumplimiento' || usuario.rol === 'admin') && doc.estado === 'PENDIENTE' && (
  <>
    <button onClick={() => verificarDocumento(doc.id_documento)}>Aprobar</button>
    <button onClick={() => rechazarDocumento(doc.id_documento)}>Rechazar</button>
  </>
)}
```

3. Asegurar que `usuario` esté disponible en el contexto o props de la página.

**Verificación:**
- Login como empleado.
- Ir a documentos de un cliente.
- Confirmar que NO aparecen botones Aprobar/Rechazar.
- Login como OC.
- Confirmar que SÍ aparecen botones para documentos `PENDIENTE`.

---

### Fase 5: Migraciones Alembic
**Objetivo:** Generar migraciones basadas en los modelos actuales.
**Tiempo estimado:** 1 hora.

**Estado de la fase:**  
- [ ] Paso 5.1 completado  

**Rama Git:** `feature/19-migraciones-alembic-inicial`

**Reglas a seguir:**
1. Crear desde `master`.
2. Abrir PR hacia `qa`, nunca directo a `master`.
3. En el PR incluir: enlace al issue, resultado de pruebas, captura de evidencia.

---

#### Paso 5.1: Generar migración inicial

- [ ] **Listo**

**Requisito:** Tener PostgreSQL corriendo (vía Docker).

**Acciones concretas:**

1. Asegurar que `backend/alembic.ini` apunte correctamente a la base de datos.
2. Ejecutar desde la carpeta `backend/`:

```bash
alembic revision --autogenerate -m "initial_migration"
```

3. Verificar que se crea un archivo en `backend/alembic/versions/`.
4. Revisar el archivo generado para confirmar que incluye todas las tablas.
5. Ejecutar la migración:

```bash
alembic upgrade head
```

6. Verificar en PostgreSQL que las tablas existen.

**Nota:** Si `init.sql` ya creó las tablas, Alembic podría no generar nada nuevo. En ese caso, la migración sirve como "snapshot" para futuros cambios. Considerar:
- Opción A: Eliminar las tablas y dejar que Alembic las cree (pierde seed).
- Opción B: Ajustar manualmente la migración para que sea idempotente (`IF NOT EXISTS`).
- Opción C: Dejar `init.sql` para el seed inicial y Alembic solo para evoluciones futuras.

**Recomendación:** Opción C. El `init.sql` es el seed inicial. Alembic se usa para cambios futuros del schema.

---

### Fase 6: Documentación (ADRs y Flujo Git)
**Objetivo:** Crear ADRs formales y documentar flujo de trabajo.
**Tiempo estimado:** 2-3 horas.

**Estado de la fase:**  
- [ ] Paso 6.1 completado  
- [ ] Paso 6.2 completado  

**Rama Git:** `docs/1-5-adrs-flujo-git`

**Reglas a seguir:**
1. Crear desde `master`.
2. Abrir PR hacia `qa`, nunca directo a `master`.
3. En el PR incluir: enlace al issue, resultado de pruebas, captura de evidencia.

---

#### Paso 6.1: Crear ADRs

- [ ] **Listo**

**Carpeta:** `docs/adr/` (crearla si no existe).

**Archivos a crear:**

1. `docs/adr/001-arquitectura-3-capas.md`
   - Decisión: Frontend React / Backend FastAPI / PostgreSQL.
   - Contexto: MVP académico de 3 semanas.
   - Consecuencias: Hot reload, CORS simple, Docker Compose orquestación.

2. `docs/adr/002-herencia-fk-1-1.md`
   - Decisión: `clientes` → `personas_naturales` / `personas_juridicas` por FK 1:1.
   - Alternativa: Tabla única con campos nullable.
   - Justificación: Evita tablas anchas, validaciones específicas por tipo, extensible.

3. `docs/adr/003-jwt-localstorage.md`
   - Decisión: Access token 15 min + refresh token 7 días en localStorage.
   - Alternativa: Cookies httpOnly.
   - Justificación: SPA con Vite, simplicidad para MVP. Riesgo XSS mitigado por CORS restringido.

4. `docs/adr/004-matriz-riesgo-cualitativa.md`
   - Decisión: Reglas cualitativas (PEP, país, monto, estructura) en lugar de matriz de puntos.
   - Justificación: Contexto regulatorio panameño, criterio del Oficial es tan importante como reglas automáticas.

5. `docs/adr/005-admin-bypass-rol.md`
   - Decisión: Admin tiene bypass total en frontend (`RutaProtegida`).
   - Justificación: Perfil superusuario necesario para gestión de matriz y usuarios sin depender de permisos parciales.

**Plantilla por ADR:**
```markdown
# ADR-XXX: [Título]

## Estado
Aceptado

## Contexto
[¿Qué problema resolvía?]

## Decisión
[¿Qué se decidió?]

## Consecuencias
[Positivas y negativas]
```

---

#### Paso 6.2: Documentar flujo Git

- [ ] **Listo**

**Archivo:** `CONTRIBUTING.md` (crear en raíz).

**Contenido mínimo:**

```markdown
# Flujo de trabajo Git

## Ramas
- `master`: Producción estable.
- `qa`: Integración y pruebas.
- `feature/XXX-descripcion`: Desarrollo de issue.

## Proceso
1. Crear rama desde `master`.
2. Desarrollar el issue.
3. Abrir PR hacia `qa`.
4. Revisión obligatoria:
   - Arquitecto (César) para cambios de modelos/API.
   - QA (Angélica) para issues funcionales.
5. Merge a `qa` solo con evidencia de pruebas.
6. Cierre de épica cuando todos los sub-issues están cerrados.

## Templates de PR
- Enlace al issue.
- Resultado de pruebas.
- Captura o log de evidencia.
```

---

### Fase 7: Mejoras de Calidad y Seguridad (Opcional pero recomendado)
**Tiempo estimado:** 3-4 horas.

**Estado de la fase:**  
- [ ] Paso 7.1 completado  
- [ ] Paso 7.2 completado  
- [ ] Paso 7.3 completado  
- [ ] Paso 7.4 completado  
- [ ] Paso 7.5 completado  

**Rama Git:** `feature/33-mejoras-calidad-frontend`

**Reglas a seguir:**
1. Crear desde `master`.
2. Abrir PR hacia `qa`, nunca directo a `master`.
3. En el PR incluir: enlace al issue, resultado de pruebas, captura de evidencia.

---

#### Paso 7.1: Implementar validación de formularios con `react-hook-form`

- [ ] **Listo**

**Archivos:** `frontend/src/pages/RegistroNatural.jsx`, `RegistroJuridica.jsx`, `Perfiles.jsx`, etc.

**Acciones:**
1. Importar `react-hook-form` en las páginas con formularios.
2. Reemplazar manejo manual de estado `useState` por `useForm()`.
3. Agregar validaciones por campo (`required`, `minLength`, `pattern` para email, etc.).
4. Usar `FormField` y `Input` de `components/ui/` en lugar de inputs nativos.
5. Mostrar errores por campo debajo de cada input.

**Ejemplo:**
```jsx
import { useForm } from 'react-hook-form';
import { FormField } from '../components/ui/FormField';

const { register, handleSubmit, formState: { errors } } = useForm();

<FormField
  label="Correo electrónico"
  error={errors.correo?.message}
>
  <input
    {...register('correo', { required: 'Correo es obligatorio', pattern: { value: /\S+@\S+\.\S+/, message: 'Correo inválido' } })}
  />
</FormField>
```

---

#### Paso 7.2: Usar componentes UI existentes

- [ ] **Listo**

**Archivos:** Todas las páginas con tablas, modales, alertas.

**Acciones:**
1. Reemplazar tablas HTML nativas por `<Tabla />`.
2. Reemplazar modales inline por `<Modal />`.
3. Reemplazar alertas inline por `<Alerta />`.
4. Reemplazar botones inline por `<Boton />`.

---

#### Paso 7.3: URL de backend desde variable de entorno

- [ ] **Listo**

**Archivo:** `frontend/src/api/axiosConfig.js`

**Cambio:**
```javascript
// ANTES
const api = axios.create({ baseURL: 'http://localhost:8000' });

// DESPUÉS
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000' });
```

Agregar `VITE_API_URL=http://localhost:8000` en `.env.example` y `frontend/.env`.

---

#### Paso 7.4: Eliminar código huérfano

- [ ] **Listo**

**Archivos a eliminar o integrar:**
- `frontend/src/config/routeConfig.js` → eliminar si no se usará.
- `frontend/src/shells/AppShell.jsx` → eliminar si no se usará.
- `frontend/src/pages/Administracion.jsx` → eliminar (versión duplicada no usada).

---

#### Paso 7.5: Paginación en tablas

- [ ] **Listo**

**Archivo:** `frontend/src/pages/ListadoClientes.jsx` y backend.

**Acciones:**
1. Backend: `clientes.py` GET ya usa `skip`/`limit` pero el frontend usa `limit=9999`.
2. Frontend: Agregar controles de paginación (botones "Anterior"/"Siguiente" y selector de tamaño de página).
3. Backend: Asegurar que `GET /clientes` devuelve `total` para calcular páginas.

---

## 4. Plan de Ejecución para Hoy (14 de junio de 2026)

**Ejecutor:** Derlin Romero (Tú) — Backend + Frontend + QA + Documentación
**Meta:** Cerrar el MVP para QA en una jornada intensiva.
**Nota:** Todo lo que diga "(tú)" significa que eres tú quien lo hace.

### Orden de ejecución priorizado para HOY

| Orden | Fase | Paso | Rama Git | Tiempo Est. | Prioridad | Estado |
|---|---|---|---|---|---|---|
| **1** | Fase 1 | Paso 1.1 (Bug riesgo) | `feature/25-20-correcciones-backend-criticas` | 30 min | 🔴 Bloqueo crítico | [x] |
| **2** | Fase 1 | Paso 1.2 (Persistencia PJ) | `feature/25-20-correcciones-backend-criticas` | 1 hr | 🔴 Bloqueo crítico | [x] |
| **3** | Fase 4 | Paso 4.1 (Seguridad UI docs) | `feature/30-22-export-csv-seguridad-ui` | 30 min | 🟡 Riesgo seguridad | [x] |
| **4** | Fase 3 | Paso 3.1 (CSV frontend) | `feature/30-22-export-csv-seguridad-ui` | 1 hr | 🟡 Requisito funcional | [x] |
| **5** | Fase 2 | Paso 2.1 (Test PN) | `feature/32-tests-e2e-pn-pj-completos` | 2-3 hrs | 🟡 Requisito QA | [x] |
| **6** | Fase 2 | Paso 2.2 (Test PJ) | `feature/32-tests-e2e-pn-pj-completos` | 2-3 hrs | 🟡 Requisito QA | [x] |
| **7** | Fase 5 | Paso 5.1 (Migraciones Alembic) | `feature/19-migraciones-alembic-inicial` | 30 min | 🔵 Infraestructura | [ ] |
| **8** | Fase 6 | Paso 6.1 (ADRs) | `docs/1-5-adrs-flujo-git` | 1 hr | 🔵 Documentación | [ ] |
| **9** | Fase 6 | Paso 6.2 (Flujo Git) | `docs/1-5-adrs-flujo-git` | 30 min | 🔵 Documentación | [ ] |

**Total estimado para HOY:** 8-9 horas de trabajo concentrado (si se hace en orden y sin interrupciones).

### Post-MVP (si queda tiempo o para mañana)

| Fase | Paso | Rama Git | Nota |
|---|---|---|---|
| Fase 7 | Paso 7.1-7.5 (Mejoras calidad) | `feature/33-mejoras-calidad-frontend` | Opcional. No bloquea QA. |

---

## 5. Definición de "Listo para QA"

El sistema se considerará **listo para QA** cuando se cumplan estas condiciones:

- [x] Paso 1.1 completado: `riesgo_service.py` usa `monto_total_propiedad` correctamente.
- [x] Paso 1.2 completado: `clientes.py` persiste todos los campos de `PersonaJuridicaCreate`.
- [x] Paso 2.1 y 2.2 completados: Tests E2E de PN y PJ pasan en ambiente limpio.
- [x] Paso 3.1 completado: Botón de exportación CSV visible y funcional para auditor/admin.
- [x] Paso 4.1 completado: Botones de aprobar/rechazar documentos filtrados por rol.
- [ ] Paso 5.1 completado: Migración Alembic generada (aunque sea inicial/placeholder).
- [ ] Paso 6.1 completado: Al menos 3 ADRs creados.
- [ ] Paso 6.2 completado: `CONTRIBUTING.md` con flujo Git definido.
- [x] Docker Compose levanta sin errores: `docker-compose up --build`.
- [x] Smoke test de Playwright pasa: `npx playwright test e2e/smoke.spec.js`.
- [x] Flujo PN E2E pasa: `npx playwright test e2e/flujo_pn.spec.js`.
- [x] Flujo PJ E2E pasa: `npx playwright test e2e/flujo_pj_bf.spec.js`.

---

## 6. Notas para el Equipo

### 6.1 Convención de commits
Usar mensajes descriptivos que referencien el issue:
```
fix(riesgo): corrige uso de monto_total_propiedad en fallback

Closes #25

Refs: #25
```

### 6.2 Ramas por issue
Seguir la convención del archivo `asignacion_issues_ddc_kyc_actualizada.md`:
```
feature/25-corregir-fallback-riesgo
feature/20-persistencia-pj
feature/30-export-csv-frontend
feature/32-tests-e2e-pn-pj
```

### 6.3 Evidencia de pruebas
Cada PR debe incluir:
- Screenshot de Playwright report (pass).
- Screenshot de Swagger `/docs` con endpoints probados (si es backend).
- Descripción de casos negativos probados (400, 403, 409).

### 6.4 Comunicación de bloqueos
Si un issue no puede cerrarse por dependencia de otro, documentar en el PR:
- ¿Qué dependencia falta?
- ¿Está mockeada o simplemente no implementada?
- ¿Cuál es el impacto en el flujo de trabajo?

---

*Plan generado automáticamente el 14 de junio de 2026.*
