# Prompt Maestro v3 — Sistema DDC/KYC Inmobiliario
> Documento de contexto completo para generación del proyecto por un agente de IA.
> Leer este archivo completo antes de generar cualquier código o archivo.
> **Esta es la versión definitiva. Reemplaza cualquier versión anterior (v2 y anteriores).**

---

## 0. Decisiones Conscientes del MVP

Estas son decisiones tomadas intencionalmente. El agente NO debe "corregirlas" ni sugerir alternativas salvo que se indique explícitamente.

| Decisión | Razón |
|----------|-------|
| JWT almacenado en `localStorage` | Simplicidad del MVP académico. Se acepta el riesgo XSS conscientemente. |
| Sin MFA ni OAuth | Fuera de alcance definido. |
| Sin notificaciones externas (email/SMS) | Fuera de alcance definido. |
| Sin OCR ni firma digital | Fuera de alcance definido. |
| Sin multi-tenant | Una sola promotora por instancia en el MVP. |
| Sin módulo de administración de usuarios | Usuarios creados via seed. Admin solo accede a matriz de riesgo. |
| Documentos guardados en disco local (`/app/uploads/`) | Sin S3/MinIO en el MVP. |
| Soft delete con campo `eliminado` | No hay endpoint de eliminación expuesto en el MVP. Los listados siempre filtran `eliminado = false`. |
| Refresh token en BD hasheado | Sesión única: nuevo login revoca sesión anterior. |
| Matriz de riesgo versionada en BD | Configurable por Admin sin tocar código. |

---

## 1. Contexto del Proyecto

### ¿Qué es?
Un **Módulo de Debida Diligencia de Clientes (DDC/KYC)** web enfocado en el sector inmobiliario panameño. Digitaliza y automatiza el proceso de conocer, verificar y evaluar el riesgo de compradores e inversionistas para promotoras inmobiliarias obligadas por la **Ley 23 de 2015 de la República de Panamá**.

### ¿Por qué el sector inmobiliario?
El sector inmobiliario es uno de los vectores más utilizados globalmente para el lavado de dinero:
- Las transacciones involucran montos elevados de dinero en efectivo o transferencias
- Es común la participación de personas jurídicas complejas: sociedades anónimas, fideicomisos, fundaciones
- Existen compradores internacionales con estructuras de propiedad opacas
- La SSNF exige controles KYC estrictos antes de formalizar cualquier compraventa de bien inmueble

### ¿A quiénes va dirigido?
Sujetos Obligados No Financieros según el Artículo 23 de la Ley 23 de 2015, supervisados por la **Superintendencia de Sujetos No Financieros (SSNF)**:
- Promotoras inmobiliarias registradas en la República de Panamá
- Agentes y corredores de bienes raíces autorizados
- Empresas constructoras involucradas en la venta o desarrollo de proyectos inmobiliarios

### ¿Qué problema resuelve?
Muchas promotoras hacen el proceso KYC manualmente, lo que genera:
- Errores humanos en el registro de información del cliente
- Retrasos en la revisión y aprobación de expedientes
- Inconsistencias en la documentación recopilada
- Dificultades para demostrar trazabilidad durante auditorías de la SSNF
- Riesgo de incumplimiento regulatorio y sanciones

### Base legal
- **Ley 23 de 27 de abril de 2015** — Prevención de Blanqueo de Capitales, Financiamiento del Terrorismo y FPADM
- Estándares **GAFI/FATF**
- Supervisión: **SSNF** (Superintendencia de Sujetos No Financieros)

### Contexto de uso
El sistema es una herramienta interna. Lo usan empleados de la promotora para registrar y verificar clientes compradores, no los clientes directamente. El empleado registra la información y adjunta documentos físicos escaneados. El Oficial de Cumplimiento valida. El Auditor revisa los logs. El Admin gestiona la matriz de riesgo.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + Vite | React 18 / Vite 5 |
| Estilos | Tailwind CSS | v3 |
| Backend | Python + FastAPI | Python 3.11 / FastAPI 0.100+ |
| Base de datos | PostgreSQL | 15 |
| ORM | SQLAlchemy + Alembic | SQLAlchemy 2.0 |
| Contenedores | Docker + Docker Compose | Docker 24+ |
| QA / Métricas | SonarQube Community Edition | Latest |
| Control de versiones | GitHub | Git 2.40+ |
| Gestor frontend | **pnpm** (NO usar npm ni yarn) | Latest |
| Gestor backend | pip + requirements.txt | — |
| Testing E2E | Playwright | Latest |

### Instalación local requerida (solo esto)
- Docker Desktop
- Git
- VSCode
- pnpm (`npm install -g pnpm`)

> Todo corre dentro de contenedores. No se necesita instalar Python ni PostgreSQL localmente.

### Gestión de usuarios y roles
- **Sin módulo de administración de usuarios** en el MVP
- Los usuarios se crean automáticamente via **seed script (init.sql)** cuando Docker levanta PostgreSQL por primera vez
- El archivo `init.sql` se mapea a `/docker-entrypoint-initdb.d/` en el contenedor
- Autenticación con **JWT + Refresh Token** (sin MFA, sin OAuth)
- **Sesión única:** un nuevo login revoca automáticamente el refresh token anterior del mismo usuario

### Usuarios precargados (seed)
```sql
-- 5 usuarios con roles fijos para el MVP
empleado@ddc.com          → rol: empleado
oficial@ddc.com           → rol: oficial_cumplimiento
auditor@ddc.com           → rol: auditor
admin@ddc.com             → rol: admin
demo_empleado@ddc.com     → rol: empleado  (para demos E2E)
```
Las contraseñas se almacenan como hash bcrypt, nunca en texto plano.

---

## 3. Estructura de Carpetas

```
ddc-kyc-sistema/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                        # Entry point FastAPI + CORS
│   │   ├── database.py                    # Conexión PostgreSQL con SQLAlchemy
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── usuario.py
│   │   │   ├── refresh_token.py           # Sesión única — refresh tokens hasheados
│   │   │   ├── cliente.py                 # Modelo base abstracto Cliente
│   │   │   ├── persona_natural.py
│   │   │   ├── persona_juridica.py
│   │   │   ├── representante_legal.py
│   │   │   ├── beneficiario_final.py      # UBO — solo para PJ, requiere validación OC
│   │   │   ├── documento.py
│   │   │   ├── perfil_financiero.py
│   │   │   ├── perfil_transaccional.py
│   │   │   ├── matriz_riesgo.py           # Versiones de matriz + factores + detalles
│   │   │   ├── clasificacion_riesgo.py
│   │   │   ├── observacion.py             # Observaciones accionables por OC
│   │   │   ├── auditoria.py               # Auditoría de expediente
│   │   │   └── auditoria_admin.py         # Auditoría administrativa separada
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── cliente.py
│   │   │   ├── documento.py
│   │   │   ├── perfil.py
│   │   │   ├── riesgo.py
│   │   │   ├── observacion.py
│   │   │   └── auditoria.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                    # CU-00: Login + Refresh + Logout
│   │   │   ├── clientes.py                # CU-01, CU-03
│   │   │   ├── documentos.py              # CU-04, CU-08
│   │   │   ├── perfiles.py                # CU-05, CU-06
│   │   │   ├── beneficiarios.py           # CU-BF: captura y validación OC
│   │   │   ├── riesgo.py                  # CU-15
│   │   │   ├── activacion.py              # CU-11
│   │   │   ├── observaciones.py           # CU-OBS
│   │   │   ├── admin.py                   # Admin: gestión matriz de riesgo
│   │   │   └── auditoria.py               # CU-17 + exportación CSV
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── riesgo_service.py          # Motor de riesgo versionado
│   │   │   ├── estado_service.py          # Máquina de estados del expediente
│   │   │   ├── auditoria_service.py       # Auditoría de expediente
│   │   │   └── auditoria_admin_service.py # Auditoría administrativa
│   │   └── core/
│   │       ├── __init__.py
│   │       ├── config.py
│   │       ├── security.py                # JWT: crear y verificar tokens + hash refresh
│   │       └── rbac.py                    # Dependencias RBAC por rol y acción
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── seed_demo.py                       # Seed determinista para demos y E2E
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx                        # routeConfig centralizado
│   │   ├── api/
│   │   │   └── axiosConfig.js             # Axios + interceptor JWT + refresh automático
│   │   ├── context/
│   │   │   └── AuthContext.jsx            # Estado global: usuario, rol, tokens
│   │   ├── config/
│   │   │   └── routeConfig.js             # Rutas con roles requeridos por ruta
│   │   ├── shells/
│   │   │   ├── AppShell.jsx               # Shell operativo (Empleado, OC, Auditor)
│   │   │   └── AdminShell.jsx             # Shell admin (solo rol admin)
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── SesionExpirada.jsx
│   │   │   ├── NoAutorizado.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ListadoClientes.jsx
│   │   │   ├── RegistroNatural.jsx
│   │   │   ├── RegistroJuridica.jsx
│   │   │   ├── DetalleExpediente.jsx
│   │   │   ├── Documentos.jsx
│   │   │   ├── BeneficiarioFinal.jsx
│   │   │   ├── Perfiles.jsx
│   │   │   ├── Riesgo.jsx
│   │   │   ├── Activacion.jsx
│   │   │   ├── Observaciones.jsx
│   │   │   ├── Auditoria.jsx
│   │   │   └── admin/
│   │   │       └── MatrizRiesgo.jsx       # UI Admin para editar matriz
│   │   └── components/
│   │       ├── Navbar.jsx
│   │       ├── Sidebar.jsx
│   │       ├── RutaProtegida.jsx          # Verifica rol antes de renderizar
│   │       ├── EstadoBadge.jsx
│   │       ├── RiesgoIndicador.jsx
│   │       ├── ui/                        # Componentes base reutilizables
│   │       │   ├── Boton.jsx
│   │       │   ├── Input.jsx
│   │       │   ├── Select.jsx
│   │       │   ├── Modal.jsx
│   │       │   ├── Alerta.jsx
│   │       │   ├── Tabla.jsx
│   │       │   ├── Insignia.jsx
│   │       │   ├── Pestanas.jsx
│   │       │   ├── Cajon.jsx
│   │       │   ├── FormField.jsx
│   │       │   └── FileUpload.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── package.json
│   └── Dockerfile
├── database/
│   └── init.sql                           # Tablas + seed de usuarios
├── e2e/
│   ├── playwright.config.js
│   ├── flujo_pn.spec.js
│   ├── flujo_pj_bf.spec.js
│   └── smoke.spec.js
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. Docker Compose

```yaml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: ddc_user
      POSTGRES_PASSWORD: ddc_pass
      POSTGRES_DB: ddc_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://ddc_user:ddc_pass@db:5432/ddc_db
      SECRET_KEY: clave_secreta_jwt_cambiar_en_produccion
      ALGORITHM: HS256
      ACCESS_TOKEN_EXPIRE_MINUTES: 15
      REFRESH_TOKEN_EXPIRE_DAYS: 7
      INACTIVITY_TIMEOUT_MINUTES: 30
    depends_on:
      - db
    volumes:
      - ./backend:/app
      - ./uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    command: pnpm dev --host
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

> **IMPORTANTE:** Los documentos subidos se guardan en el volumen `./uploads` mapeado al contenedor. Esto evita que los archivos se pierdan al reiniciar el contenedor.

---

## 5. MVP — Alcance Funcional

### Flujo principal (crítico e indispensable)
```
Login (CU-00) → Registro Cliente (CU-01) → Adjuntar Documentos (CU-04)
→ Verificar Documentos (CU-08) → [Si PJ: Capturar BF (CU-BF)]
→ Perfil Financiero (CU-05) → Perfil Transaccional (CU-06)
→ Calcular Riesgo (CU-15) → Observaciones si aplica (CU-OBS)
→ Activar/Rechazar Cliente (CU-11) → Auditoría (CU-17)
```

### Plan de sprints

| Semana | Casos de Uso | Objetivo |
|--------|-------------|----------|
| 1 | CU-00, CU-01, CU-03 | Login + Refresh + RBAC + Registro + Consulta |
| 2 | CU-04, CU-08, CU-BF, CU-05, CU-06 | Documentos, BF y perfiles |
| 3 | CU-15, CU-OBS, CU-11, CU-17 | Riesgo versionado, estados, observaciones y auditoría |

### Lo que NO se implementa en el MVP
- Notificaciones automáticas (email/SMS)
- Reportes avanzados ni exportación PDF
- Integración con SSNF, UAF, listas OFAC/ONU reales
- Firma digital
- OCR
- Reconocimiento biométrico
- Dashboard con gráficas avanzadas
- Microservicios
- MFA, OAuth
- Multi-tenant
- Reapertura de expedientes rechazados
- Múltiples sesiones activas por usuario
- Roles dinámicos creados por Admin (los roles son fijos)

---

## 6. Casos de Uso del MVP

### CU-00 — Iniciar Sesión
**Actor:** Todos los roles
**Flujo:**
1. Usuario ingresa correo y contraseña
2. Backend valida credenciales contra la BD
3. Backend genera access token (15 min) y refresh token (7 días, hasheado en BD)
4. Si el usuario tenía sesión previa, el refresh token anterior queda revocado
5. Frontend almacena ambos tokens en `localStorage`
6. Todas las peticiones posteriores llevan el access token en `Authorization: Bearer <token>`

**Validaciones:** Credenciales incorrectas devuelven 401.

---

### CU-00b — Renovar Sesión (Refresh)
**Actor:** Sistema (automático via interceptor Axios)
**Flujo:**
1. Interceptor detecta respuesta 401 en cualquier petición
2. Frontend llama `POST /auth/refresh` con el refresh token
3. Backend verifica hash del refresh token en BD y que no esté revocado
4. Backend emite nuevo access token
5. Si el refresh token también expiró o fue revocado → redirigir a `/sesion-expirada`

---

### CU-00c — Cierre por Inactividad
**Actor:** Sistema (frontend)
**Flujo:**
1. Frontend detecta inactividad del usuario por más de `INACTIVITY_TIMEOUT_MINUTES`
2. Frontend llama `POST /auth/logout`
3. Backend revoca el refresh token en BD
4. Frontend limpia `localStorage` y redirige a `/sesion-expirada`

---

### CU-01 — Registrar Cliente
**Actor:** Empleado
**Tipos:** Persona Natural o Persona Jurídica

**Persona Natural — campos obligatorios:**
- Nombre completo
- Tipo de documento: Cédula / Pasaporte
- Número de identificación (único en BD)
- Fecha de nacimiento (mínimo 18 años)
- Nacionalidad
- País de residencia actual
- Dirección completa
- Teléfono con código de país
- Correo electrónico
- Ocupación o actividad económica
- ¿Es PEP? (Sí/No — si es Sí, riesgo sube automáticamente a ALTO)
- Fuente de ingresos
- Rango de ingresos mensuales (rangos predefinidos: <$1,000 / $1,001-$5,000 / $5,001-$15,000 / >$15,000)
- Propósito de la transacción inmobiliaria
- Origen de los fondos para la compra
- Monto estimado de la transacción (USD)

**Persona Jurídica — campos obligatorios:**
- Razón social
- RUC o número de registro (único en BD)
- Tipo de persona jurídica (SA, SRL, fideicomiso, fundación, etc.)
- País de constitución
- Actividad económica principal
- Dirección fiscal o domicilio legal
- Teléfono y correo oficial
- Propósito de la adquisición del inmueble
- **Representante Legal:** nombre, identificación, cargo, poderes otorgados

**Post-condición:**
- PN creada en estado `PENDIENTE`
- PJ creada en estado `PENDIENTE_BF` (no puede avanzar hasta tener al menos un BF validado por OC)

---

### CU-BF — Registrar y Validar Beneficiario Final
**Actor:** Empleado (captura) / Oficial de Cumplimiento (validación)

**Captura por Empleado:**
- Nombre completo
- Número de documento
- Nacionalidad
- Porcentaje de participación (≥25% o control efectivo)
- Tipo de control: directo / indirecto / representación
- ¿Es PEP?

**Validaciones:**
- Suma de porcentajes no puede superar 100% → devuelve 400
- BF con porcentaje ≥ 25% se marca como relevante automáticamente

**Validación por OC:**
- OC revisa y aprueba o rechaza cada BF
- PJ sin al menos un BF aprobado por OC no puede pasar de `PENDIENTE_BF`
- Al tener BF aprobado, el sistema cambia estado PJ a `PENDIENTE`

---

### CU-03 — Consultar Clientes
**Actor:** Empleado, Oficial, Auditor
**Funciones:**
- Tabla paginada de clientes
- Búsqueda por nombre, cédula/RUC, estado
- Filtro por tipo de cliente (Natural/Jurídica)
- Vista de detalle en modo solo lectura
- Respuesta en menos de 2 segundos

---

### CU-04 — Adjuntar Documento
**Actor:** Empleado
**Flujo:**
1. Empleado accede al expediente del cliente
2. Selecciona tipo de documento
3. Carga el archivo
4. Sistema valida: formato (PDF/JPG/PNG), tamaño (máx 10 MB)
5. Sistema calcula SHA-256 del archivo y lo guarda como metadato
6. Sistema guarda el archivo en `/app/uploads/` con nombre UUID
7. Sistema guarda en BD el registro con estado `PENDIENTE_VERIFICACION`
8. La ruta interna del archivo **nunca se expone públicamente**

**Documentos por tipo de cliente:**

*Persona Natural:*
- Documento de identidad vigente (cédula o pasaporte)
- Comprobante de ingresos
- Comprobante de residencia (no mayor a 3 meses)
- Carta de referencia bancaria (si aplica por riesgo)
- Declaración de origen de fondos (si monto supera umbral)

*Persona Jurídica:*
- Aviso de operación vigente
- Certificado de existencia y representación legal
- Identificación del representante legal
- Identificación de beneficiarios finales
- Estructura corporativa u organigrama
- Estados financieros (si aplica por riesgo)
- Poder notarial del representante (si aplica)

---

### CU-08 — Verificar Documento
**Actor:** Oficial de Cumplimiento
**Flujo aprobar:**
1. Oficial accede a bandeja de documentos pendientes
2. Descarga o visualiza el documento — **acción queda auditada**
3. Selecciona "Aprobar"
4. Sistema cambia estado a `VERIFICADO`
5. Sistema registra en auditoría: quién, cuándo, acción

**Flujo rechazar:**
1. Oficial selecciona "Rechazar"
2. Ingresa motivo obligatorio — devuelve 400 si está vacío
3. Sistema cambia estado a `RECHAZADO`
4. Sistema registra en auditoría

**Post-condición:** Cuando todos los documentos obligatorios están en `VERIFICADO`, el expediente puede pasar a `EN_REVISION`.

---

### CU-05 — Registrar Perfil Financiero
**Actor:** Empleado
**Campos:**
- Fuente de ingresos
- Rango de ingresos mensuales
- Origen de los fondos para la compra
- Patrimonio declarado aproximado

**Post-condición:** Al guardar, si el perfil transaccional ya existe, el sistema dispara automáticamente CU-15.

---

### CU-06 — Registrar Perfil Transaccional
**Actor:** Empleado
**Campos (contexto inmobiliario):**
- Monto total de la propiedad (USD)
- Método de pago predominante (transferencia, cheque de gerencia, financiamiento, mixto)
- Tipo de operación (residencia propia, inversión, alquiler, otro)
- Banco de origen de fondos (opcional)
- Financiamiento bancario (Sí/No — si Sí, banco y monto del préstamo)

**Validación:** El monto total debe ser mayor a $0.

**Post-condición:** Al guardar, si el perfil financiero ya existe, el sistema dispara automáticamente CU-15.

---

### CU-15 — Calcular Riesgo Automáticamente
**Actor:** Sistema (automático)
**Trigger:** Al completar perfil financiero Y perfil transaccional

**Motor de riesgo versionado:**

El cálculo usa la **versión activa** de la matriz de riesgo almacenada en BD. Cada cálculo guarda la versión usada para trazabilidad.

**Estructura de la matriz:**
- Cada versión tiene **factores de riesgo** con peso numérico y flag activo/inactivo
- Factores pueden ser **positivos** (suman riesgo) o **mitigantes** (restan riesgo)
- Algunos factores son **bloqueantes**: si se cumplen, el resultado es ALTO sin importar el puntaje
- Puntaje bruto máximo: 100 (se trunka si supera)
- Puntaje final mínimo: 0 (los mitigantes no bajan de 0)

**Factores bloqueantes (resultado siempre ALTO):**
- `es_pep = true`
- País de residencia/constitución en lista de alto riesgo (lista en BD)
- `origen_fondos IN ('efectivo', 'desconocido', 'otro_no_verificable')`

**Factores por puntaje (ejemplos base en seed):**

| Factor | Puntaje | Tipo |
|--------|---------|------|
| Monto > $500,000 | +40 | positivo |
| Monto $100,000–$500,000 | +20 | positivo |
| PJ extranjera (fideicomiso/fundación) | +30 | positivo |
| PJ extranjera (SA/SRL) | +15 | positivo |
| Financiamiento bancario documentado | -10 | mitigante |
| PJ nacional con documentación completa | -5 | mitigante |
| Ingresos verificables en rango consistente con monto | -5 | mitigante |

**Umbrales de nivel:**
- Puntaje final < 30 → **BAJO**
- Puntaje final 30–69 → **ESTÁNDAR**
- Puntaje final ≥ 70 → **ALTO**
- Cualquier bloqueante → **ALTO** (ignora puntaje)

**REGLA CRÍTICA:** Si el nivel calculado es ALTO, el cliente NO puede activarse sin confirmación manual adicional del Oficial.

**Almacenamiento:** Guardar en `clasificaciones_riesgo`: puntaje bruto, puntaje final, nivel, justificación, `factores_aplicados` (JSONB con desglose), `version_matriz_id`, `es_automatica = true`.

**Flag `requiere_reevaluacion`:** Si Admin publica una nueva versión de la matriz, todos los expedientes en estado `EN_REVISION` o `ACTIVO` reciben `requiere_reevaluacion = true`.

---

### CU-OBS — Observaciones Accionables
**Actor:** Oficial de Cumplimiento (crea y cierra) / Empleado (responde)

**Flujo:**
1. OC crea observación sobre un expediente → expediente pasa a estado `OBSERVADO`
2. Empleado responde la observación desde su panel
3. OC cierra la observación
4. Si no quedan observaciones abiertas, el expediente puede volver a `EN_REVISION`

**Validaciones:**
- Un expediente con observaciones abiertas **no puede activarse ni rechazarse**
- Cada observación tiene: descripción, respuesta del empleado, estado (abierta/cerrada), fecha

---

### CU-11 — Activar o Rechazar Cliente
**Actor:** Oficial de Cumplimiento

**Precondiciones para activar:**
- Todos los documentos obligatorios en estado `VERIFICADO`
- Perfil financiero completo
- Perfil transaccional completo
- Riesgo calculado
- Sin observaciones abiertas
- Si es PJ: al menos un BF aprobado por OC
- Si riesgo es ALTO: confirmación manual adicional obligatoria

**Transiciones:**
- Riesgo BAJO o ESTÁNDAR completo: `EN_REVISION` → `ACTIVO`
- Riesgo ALTO con confirmación: `EN_REVISION` → `ACTIVO`
- Bloqueo: `ACTIVO` → `BLOQUEADO` (requiere motivo obligatorio)
- Desbloqueo: `BLOQUEADO` → `ACTIVO`
- Rechazo final: `EN_REVISION` o `PENDIENTE` → `RECHAZADO` (con justificación obligatoria)

---

### CU-17 — Auditoría de Expediente
**Actor:** Sistema (automático) — Consulta: Auditor y Oficial
**Trigger:** Cualquier acción relevante sobre el expediente

**Tabla `auditorias` (expediente):**

| Campo | Descripción |
|-------|-------------|
| id | UUID PK |
| usuario | Correo del usuario que ejecutó la acción |
| accion | Tipo de acción (ver lista abajo) |
| cliente_id | UUID del cliente afectado |
| valor_anterior | Estado o valor antes del cambio |
| valor_nuevo | Estado o valor después del cambio |
| fecha | Timestamp exacto del evento |

**Acciones registradas en auditoría de expediente:**
- `CREAR_CLIENTE`
- `ADJUNTAR_DOCUMENTO`
- `VERIFICAR_DOCUMENTO`
- `RECHAZAR_DOCUMENTO`
- `DESCARGAR_DOCUMENTO`
- `VER_DOCUMENTO`
- `REGISTRAR_PERFIL_FINANCIERO`
- `REGISTRAR_PERFIL_TRANSACCIONAL`
- `CALCULAR_RIESGO`
- `CREAR_OBSERVACION`
- `RESPONDER_OBSERVACION`
- `CERRAR_OBSERVACION`
- `CAMBIAR_ESTADO`
- `ACTIVAR_CLIENTE`
- `RECHAZAR_CLIENTE`
- `BLOQUEAR_CLIENTE`
- `DESBLOQUEAR_CLIENTE`
- `REGISTRAR_BF`
- `VALIDAR_BF`
- `RECHAZAR_BF`

**Exportación CSV:**
- Auditor y Admin pueden exportar CSV de auditoría de expediente
- Admin puede exportar CSV de auditoría administrativa
- Empleado recibe 403 al intentar exportar
- La exportación misma queda registrada en auditoría administrativa

---

### CU-ADM — Gestión de Matriz de Riesgo
**Actor:** Admin

**Flujo:**
1. Admin accede a `AdminShell` → sección Matriz de Riesgo
2. Admin puede editar pesos y umbrales de factores existentes
3. Admin puede activar/desactivar factores
4. Admin publica nueva versión → versión anterior queda archivada
5. La versión publicada se usa en todos los cálculos nuevos
6. Expedientes en `EN_REVISION` o `ACTIVO` reciben `requiere_reevaluacion = true`
7. Cada cambio queda registrado en auditoría administrativa

---

## 7. Modelos de Base de Datos

### Tabla `usuarios`
```
id                UUID PK DEFAULT gen_random_uuid()
nombre            VARCHAR NOT NULL
correo            VARCHAR UNIQUE NOT NULL
password_hash     VARCHAR NOT NULL
rol               VARCHAR NOT NULL CHECK (rol IN ('empleado', 'oficial_cumplimiento', 'auditor', 'admin'))
activo            BOOLEAN DEFAULT TRUE
eliminado         BOOLEAN DEFAULT FALSE
```

### Tabla `refresh_tokens`
```
id                UUID PK DEFAULT gen_random_uuid()
usuario_id        UUID FK → usuarios.id
token_hash        VARCHAR NOT NULL        -- SHA-256 del refresh token
revocado          BOOLEAN DEFAULT FALSE
fecha_expiracion  TIMESTAMP NOT NULL
fecha_creacion    TIMESTAMP DEFAULT NOW()
```
> Un usuario solo puede tener un refresh token activo. Al hacer login, todos los anteriores se revocan.

### Tabla `clientes` (base)
```
id_cliente              UUID PK DEFAULT gen_random_uuid()
tipo_cliente            VARCHAR NOT NULL CHECK (tipo_cliente IN ('NATURAL', 'JURIDICA'))
nivel_riesgo            VARCHAR CHECK (nivel_riesgo IN ('BAJO', 'ESTANDAR', 'ALTO'))
estado                  VARCHAR NOT NULL DEFAULT 'PENDIENTE'
                        CHECK (estado IN ('PENDIENTE', 'PENDIENTE_BF', 'EN_REVISION',
                                          'OBSERVADO', 'ACTIVO', 'BLOQUEADO', 'RECHAZADO'))
es_pep                  BOOLEAN DEFAULT FALSE
requiere_reevaluacion   BOOLEAN DEFAULT FALSE
fecha_registro          TIMESTAMP DEFAULT NOW()
fecha_actualizacion     TIMESTAMP DEFAULT NOW()
eliminado               BOOLEAN DEFAULT FALSE
registrado_por          VARCHAR FK → usuarios.correo
```

### Tabla `personas_naturales`
```
id                UUID PK FK → clientes.id_cliente
nombres           VARCHAR NOT NULL
apellidos         VARCHAR NOT NULL
tipo_documento    VARCHAR NOT NULL CHECK (tipo_documento IN ('CEDULA', 'PASAPORTE'))
numero_documento  VARCHAR UNIQUE NOT NULL
fecha_nacimiento  DATE NOT NULL
nacionalidad      VARCHAR NOT NULL
pais_residencia   VARCHAR NOT NULL
direccion         VARCHAR NOT NULL
telefono          VARCHAR NOT NULL
correo            VARCHAR NOT NULL
ocupacion         VARCHAR NOT NULL
fuente_ingresos   VARCHAR NOT NULL
rango_ingresos    VARCHAR NOT NULL
proposito_transaccion VARCHAR NOT NULL
origen_fondos     VARCHAR NOT NULL
monto_estimado    DECIMAL NOT NULL
```

### Tabla `personas_juridicas`
```
id                    UUID PK FK → clientes.id_cliente
razon_social          VARCHAR NOT NULL
ruc                   VARCHAR UNIQUE NOT NULL
tipo_pj               VARCHAR NOT NULL
pais_constitucion     VARCHAR NOT NULL
actividad_economica   VARCHAR NOT NULL
domicilio_legal       VARCHAR NOT NULL
telefono              VARCHAR NOT NULL
correo                VARCHAR NOT NULL
proposito_adquisicion VARCHAR NOT NULL
```

### Tabla `representantes_legales`
```
id                    UUID PK DEFAULT gen_random_uuid()
id_cliente            UUID FK → clientes.id_cliente
nombre_completo       VARCHAR NOT NULL
numero_identificacion VARCHAR NOT NULL
cargo                 VARCHAR NOT NULL
poderes_otorgados     VARCHAR NOT NULL
```

### Tabla `beneficiarios_finales`
```
id                       UUID PK DEFAULT gen_random_uuid()
id_cliente               UUID FK → clientes.id_cliente
nombre_completo          VARCHAR NOT NULL
numero_documento         VARCHAR NOT NULL
nacionalidad             VARCHAR NOT NULL
porcentaje_participacion DECIMAL NOT NULL CHECK (porcentaje_participacion >= 0)
tipo_control             VARCHAR CHECK (tipo_control IN ('directo', 'indirecto', 'representacion'))
es_pep                   BOOLEAN DEFAULT FALSE
es_relevante             BOOLEAN DEFAULT FALSE  -- true si porcentaje >= 25
estado_validacion        VARCHAR NOT NULL DEFAULT 'PENDIENTE'
                         CHECK (estado_validacion IN ('PENDIENTE', 'APROBADO', 'RECHAZADO'))
validado_por             VARCHAR
motivo_rechazo           VARCHAR
fecha_validacion         TIMESTAMP
```

### Tabla `documentos`
```
id_documento        UUID PK DEFAULT gen_random_uuid()
id_cliente          UUID FK → clientes.id_cliente
tipo_documento      VARCHAR NOT NULL
nombre_archivo      VARCHAR NOT NULL
ruta_archivo        VARCHAR NOT NULL     -- ruta interna, nunca expuesta
hash_sha256         VARCHAR NOT NULL     -- integridad del archivo
tamano_bytes        INTEGER
formato             VARCHAR NOT NULL CHECK (formato IN ('PDF', 'JPG', 'PNG'))
estado              VARCHAR NOT NULL DEFAULT 'PENDIENTE_VERIFICACION'
                    CHECK (estado IN ('PENDIENTE_VERIFICACION', 'VERIFICADO', 'RECHAZADO'))
fecha_carga         TIMESTAMP DEFAULT NOW()
fecha_verificacion  TIMESTAMP
usuario_verificador VARCHAR
motivo_rechazo      VARCHAR
```

### Tabla `perfiles_financieros`
```
id_perfil           UUID PK DEFAULT gen_random_uuid()
id_cliente          UUID FK → clientes.id_cliente UNIQUE
fuente_ingresos     VARCHAR NOT NULL
rango_ingresos      VARCHAR NOT NULL
origen_fondos       VARCHAR NOT NULL
patrimonio_declarado DECIMAL
fecha_registro      TIMESTAMP DEFAULT NOW()
```

### Tabla `perfiles_transaccionales`
```
id_perfil               UUID PK DEFAULT gen_random_uuid()
id_cliente              UUID FK → clientes.id_cliente UNIQUE
monto_total_propiedad   DECIMAL NOT NULL
metodo_pago_predominante VARCHAR NOT NULL
tipo_operacion          VARCHAR NOT NULL
banco_origen_fondos     VARCHAR
tiene_financiamiento    BOOLEAN DEFAULT FALSE
banco_financiamiento    VARCHAR
monto_financiamiento    DECIMAL
fecha_registro          TIMESTAMP DEFAULT NOW()
```

### Tabla `versiones_matriz_riesgo`
```
id                UUID PK DEFAULT gen_random_uuid()
version_numero    INTEGER NOT NULL
descripcion       VARCHAR
esta_activa       BOOLEAN DEFAULT FALSE   -- solo una activa a la vez
publicada_por     VARCHAR FK → usuarios.correo
fecha_publicacion TIMESTAMP DEFAULT NOW()
```

### Tabla `factores_riesgo`
```
id                UUID PK DEFAULT gen_random_uuid()
version_id        UUID FK → versiones_matriz_riesgo.id
nombre_factor     VARCHAR NOT NULL
descripcion       VARCHAR
peso              INTEGER NOT NULL          -- valor numérico del factor
tipo              VARCHAR NOT NULL CHECK (tipo IN ('positivo', 'mitigante', 'bloqueante'))
activo            BOOLEAN DEFAULT TRUE
```

### Tabla `clasificaciones_riesgo`
```
id_clasificacion  UUID PK DEFAULT gen_random_uuid()
id_cliente        UUID FK → clientes.id_cliente
version_matriz_id UUID FK → versiones_matriz_riesgo.id
nivel_riesgo      VARCHAR NOT NULL CHECK (nivel_riesgo IN ('BAJO', 'ESTANDAR', 'ALTO'))
puntaje_bruto     INTEGER
puntaje_final     INTEGER
justificacion     TEXT NOT NULL
factores_aplicados JSONB                   -- desglose de factores usados
fecha_calculo     TIMESTAMP DEFAULT NOW()
es_automatica     BOOLEAN DEFAULT TRUE
recalculado_por   VARCHAR
```

### Tabla `observaciones`
```
id                UUID PK DEFAULT gen_random_uuid()
id_cliente        UUID FK → clientes.id_cliente
descripcion       TEXT NOT NULL
respuesta         TEXT
estado            VARCHAR NOT NULL DEFAULT 'ABIERTA'
                  CHECK (estado IN ('ABIERTA', 'CERRADA'))
creada_por        VARCHAR FK → usuarios.correo
respondida_por    VARCHAR FK → usuarios.correo
fecha_creacion    TIMESTAMP DEFAULT NOW()
fecha_respuesta   TIMESTAMP
fecha_cierre      TIMESTAMP
```

### Tabla `auditorias` (expediente)
```
id_auditoria    UUID PK DEFAULT gen_random_uuid()
usuario         VARCHAR NOT NULL
accion          VARCHAR NOT NULL
cliente_id      UUID FK → clientes.id_cliente
valor_anterior  VARCHAR
valor_nuevo     VARCHAR
fecha           TIMESTAMP DEFAULT NOW()
```

### Tabla `auditorias_admin`
```
id              UUID PK DEFAULT gen_random_uuid()
usuario         VARCHAR NOT NULL
accion          VARCHAR NOT NULL           -- LOGIN, LOGOUT, CAMBIO_ROL, CAMBIO_MATRIZ, EXPORTAR_CSV, etc.
detalle         JSONB
fecha           TIMESTAMP DEFAULT NOW()
```

**Acciones registradas en auditoría administrativa:**
- `LOGIN_EXITOSO`
- `LOGIN_FALLIDO`
- `LOGOUT`
- `SESION_REVOCADA`
- `CAMBIO_ROL`
- `PUBLICAR_MATRIZ`
- `EDITAR_FACTOR`
- `EXPORTAR_CSV_EXPEDIENTE`
- `EXPORTAR_CSV_ADMIN`

---

## 8. Máquina de Estados del Expediente

```
PENDIENTE_BF  (solo PJ — estado inicial, esperando BF aprobado)
    ↓
PENDIENTE     (estado inicial PN / PJ con BF aprobado)
    ↓
EN_REVISION   (todos los documentos VERIFICADOS)
    ↓
OBSERVADO     (OC crea observación — bloquea activación)
    ↓ (observaciones cerradas)
EN_REVISION
    ↓
ACTIVO        (Oficial activa)
    ↕
BLOQUEADO     (Oficial bloquea con motivo — puede desbloquearse)

RECHAZADO     (estado final — sin transición posible)
```

**REGLA CRÍTICA:** Ningún endpoint cambia el estado directamente. Todo pasa por `estado_service.py`.

**Transiciones permitidas:**

| Desde | Hacia | Quién | Condición |
|-------|-------|-------|-----------|
| PENDIENTE_BF | PENDIENTE | Sistema | Al menos un BF aprobado por OC |
| PENDIENTE | EN_REVISION | Sistema | Todos los documentos VERIFICADOS |
| EN_REVISION | OBSERVADO | OC | OC crea observación |
| OBSERVADO | EN_REVISION | Sistema | No quedan observaciones abiertas |
| EN_REVISION | ACTIVO | OC | Requisitos completos cumplidos |
| EN_REVISION | RECHAZADO | OC | Con justificación obligatoria |
| PENDIENTE | RECHAZADO | OC | Con justificación obligatoria |
| ACTIVO | BLOQUEADO | OC | Con motivo obligatorio |
| BLOQUEADO | ACTIVO | OC | — |

---

## 9. Roles y Permisos

| Acción | Empleado | Oficial | Auditor | Admin |
|--------|----------|---------|---------|-------|
| Iniciar sesión | ✅ | ✅ | ✅ | ✅ |
| Registrar cliente | ✅ | ❌ | ❌ | ❌ |
| Consultar clientes | ✅ | ✅ | ✅ | ❌ |
| Adjuntar documentos | ✅ | ❌ | ❌ | ❌ |
| Verificar/aprobar documentos | ❌ | ✅ | ❌ | ❌ |
| Rechazar documentos | ❌ | ✅ | ❌ | ❌ |
| Registrar BF | ✅ | ❌ | ❌ | ❌ |
| Validar/rechazar BF | ❌ | ✅ | ❌ | ❌ |
| Registrar perfil financiero | ✅ | ❌ | ❌ | ❌ |
| Registrar perfil transaccional | ✅ | ❌ | ❌ | ❌ |
| Ver clasificación de riesgo | ❌ | ✅ | ✅ | ❌ |
| Activar cliente | ❌ | ✅ | ❌ | ❌ |
| Rechazar cliente | ❌ | ✅ | ❌ | ❌ |
| Bloquear/desbloquear cliente | ❌ | ✅ | ❌ | ❌ |
| Crear observación | ❌ | ✅ | ❌ | ❌ |
| Responder observación | ✅ | ❌ | ❌ | ❌ |
| Cerrar observación | ❌ | ✅ | ❌ | ❌ |
| Ver historial de auditoría | ❌ | ✅ | ✅ | ❌ |
| Exportar CSV auditoría expediente | ❌ | ❌ | ✅ | ✅ |
| Exportar CSV auditoría admin | ❌ | ❌ | ❌ | ✅ |
| Gestionar matriz de riesgo | ❌ | ❌ | ❌ | ✅ |

> **RBAC se aplica en el backend.** Cada endpoint tiene su dependencia RBAC definida en `core/rbac.py`. El frontend oculta opciones según rol, pero el backend es la autoridad real. Un rol sin permiso recibe 403.

---

## 10. Endpoints REST del Backend

### Auth
```
POST   /auth/login          → Login: devuelve access token + refresh token
POST   /auth/refresh        → Renovar access token con refresh token válido
POST   /auth/logout         → Revocar refresh token activo
GET    /auth/me             → Datos del usuario autenticado
```

### Clientes
```
POST   /clientes/natural              → Registrar persona natural (Empleado)
POST   /clientes/juridica             → Registrar persona jurídica (Empleado)
GET    /clientes                      → Listar clientes con filtros y paginación
GET    /clientes/{id}                 → Detalle completo del expediente
```

### Beneficiarios Finales
```
POST   /clientes/{id}/beneficiarios         → Registrar BF (Empleado)
GET    /clientes/{id}/beneficiarios         → Listar BF del cliente
PATCH  /beneficiarios/{id}/aprobar          → Aprobar BF (OC)
PATCH  /beneficiarios/{id}/rechazar         → Rechazar BF con motivo (OC)
```

### Documentos
```
POST   /clientes/{id}/documentos            → Adjuntar documento (Empleado)
GET    /clientes/{id}/documentos            → Listar documentos del expediente
GET    /documentos/{id}/descargar           → Descargar documento (OC) — auditado
PATCH  /documentos/{id}/verificar           → Aprobar documento (OC)
PATCH  /documentos/{id}/rechazar            → Rechazar documento con motivo (OC)
```

### Perfiles
```
POST   /clientes/{id}/perfil-financiero     → Registrar perfil financiero (Empleado)
GET    /clientes/{id}/perfil-financiero     → Consultar perfil financiero
POST   /clientes/{id}/perfil-transaccional  → Registrar perfil transaccional (Empleado)
GET    /clientes/{id}/perfil-transaccional  → Consultar perfil transaccional
```

### Riesgo
```
GET    /clientes/{id}/riesgo                → Ver clasificación de riesgo calculada
POST   /clientes/{id}/riesgo/calcular       → Forzar recálculo manual (OC)
```

### Observaciones
```
POST   /clientes/{id}/observaciones         → Crear observación (OC)
GET    /clientes/{id}/observaciones         → Listar observaciones del expediente
PATCH  /observaciones/{id}/responder        → Responder observación (Empleado)
PATCH  /observaciones/{id}/cerrar           → Cerrar observación (OC)
```

### Activación y Estados
```
PATCH  /clientes/{id}/activar               → Activar cliente (OC)
PATCH  /clientes/{id}/rechazar              → Rechazar cliente con justificación (OC)
PATCH  /clientes/{id}/bloquear              → Bloquear cliente con motivo (OC)
PATCH  /clientes/{id}/desbloquear           → Desbloquear cliente (OC)
```

### Auditoría
```
GET    /clientes/{id}/auditoria             → Historial cronológico del expediente
GET    /auditoria                           → Historial global (Auditor/OC)
GET    /auditoria/exportar-csv              → Exportar CSV auditoría expediente (Auditor/Admin)
GET    /auditoria-admin                     → Historial auditoría administrativa (Admin)
GET    /auditoria-admin/exportar-csv        → Exportar CSV auditoría admin (Admin)
```

### Admin — Matriz de Riesgo
```
GET    /admin/matriz                        → Ver versión activa de la matriz (Admin)
GET    /admin/matriz/versiones              → Historial de versiones (Admin)
POST   /admin/matriz                        → Crear nueva versión borrador (Admin)
PATCH  /admin/matriz/{id}/publicar          → Publicar versión (Admin)
PATCH  /admin/factores/{id}                 → Editar peso/estado de un factor (Admin)
```

---

## 11. Autenticación JWT

### Flujo completo
1. `POST /auth/login` con `{correo, password}`
2. Backend verifica hash bcrypt
3. Backend revoca cualquier refresh token previo del usuario
4. Backend genera:
   - Access token JWT: payload `{sub: correo, rol: rol, exp: now + 15min}`
   - Refresh token: UUID aleatorio, se guarda su SHA-256 en BD con expiración de 7 días
5. Frontend almacena ambos tokens en `localStorage` *(decisión consciente del MVP — ver sección 0)*
6. Axios interceptor agrega `Authorization: Bearer <access_token>` a todas las peticiones
7. Si recibe 401, interceptor intenta `POST /auth/refresh` automáticamente
8. Si el refresh también falla → redirige a `/sesion-expirada`

### Protección de rutas en React
- `routeConfig.js` define cada ruta con el/los roles que pueden accederla
- Componente `RutaProtegida` verifica sesión y rol antes de renderizar
- Sin sesión → redirige a `/login`
- Sin el rol requerido → redirige a `/no-autorizado`

### Shells por rol
- **AppShell** (`empleado`, `oficial_cumplimiento`, `auditor`): navegación operativa con acceso a expedientes
- **AdminShell** (`admin`): navegación exclusiva de configuración — no ve rutas de expedientes

---

## 12. Diseño del Frontend (UI/UX)

### Principio de diseño
**El sistema debe verse como una herramienta profesional de cumplimiento regulatorio**, no como un prototipo académico. Inspiración: herramientas internas empresariales tipo Salesforce, Notion, o dashboards de compliance corporativo.

### Tailwind — tokens base obligatorios
Definir en `tailwind.config.js`:
```js
colors: {
  fondo: '#F8F9FA',
  sidebar: '#1B2A4A',
  acento: '#2563EB',
  riesgo: {
    bajo: '#16A34A',
    estandar: '#D97706',
    alto: '#DC2626',
  }
}
```

### Lo que NO debe aparecer en la interfaz
- Códigos de casos de uso (CU-01, CU-03, etc.)
- Colores primarios básicos brillantes en tarjetas
- Gradientes ni emojis
- Texto placeholder o datos hardcodeados visibles

### Dashboard principal
Debe mostrar estadísticas reales del sistema:
- Total de clientes registrados
- Clientes en estado PENDIENTE / PENDIENTE_BF (requieren atención)
- Clientes EN_REVISION / OBSERVADO
- Clientes ACTIVOS / BLOQUEADOS
- Clientes RECHAZADOS
- Últimas acciones recientes (mini feed de auditoría)

### Paleta de colores
- Fondo principal: `#F8F9FA`
- Sidebar: `#1B2A4A`
- Acento: `#2563EB`
- Riesgo BAJO: `#16A34A`
- Riesgo ESTÁNDAR: `#D97706`
- Riesgo ALTO: `#DC2626`
- Estados: badges pequeños con fondo suave

### Componentes base (carpeta `components/ui/`)
Todos deben soportar estados: deshabilitado / cargando / error / enfoque.
- `Boton` — variantes: primario, secundario, peligro; soporta `loading` y `disabled`
- `Input`, `Select`, `Switch`
- `Modal`, `Cajon` (drawer)
- `Alerta` — variantes: info, éxito, advertencia, error
- `Tabla` — paginada, con columnas configurables
- `Insignia` — para estados y niveles de riesgo
- `Pestanas`
- `FormField` — envuelve input + label + mensaje de error
- `FileUpload` — acepta PDF/JPG/PNG, muestra nombre y tamaño

### Formularios de registro
- Stepper multi-paso para PN y PJ
- Validación campo a campo antes de avanzar al siguiente paso
- Sin `<form>` HTML — usar `onClick` y `onChange` de React

---

## 13. Contexto Académico

| Campo | Valor |
|-------|-------|
| Universidad | Universidad Tecnológica de Panamá (UTP) |
| Facultad | Ingeniería de Sistemas Computacionales |
| Carrera | Licenciatura en Desarrollo y Gestión de Software |
| Materia | Ingeniería de Software |
| Entrega | Parcial 2 |
| Grupo | 1GS-241 |
| Profesora | María Mosquera |
| Equipo | 3.5 integrantes |
| Duración | 3 semanas |
| Metodología | Scrum adaptado — Daily Scrum semanal de 5 minutos |

### Métricas obligatorias (Unidad II)

**1. Métricas en Requerimientos**
- Cobertura: RF verificados vs. totales
- Volatilidad: cambios vs. RF totales
- Trazabilidad: matriz RF → CU → CA → prueba

**2. Métricas en Diseño**
- Complejidad ciclomática (McCabe)
- Acoplamiento y cohesión del diagrama de clases
- Diagramas actualizados (ERD, clases, secuencia)

**3. Métricas en Código (SonarQube)**
- Densidad de defectos
- Code smells
- Vulnerabilidades
- Debt ratio

**4. Métricas Clásicas**
- KLOC
- Productividad
- Tasa de defectos

**5. Proceso de Medición (obligatorio por métrica)**
- Objetivo → Métrica → Recolección → Análisis → Acción de mejora

### Daily Scrum semanal (5 minutos)
1. ¿Qué hicimos desde el último laboratorio?
2. ¿Qué haremos para el próximo laboratorio?
3. ¿Qué problemas o bloqueos tuvimos?

---

## 14. División de Tareas del Equipo

| Persona | Responsabilidad | Casos de Uso |
|---------|----------------|-------------|
| Persona 1 | Backend — Auth, Datos y Registro | CU-00, CU-00b, CU-00c, CU-01, CU-03, CU-BF |
| Persona 2 | Backend — Documentos, Perfiles y Observaciones | CU-04, CU-05, CU-06, CU-08, CU-OBS |
| Persona 3 | Backend — Riesgo, Estados, Admin e Integración | CU-11, CU-15, CU-ADM, CU-17 |
| Persona 4 (medio) | Frontend completo + QA + Playwright | Todas las páginas + pruebas E2E |

---

## 15. Instrucciones para el Agente

### Reglas estrictas de código
- Usar **pnpm** en el frontend. Nunca npm ni yarn.
- Variables, funciones y comentarios de dominio en **español**
- Todos los IDs son **UUID**
- Todos los endpoints devuelven **JSON**
- El frontend consume el backend via **Axios** con interceptor JWT que maneja refresh automático
- Los estados del expediente **solo cambian** a través de `estado_service.py`
- Toda acción relevante de expediente llama automáticamente a `auditoria_service.py`
- Toda acción de auth/admin llama automáticamente a `auditoria_admin_service.py`
- El cálculo de riesgo es **automático** al completar ambos perfiles, usando la **versión activa** de la matriz
- CORS configurado en FastAPI para permitir el frontend en `http://localhost:5173`
- Los documentos se guardan en `/app/uploads/` con nombre UUID. La ruta nunca se expone en la API.
- **Sin referencias a códigos CU en la interfaz** de usuario
- Formularios de registro con **stepper multi-paso**
- Rutas protegidas por rol con `RutaProtegida` y `routeConfig`
- Los listados **siempre filtran** `eliminado = false`
- El servicio Vite en Docker debe arrancar con `pnpm dev --host` para ser accesible desde el host
- **Sin `<form>` HTML en React** — usar event handlers directamente

### Orden de generación de archivos

```
1.  docker-compose.yml
2.  .env.example
3.  .gitignore
4.  database/init.sql
5.  backend/Dockerfile
6.  backend/requirements.txt
7.  backend/app/core/config.py
8.  backend/app/core/security.py
9.  backend/app/core/rbac.py
10. backend/app/database.py
11. backend/app/models/usuario.py
12. backend/app/models/refresh_token.py
13. backend/app/models/cliente.py
14. backend/app/models/persona_natural.py
15. backend/app/models/persona_juridica.py
16. backend/app/models/representante_legal.py
17. backend/app/models/beneficiario_final.py
18. backend/app/models/documento.py
19. backend/app/models/perfil_financiero.py
20. backend/app/models/perfil_transaccional.py
21. backend/app/models/matriz_riesgo.py
22. backend/app/models/clasificacion_riesgo.py
23. backend/app/models/observacion.py
24. backend/app/models/auditoria.py
25. backend/app/models/auditoria_admin.py
26. backend/app/schemas/auth.py
27. backend/app/schemas/cliente.py
28. backend/app/schemas/documento.py
29. backend/app/schemas/perfil.py
30. backend/app/schemas/riesgo.py
31. backend/app/schemas/observacion.py
32. backend/app/schemas/auditoria.py
33. backend/app/services/estado_service.py
34. backend/app/services/riesgo_service.py
35. backend/app/services/auditoria_service.py
36. backend/app/services/auditoria_admin_service.py
37. backend/app/routers/auth.py
38. backend/app/routers/clientes.py
39. backend/app/routers/beneficiarios.py
40. backend/app/routers/documentos.py
41. backend/app/routers/perfiles.py
42. backend/app/routers/riesgo.py
43. backend/app/routers/activacion.py
44. backend/app/routers/observaciones.py
45. backend/app/routers/admin.py
46. backend/app/routers/auditoria.py
47. backend/app/main.py
48. backend/seed_demo.py
49. frontend/Dockerfile
50. frontend/package.json
51. frontend/vite.config.js
52. frontend/tailwind.config.js
53. frontend/postcss.config.js
54. frontend/index.html
55. frontend/src/api/axiosConfig.js
56. frontend/src/context/AuthContext.jsx
57. frontend/src/config/routeConfig.js
58. frontend/src/components/RutaProtegida.jsx
59. frontend/src/components/EstadoBadge.jsx
60. frontend/src/components/RiesgoIndicador.jsx
61. frontend/src/components/Navbar.jsx
62. frontend/src/components/Sidebar.jsx
63. frontend/src/components/ui/Boton.jsx
64. frontend/src/components/ui/Input.jsx
65. frontend/src/components/ui/Select.jsx
66. frontend/src/components/ui/Modal.jsx
67. frontend/src/components/ui/Alerta.jsx
68. frontend/src/components/ui/Tabla.jsx
69. frontend/src/components/ui/Insignia.jsx
70. frontend/src/components/ui/Pestanas.jsx
71. frontend/src/components/ui/Cajon.jsx
72. frontend/src/components/ui/FormField.jsx
73. frontend/src/components/ui/FileUpload.jsx
74. frontend/src/shells/AppShell.jsx
75. frontend/src/shells/AdminShell.jsx
76. frontend/src/pages/Login.jsx
77. frontend/src/pages/SesionExpirada.jsx
78. frontend/src/pages/NoAutorizado.jsx
79. frontend/src/pages/Dashboard.jsx
80. frontend/src/pages/ListadoClientes.jsx
81. frontend/src/pages/RegistroNatural.jsx
82. frontend/src/pages/RegistroJuridica.jsx
83. frontend/src/pages/DetalleExpediente.jsx
84. frontend/src/pages/Documentos.jsx
85. frontend/src/pages/BeneficiarioFinal.jsx
86. frontend/src/pages/Perfiles.jsx
87. frontend/src/pages/Riesgo.jsx
88. frontend/src/pages/Activacion.jsx
89. frontend/src/pages/Observaciones.jsx
90. frontend/src/pages/Auditoria.jsx
91. frontend/src/pages/admin/MatrizRiesgo.jsx
92. frontend/src/App.jsx
93. frontend/src/main.jsx
94. e2e/playwright.config.js
95. e2e/flujo_pn.spec.js
96. e2e/flujo_pj_bf.spec.js
97. e2e/smoke.spec.js
98. README.md
```

---

## 16. Estado Actual del Proyecto por Módulo

> Usar esta sección para saber qué ya existe en el repo y qué falta. No generar lo que ya esté marcado como ✅ sin revisar primero si necesita ajuste.

| Módulo | Estado | Notas |
|--------|--------|-------|
| Auth — Login con refresh token y sesión única | ✅ Implementado (v3) | `POST /auth/login` devuelve access + refresh; revoca sesiones previas; SHA-256 en BD |
| Auth — Refresh Token | ✅ Implementado (v3) | `POST /auth/refresh` verifica hash en BD; interceptor Axios automático |
| Auth — RBAC backend | ✅ Implementado (v3) | `core/rbac.py` con acciones y roles; 403 si no aplica |
| Auth — Inactividad frontend | ✅ Implementado (v3) | 30 min de inactividad → logout + redirige a `/sesion-expirada` |
| Tailwind tokens base | ✅ Implementado (v3) | `tailwind.config.js` con colors: fondo, sidebar, acento, riesgo |
| Componentes UI base | ✅ Implementado (v3) | 11 componentes en `components/ui/` + EstadoBadge + RiesgoIndicador |
| routeConfig + AppShell + AdminShell | ✅ Implementado (v3) | `routeConfig.js`, `AppShell.jsx`, `AdminShell.jsx` con navegación por rol |
| Modelo expediente (estados nuevos) | ✅ Implementado (v3) | `PENDIENTE_BF`, `OBSERVADO`, `BLOQUEADO`, `requiere_reevaluacion` en `cliente.py` e `init.sql` |
| Registro PN/PJ | ✅ Implementado (v3) | PN inicia en `PENDIENTE`; PJ inicia en `PENDIENTE_BF`; campos inmobiliarios en perfil transaccional |
| Almacén documental con hash SHA-256 | ✅ Implementado (v3) | `documentos.py` calcula hash al subir; guarda en `/app/uploads/` con UUID |
| Bandeja OC — verificar/rechazar/descargar docs | ✅ Implementado (v3) | Auditoría de descarga (`DESCARGAR_DOCUMENTO`), visualización, aprobación y rechazo |
| Perfil transaccional (campos inmobiliarios) | ✅ Implementado (v3) | `monto_total_propiedad`, `metodo_pago_predominante`, `tipo_operacion`, `banco_origen_fondos`, financiamiento |
| Beneficiario Final con validación OC | ✅ Implementado (v3) | Empleado captura; OC aprueba/rechaza con motivo; PJ sin BF aprobado no avanza |
| Matriz de riesgo versionada | ✅ Implementado (v3) | `versiones_matriz_riesgo` + `factores_riesgo`; motor usa versión activa; seed base en `init.sql` |
| UI Admin — matriz de riesgo | ✅ Implementado (v3) | `admin/MatrizRiesgo.jsx`; Admin edita pesos, activa/desactiva factores, publica versiones |
| Observaciones accionables | ✅ Implementado (v3) | OC crea → Empleado responde → OC cierra; bloquean activación si hay abiertas |
| Activación/bloqueo/rechazo con reglas | ✅ Implementado (v3) | Checklist completo: docs, perfiles, riesgo, observaciones, BF, confirmación ALTO; bloqueo/desbloqueo desde ACTIVO |
| Auditoría administrativa separada | ✅ Implementado (v3) | Tabla `auditorias_admin`; registra login/logout, cambios de matriz, exportaciones CSV |
| Exportación CSV auditoría | ✅ Implementado (v3) | Auditor y Admin exportan CSV expediente; Admin exporta CSV admin |
| Seed demo determinista | ✅ Implementado (v3) | `seed_demo.py` crea usuarios demo con bcrypt; 5 usuarios en `init.sql` |
| Playwright E2E base | ✅ Implementado (v3) | `playwright.config.js`, `smoke.spec.js`, `flujo_pn.spec.js`, `flujo_pj_bf.spec.js` |
| Documentación viva (README, Manual, v3) | ✅ Implementado (v3) | README.md, MANUAL_USUARIO.md y este archivo actualizados a v3 |
