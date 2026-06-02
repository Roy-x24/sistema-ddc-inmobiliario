# Prompt Maestro v2 — Sistema DDC/KYC Inmobiliario
> Documento de contexto completo para generación del proyecto por un agente de IA.
> Leer este archivo completo antes de generar cualquier código o archivo.
> Esta es la versión definitiva. Reemplaza cualquier versión anterior.

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
El sistema es una herramienta interna. Lo usan empleados de la promotora para registrar y verificar clientes compradores, no los clientes directamente. El empleado registra la información y adjunta documentos físicos escaneados. El Oficial de Cumplimiento valida. El Auditor revisa los logs.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React + Vite | React 18 / Vite 5 |
| Backend | Python + FastAPI | Python 3.11 / FastAPI 0.100+ |
| Base de datos | PostgreSQL | 15 |
| ORM | SQLAlchemy + Alembic | SQLAlchemy 2.0 |
| Contenedores | Docker + Docker Compose | Docker 24+ |
| QA / Métricas | SonarQube Community Edition | Latest |
| Control de versiones | GitHub | Git 2.40+ |
| Gestor frontend | **pnpm** (NO usar npm ni yarn) | Latest |
| Gestor backend | pip + requirements.txt | — |

### Instalación local requerida (solo esto)
- Docker Desktop
- Git
- VSCode
- pnpm (`npm install -g pnpm`)

> Todo corre dentro de contenedores. No se necesita instalar Python ni PostgreSQL localmente.

### Gestión de usuarios y roles
- **Sin módulo de administración** en el MVP
- Los usuarios se crean automáticamente via **seed script (init.sql)** cuando Docker levanta PostgreSQL por primera vez
- El archivo `init.sql` se mapea a `/docker-entrypoint-initdb.d/` en el contenedor
- Autenticación con **JWT** (sin refresh tokens, sin MFA, sin OAuth en el MVP)

### Usuarios precargados (seed)
```sql
-- 3 usuarios con roles fijos para el MVP
empleado@ddc.com     → rol: empleado
oficial@ddc.com      → rol: oficial_cumplimiento
auditor@ddc.com      → rol: auditor
```
Las contraseñas se almacenan como hash bcrypt, nunca en texto plano.

---

## 3. Estructura de Carpetas

```
ddc-kyc-sistema/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # Entry point FastAPI + CORS
│   │   ├── database.py                # Conexión PostgreSQL con SQLAlchemy
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── cliente.py             # Modelo base abstracto Cliente
│   │   │   ├── persona_natural.py     # Hereda de Cliente
│   │   │   ├── persona_juridica.py    # Hereda de Cliente
│   │   │   ├── representante_legal.py
│   │   │   ├── beneficiario_final.py  # UBO — solo para PJ
│   │   │   ├── documento.py
│   │   │   ├── perfil_financiero.py
│   │   │   ├── perfil_transaccional.py
│   │   │   ├── clasificacion_riesgo.py
│   │   │   ├── auditoria.py
│   │   │   └── usuario.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── cliente.py
│   │   │   ├── documento.py
│   │   │   ├── perfil.py
│   │   │   ├── riesgo.py
│   │   │   ├── auditoria.py
│   │   │   └── auth.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                # CU-00: Login + JWT
│   │   │   ├── clientes.py            # CU-01, CU-03
│   │   │   ├── documentos.py          # CU-04, CU-08
│   │   │   ├── perfiles.py            # CU-05, CU-06
│   │   │   ├── riesgo.py              # CU-15
│   │   │   ├── activacion.py          # CU-11
│   │   │   └── auditoria.py           # CU-17
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── riesgo_service.py      # Lógica de cálculo de riesgo inmobiliario
│   │   │   ├── estado_service.py      # Máquina de estados del expediente
│   │   │   └── auditoria_service.py   # Registro automático de auditoría
│   │   └── core/
│   │       ├── __init__.py
│   │       ├── config.py              # Variables de entorno
│   │       └── security.py            # JWT: crear y verificar tokens
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── alembic.ini
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx                    # React Router + rutas protegidas por rol
│   │   ├── api/
│   │   │   └── axiosConfig.js         # Axios con baseURL + interceptor JWT
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Estado global: usuario, rol, token
│   │   ├── pages/
│   │   │   ├── Login.jsx              # CU-00
│   │   │   ├── Dashboard.jsx          # Estadísticas reales por estado
│   │   │   ├── ListadoClientes.jsx    # CU-03: tabla paginada + filtros
│   │   │   ├── RegistroNatural.jsx    # CU-01: formulario persona natural
│   │   │   ├── RegistroJuridica.jsx   # CU-01: formulario persona jurídica
│   │   │   ├── DetalleExpediente.jsx  # Vista completa del expediente
│   │   │   ├── Documentos.jsx         # CU-04, CU-08
│   │   │   ├── Perfiles.jsx           # CU-05, CU-06
│   │   │   ├── Riesgo.jsx             # CU-15: visualización de riesgo
│   │   │   ├── Activacion.jsx         # CU-11: decisión del Oficial
│   │   │   └── Auditoria.jsx          # CU-17: historial cronológico
│   │   └── components/
│   │       ├── Navbar.jsx
│   │       ├── Sidebar.jsx
│   │       ├── RutaProtegida.jsx      # HOC: redirige si no tiene el rol
│   │       ├── EstadoBadge.jsx        # Badge color por estado
│   │       └── RiesgoIndicador.jsx    # Verde/Amarillo/Rojo por nivel
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json                   # Usar pnpm para instalar
│   └── Dockerfile
├── database/
│   └── init.sql                       # Tablas + seed de usuarios
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
      ACCESS_TOKEN_EXPIRE_MINUTES: 480
    depends_on:
      - db
    volumes:
      - ./backend:/app
      - ./uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
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
→ Verificar Documentos (CU-08) → Perfil Financiero (CU-05)
→ Perfil Transaccional (CU-06) → Calcular Riesgo (CU-15)
→ Activar/Rechazar Cliente (CU-11) → Auditoría (CU-17)
```

### Plan de sprints

| Semana | Casos de Uso | Objetivo |
|--------|-------------|----------|
| 1 | CU-00, CU-01, CU-03 | Login + Registro + Consulta de clientes |
| 2 | CU-04, CU-08, CU-05, CU-06 | Documentos y perfiles |
| 3 | CU-15, CU-11, CU-17 | Riesgo, activación y auditoría |

### Lo que NO se implementa en el MVP
- Notificaciones automáticas (email/SMS)
- Reportes avanzados ni exportación PDF
- Integración con SSNF, UAF, listas OFAC/ONU reales
- Firma digital
- OCR
- Reconocimiento biométrico
- Dashboard con gráficas avanzadas
- Microservicios
- Refresh tokens, MFA, OAuth
- Multi-tenant

---

## 6. Casos de Uso del MVP

### CU-00 — Iniciar Sesión
**Actor:** Todos los roles
**Flujo:**
1. Usuario ingresa correo y contraseña
2. Backend valida credenciales contra la BD
3. Backend genera token JWT con el rol del usuario
4. Frontend almacena el token y redirige al Dashboard según rol
5. Todas las peticiones posteriores llevan el token en el header `Authorization: Bearer <token>`

**Validaciones:** Credenciales incorrectas devuelven 401. Token expira en 8 horas.

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
- **Beneficiario Final (UBO):** nombre, documento, nacionalidad, porcentaje de participación (≥25%)

**Post-condición:** Cliente creado en estado `PENDIENTE`

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
4. Sistema valida: formato (PDF/JPG/PNG), tamaño (máx 10 MB), integridad
5. Sistema guarda el archivo en `/app/uploads/` con nombre único (UUID)
6. Sistema guarda en BD el registro con estado `PENDIENTE_VERIFICACION`

**Documentos por tipo de cliente:**

*Persona Natural:*
- Documento de identidad vigente (cédula o pasaporte)
- Comprobante de ingresos (recibo de salario, declaración de renta, extracto bancario)
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
2. Revisa el documento (visor inline)
3. Selecciona "Aprobar"
4. Sistema cambia estado a `VERIFICADO`
5. Sistema registra en auditoría: quién, cuándo, acción

**Flujo rechazar:**
1. Oficial selecciona "Rechazar"
2. Ingresa motivo obligatorio (campo de texto)
3. Sistema cambia estado a `RECHAZADO`
4. Sistema registra en auditoría

**Post-condición:** Cuando todos los documentos obligatorios están en `VERIFICADO`, el expediente puede pasar a `EN_REVISION`.

---

### CU-05 — Registrar Perfil Financiero
**Actor:** Empleado
**Campos:**
- Fuente de ingresos
- Rango de ingresos mensuales (rangos predefinidos)
- Origen de los fondos para la compra
- Patrimonio declarado aproximado

**Post-condición:** Al guardar, si el perfil transaccional ya existe, el sistema dispara automáticamente CU-15.

---

### CU-06 — Registrar Perfil Transaccional
**Actor:** Empleado
**Campos (adaptados al contexto inmobiliario):**
- Propósito de la compra (residencia propia, inversión, alquiler, otro)
- Monto estimado de la transacción (USD)
- Tipo de transacción (transferencia bancaria, cheque de gerencia, financiamiento, mixto)
- Financiamiento bancario (Sí/No — si Sí, banco y monto del préstamo)

**Validación:** El monto estimado debe ser mayor a $0.

**Post-condición:** Al guardar, si el perfil financiero ya existe, el sistema dispara automáticamente CU-15.

---

### CU-15 — Calcular Riesgo Automáticamente
**Actor:** Sistema (automático)
**Trigger:** Al completar perfil financiero Y perfil transaccional

**Lógica de riesgo por reglas (contexto inmobiliario):**

El sistema evalúa los factores en orden de prioridad. Si cualquier condición de ALTO se cumple, el resultado es ALTO sin importar los demás factores.

| Factor | Nivel que Genera | Condición |
|--------|-----------------|-----------|
| Cliente es PEP | ALTO automático | es_pep = true |
| País de residencia/constitución en lista de riesgo | ALTO | país en lista predefinida en BD |
| Monto de transacción > $500,000 USD | ALTO | monto_estimado > 500000 |
| Origen de fondos no verificable o en efectivo | ALTO | origen_fondos in ['efectivo', 'desconocido', 'otro_no_verificable'] |
| PJ extranjera con estructura compleja | ALTO o ESTÁNDAR | pais_constitucion != 'PA' and tipo_pj in ['fideicomiso', 'fundacion'] |
| Monto entre $100,000 y $500,000 | ESTÁNDAR | 100000 <= monto_estimado <= 500000 |
| PJ nacional con documentación completa | ESTÁNDAR | tipo_cliente = 'JURIDICA' and pais_constitucion = 'PA' |
| Cliente nacional, ingresos verificables, monto < $100,000 | BAJO | todos los anteriores no aplican |

**REGLA CRÍTICA:** Si el nivel calculado es ALTO, el cliente NO puede activarse automáticamente. El Oficial debe confirmar manualmente.

**Almacenamiento:** Guardar en tabla `clasificaciones_riesgo`: puntaje descriptivo, nivel, justificación, fecha, usuario (sistema), es_automática = true.

---

### CU-11 — Activar o Rechazar Cliente
**Actor:** Oficial de Cumplimiento
**Precondiciones para activar:**
- Todos los documentos obligatorios en estado `VERIFICADO`
- Perfil financiero completo
- Perfil transaccional completo
- Riesgo calculado
- Si es Persona Jurídica: Beneficiario Final registrado
- Si riesgo es ALTO: confirmación manual adicional obligatoria del Oficial

**Estados:**
- Riesgo BAJO o ESTÁNDAR: `EN_REVISION` → `ACTIVO`
- Riesgo ALTO: requiere confirmación → `ACTIVO`
- Rechazo: cualquier estado → `RECHAZADO` (con justificación obligatoria)

---

### CU-17 — Auditoría
**Actor:** Sistema (automático) — Consulta: Auditor y Oficial
**Trigger:** Cualquier acción relevante sobre el expediente

**Tabla de auditoría:**

| Campo | Descripción |
|-------|-------------|
| id | UUID PK |
| usuario | Correo del usuario que ejecutó la acción |
| accion | Tipo de acción (ver lista abajo) |
| cliente_id | UUID del cliente afectado |
| valor_anterior | Estado o valor antes del cambio |
| valor_nuevo | Estado o valor después del cambio |
| fecha | Timestamp exacto del evento |

**Acciones registradas:**
- `CREAR_CLIENTE`
- `ACTUALIZAR_CLIENTE`
- `ADJUNTAR_DOCUMENTO`
- `VERIFICAR_DOCUMENTO`
- `RECHAZAR_DOCUMENTO`
- `REGISTRAR_PERFIL_FINANCIERO`
- `REGISTRAR_PERFIL_TRANSACCIONAL`
- `CALCULAR_RIESGO`
- `ACTIVAR_CLIENTE`
- `RECHAZAR_CLIENTE`
- `CAMBIAR_ESTADO`

---

## 7. Modelos de Base de Datos

### Tabla `usuarios`
```
id                UUID PK DEFAULT gen_random_uuid()
nombre            VARCHAR NOT NULL
correo            VARCHAR UNIQUE NOT NULL
password_hash     VARCHAR NOT NULL
rol               VARCHAR NOT NULL CHECK (rol IN ('empleado', 'oficial_cumplimiento', 'auditor'))
activo            BOOLEAN DEFAULT TRUE
```

### Tabla `clientes` (base)
```
id_cliente        UUID PK DEFAULT gen_random_uuid()
tipo_cliente      VARCHAR NOT NULL CHECK (tipo_cliente IN ('NATURAL', 'JURIDICA'))
nivel_riesgo      VARCHAR CHECK (nivel_riesgo IN ('BAJO', 'ESTANDAR', 'ALTO'))
estado            VARCHAR NOT NULL DEFAULT 'PENDIENTE'
                  CHECK (estado IN ('PENDIENTE', 'EN_REVISION', 'ACTIVO', 'RECHAZADO'))
es_pep            BOOLEAN DEFAULT FALSE
fecha_registro    TIMESTAMP DEFAULT NOW()
fecha_actualizacion TIMESTAMP DEFAULT NOW()
eliminado         BOOLEAN DEFAULT FALSE
registrado_por    VARCHAR FK → usuarios.correo
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
```

### Tabla `personas_juridicas`
```
id                UUID PK FK → clientes.id_cliente
razon_social      VARCHAR NOT NULL
ruc               VARCHAR UNIQUE NOT NULL
tipo_pj           VARCHAR NOT NULL  -- SA, SRL, fideicomiso, fundacion, etc.
pais_constitucion VARCHAR NOT NULL
actividad_economica VARCHAR NOT NULL
domicilio_legal   VARCHAR NOT NULL
telefono          VARCHAR NOT NULL
correo            VARCHAR NOT NULL
proposito_adquisicion VARCHAR NOT NULL
```

### Tabla `representantes_legales`
```
id                UUID PK DEFAULT gen_random_uuid()
id_cliente        UUID FK → clientes.id_cliente
nombre_completo   VARCHAR NOT NULL
numero_identificacion VARCHAR NOT NULL
cargo             VARCHAR NOT NULL
poderes_otorgados VARCHAR NOT NULL
```

### Tabla `beneficiarios_finales`
```
id                UUID PK DEFAULT gen_random_uuid()
id_cliente        UUID FK → clientes.id_cliente
nombre_completo   VARCHAR NOT NULL
numero_documento  VARCHAR NOT NULL
nacionalidad      VARCHAR NOT NULL
porcentaje_participacion DECIMAL NOT NULL CHECK (porcentaje_participacion >= 25)
tipo_control      VARCHAR  -- directo, indirecto, representacion
es_pep            BOOLEAN DEFAULT FALSE
```

### Tabla `documentos`
```
id_documento      UUID PK DEFAULT gen_random_uuid()
id_cliente        UUID FK → clientes.id_cliente
tipo_documento    VARCHAR NOT NULL
nombre_archivo    VARCHAR NOT NULL
ruta_archivo      VARCHAR NOT NULL  -- ruta en /app/uploads/
tamano_bytes      INTEGER
formato           VARCHAR NOT NULL  -- PDF, JPG, PNG
estado            VARCHAR NOT NULL DEFAULT 'PENDIENTE_VERIFICACION'
                  CHECK (estado IN ('PENDIENTE_VERIFICACION', 'VERIFICADO', 'RECHAZADO'))
fecha_carga       TIMESTAMP DEFAULT NOW()
fecha_verificacion TIMESTAMP
usuario_verificador VARCHAR
motivo_rechazo    VARCHAR
```

### Tabla `perfiles_financieros`
```
id_perfil         UUID PK DEFAULT gen_random_uuid()
id_cliente        UUID FK → clientes.id_cliente UNIQUE
fuente_ingresos   VARCHAR NOT NULL
rango_ingresos    VARCHAR NOT NULL  -- '<1000', '1001-5000', '5001-15000', '>15000'
origen_fondos     VARCHAR NOT NULL
patrimonio_declarado DECIMAL
fecha_registro    TIMESTAMP DEFAULT NOW()
```

### Tabla `perfiles_transaccionales`
```
id_perfil         UUID PK DEFAULT gen_random_uuid()
id_cliente        UUID FK → clientes.id_cliente UNIQUE
proposito_compra  VARCHAR NOT NULL  -- residencia, inversion, alquiler, otro
monto_estimado    DECIMAL NOT NULL
tipo_transaccion  VARCHAR NOT NULL  -- transferencia, cheque, financiamiento, mixto
tiene_financiamiento BOOLEAN DEFAULT FALSE
banco_financiamiento VARCHAR
monto_financiamiento DECIMAL
fecha_registro    TIMESTAMP DEFAULT NOW()
```

### Tabla `clasificaciones_riesgo`
```
id_clasificacion  UUID PK DEFAULT gen_random_uuid()
id_cliente        UUID FK → clientes.id_cliente
nivel_riesgo      VARCHAR NOT NULL CHECK (nivel_riesgo IN ('BAJO', 'ESTANDAR', 'ALTO'))
justificacion     TEXT NOT NULL
factores_aplicados JSONB
fecha_calculo     TIMESTAMP DEFAULT NOW()
es_automatica     BOOLEAN DEFAULT TRUE
recalculado_por   VARCHAR  -- si fue ajustado manualmente
```

### Tabla `auditorias`
```
id_auditoria      UUID PK DEFAULT gen_random_uuid()
usuario           VARCHAR NOT NULL
accion            VARCHAR NOT NULL
cliente_id        UUID FK → clientes.id_cliente
valor_anterior    VARCHAR
valor_nuevo       VARCHAR
fecha             TIMESTAMP DEFAULT NOW()
```

---

## 8. Máquina de Estados del Expediente

```
PENDIENTE  (estado inicial al registrar el cliente)
    ↓
EN_REVISION  (cuando todos los documentos están VERIFICADOS)
    ↓
ACTIVO  (Oficial activa al cliente — requisitos completos)

RECHAZADO  (estado final — Oficial rechaza, sin transición posible)
```

**Solo 4 estados en el MVP.** La máquina de estados está centralizada en `estado_service.py`.

**Transiciones permitidas:**

| Desde | Hacia | Quién |
|-------|-------|-------|
| PENDIENTE | EN_REVISION | Sistema (automático al verificar documentos) |
| EN_REVISION | ACTIVO | Oficial de Cumplimiento |
| EN_REVISION | RECHAZADO | Oficial de Cumplimiento |
| PENDIENTE | RECHAZADO | Oficial de Cumplimiento |

**REGLA CRÍTICA:** Ningún endpoint cambia el estado directamente. Todo pasa por `estado_service.py`.

---

## 9. Roles y Permisos

| Acción | Empleado | Oficial | Auditor |
|--------|----------|---------|---------|
| Iniciar sesión | ✅ | ✅ | ✅ |
| Registrar cliente | ✅ | ❌ | ❌ |
| Consultar clientes | ✅ | ✅ | ✅ |
| Adjuntar documentos | ✅ | ❌ | ❌ |
| Verificar/aprobar documentos | ❌ | ✅ | ❌ |
| Rechazar documentos | ❌ | ✅ | ❌ |
| Registrar perfil financiero | ✅ | ❌ | ❌ |
| Registrar perfil transaccional | ✅ | ❌ | ❌ |
| Ver clasificación de riesgo | ❌ | ✅ | ✅ |
| Activar cliente | ❌ | ✅ | ❌ |
| Rechazar cliente | ❌ | ✅ | ❌ |
| Ver historial de auditoría | ❌ | ✅ | ✅ |

---

## 10. Endpoints REST del Backend

### Auth
```
POST   /auth/login          → Devuelve JWT con rol del usuario
GET    /auth/me             → Devuelve datos del usuario autenticado
```

### Clientes
```
POST   /clientes/natural    → Registrar persona natural (Empleado)
POST   /clientes/juridica   → Registrar persona jurídica (Empleado)
GET    /clientes            → Listar clientes con filtros y paginación
GET    /clientes/{id}       → Detalle completo del expediente
```

### Documentos
```
POST   /clientes/{id}/documentos          → Adjuntar documento (Empleado)
GET    /clientes/{id}/documentos          → Listar documentos del expediente
PATCH  /documentos/{id}/verificar         → Aprobar documento (Oficial)
PATCH  /documentos/{id}/rechazar          → Rechazar documento con motivo (Oficial)
```

### Perfiles
```
POST   /clientes/{id}/perfil-financiero   → Registrar perfil financiero (Empleado)
GET    /clientes/{id}/perfil-financiero   → Consultar perfil financiero
POST   /clientes/{id}/perfil-transaccional → Registrar perfil transaccional (Empleado)
GET    /clientes/{id}/perfil-transaccional → Consultar perfil transaccional
```

### Riesgo
```
GET    /clientes/{id}/riesgo              → Ver clasificación de riesgo calculada
POST   /clientes/{id}/riesgo/calcular     → Forzar recálculo manual (Oficial)
```

### Activación
```
PATCH  /clientes/{id}/activar             → Activar cliente (Oficial)
PATCH  /clientes/{id}/rechazar            → Rechazar cliente con justificación (Oficial)
```

### Auditoría
```
GET    /clientes/{id}/auditoria           → Historial cronológico del expediente
GET    /auditoria                         → Historial global (Auditor/Oficial)
```

---

## 11. Autenticación JWT

### Flujo
1. `POST /auth/login` con `{correo, password}`
2. Backend verifica hash bcrypt
3. Backend genera JWT con payload: `{sub: correo, rol: rol, exp: timestamp}`
4. Frontend almacena token en `localStorage`
5. Axios interceptor agrega `Authorization: Bearer <token>` a todas las peticiones
6. FastAPI dependency `get_current_user` verifica el token en cada endpoint protegido

### Protección de rutas en React
- Componente `RutaProtegida` verifica que el usuario tenga el rol requerido
- Si no tiene sesión → redirige a `/login`
- Si no tiene el rol → redirige a `/no-autorizado`

---

## 12. Diseño del Frontend (UI/UX)

### Principio de diseño
**El sistema debe verse como una herramienta profesional de cumplimiento regulatorio**, no como un prototipo académico. Inspiración: herramientas internas empresariales tipo Salesforce, Notion, o dashboards de compliance corporativo.

### Lo que NO debe aparecer en la interfaz
- Códigos de casos de uso (CU-01, CU-03, etc.)
- Colores primarios básicos (azul/rojo/verde/amarillo brillantes en tarjetas)
- Tarjetas con etiquetas técnicas
- Texto que parezca demo o placeholder

### Dashboard principal
Debe mostrar estadísticas reales del sistema:
- Total de clientes registrados
- Clientes en estado PENDIENTE (requieren atención)
- Clientes EN_REVISION
- Clientes ACTIVOS
- Clientes RECHAZADOS
- Últimas acciones recientes (mini feed de auditoría)

### Paleta de colores sugerida
- Fondo principal: blanco o gris muy claro (#F8F9FA)
- Sidebar: azul oscuro profesional (#1B2A4A) o gris carbón
- Acentos: azul corporativo (#2563EB) para acciones principales
- Riesgo BAJO: verde sobrio (#16A34A)
- Riesgo ESTÁNDAR: amarillo ámbar (#D97706)
- Riesgo ALTO: rojo (#DC2626)
- Estados: badges pequeños con fondo suave, no colores sólidos intensos

### Componentes clave
- `EstadoBadge`: badge pequeño de color por estado del expediente
- `RiesgoIndicador`: indicador visual BAJO/ESTÁNDAR/ALTO con color e ícono
- `RutaProtegida`: HOC que verifica rol antes de renderizar la página
- Formularios multi-paso para registro de clientes (stepper)
- Tabla paginada con búsqueda y filtros para listado de clientes

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

Cada semana se debe demostrar mediciones en 5 categorías:

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

### Criterios de evaluación del Parcial 2
- Cumplimiento del avance semanal
- Aplicación correcta de métricas y mediciones
- Uso adecuado de herramientas de QA (SonarQube)
- Calidad del desarrollo
- Claridad y profesionalismo en las presentaciones
- Evidencia de mejora continua

---

## 14. División de Tareas del Equipo

| Persona | Responsabilidad | Casos de Uso |
|---------|----------------|-------------|
| Persona 1 | Backend — Datos y Registro | CU-00, CU-01, CU-03 |
| Persona 2 | Backend — Documentos y Perfiles | CU-04, CU-05, CU-06, CU-08 |
| Persona 3 | Backend — Riesgo, Activación e Integración | CU-11, CU-15, CU-17 |
| Persona 4 (medio) | Frontend y QA | Todas las páginas + pruebas |

---

## 15. Instrucciones para el Agente

### Lo que debes generar

Genera todos los archivos del proyecto directamente en la carpeta de trabajo, siguiendo este orden:

1. `docker-compose.yml`
2. `database/init.sql` — tablas completas + seed de 3 usuarios con hash bcrypt
3. `backend/Dockerfile`
4. `backend/requirements.txt`
5. `backend/app/core/config.py`
6. `backend/app/core/security.py` — JWT: crear y verificar tokens
7. `backend/app/database.py`
8. `backend/app/models/usuario.py`
9. `backend/app/models/cliente.py`
10. `backend/app/models/persona_natural.py`
11. `backend/app/models/persona_juridica.py`
12. `backend/app/models/representante_legal.py`
13. `backend/app/models/beneficiario_final.py`
14. `backend/app/models/documento.py`
15. `backend/app/models/perfil_financiero.py`
16. `backend/app/models/perfil_transaccional.py`
17. `backend/app/models/clasificacion_riesgo.py`
18. `backend/app/models/auditoria.py`
19. `backend/app/schemas/auth.py`
20. `backend/app/schemas/cliente.py`
21. `backend/app/schemas/documento.py`
22. `backend/app/schemas/perfil.py`
23. `backend/app/schemas/riesgo.py`
24. `backend/app/schemas/auditoria.py`
25. `backend/app/services/estado_service.py`
26. `backend/app/services/riesgo_service.py`
27. `backend/app/services/auditoria_service.py`
28. `backend/app/routers/auth.py`
29. `backend/app/routers/clientes.py`
30. `backend/app/routers/documentos.py`
31. `backend/app/routers/perfiles.py`
32. `backend/app/routers/riesgo.py`
33. `backend/app/routers/activacion.py`
34. `backend/app/routers/auditoria.py`
35. `backend/app/main.py`
36. `frontend/Dockerfile`
37. `frontend/package.json` — con pnpm como gestor
38. `frontend/vite.config.js`
39. `frontend/index.html`
40. `frontend/src/api/axiosConfig.js`
41. `frontend/src/context/AuthContext.jsx`
42. `frontend/src/components/RutaProtegida.jsx`
43. `frontend/src/components/EstadoBadge.jsx`
44. `frontend/src/components/RiesgoIndicador.jsx`
45. `frontend/src/components/Navbar.jsx`
46. `frontend/src/components/Sidebar.jsx`
47. `frontend/src/pages/Login.jsx`
48. `frontend/src/pages/Dashboard.jsx`
49. `frontend/src/pages/ListadoClientes.jsx`
50. `frontend/src/pages/RegistroNatural.jsx`
51. `frontend/src/pages/RegistroJuridica.jsx`
52. `frontend/src/pages/DetalleExpediente.jsx`
53. `frontend/src/pages/Documentos.jsx`
54. `frontend/src/pages/Perfiles.jsx`
55. `frontend/src/pages/Riesgo.jsx`
56. `frontend/src/pages/Activacion.jsx`
57. `frontend/src/pages/Auditoria.jsx`
58. `frontend/src/App.jsx`
59. `frontend/src/main.jsx`
60. `.env.example`
61. `.gitignore`
62. `README.md`

### Reglas estrictas de código

- Usar **pnpm** en el frontend. Nunca npm ni yarn.
- Variables, funciones y comentarios de dominio en **español**
- Todos los IDs son **UUID**
- Todos los endpoints devuelven **JSON**
- El frontend consume el backend via **Axios** con interceptor JWT
- Los estados del expediente **solo cambian** a través de `estado_service.py`
- Toda acción relevante llama automáticamente a `auditoria_service.py`
- El cálculo de riesgo es **automático** al completar ambos perfiles
- **Sin módulo de administración** en el MVP
- La lógica de riesgo usa **reglas cualitativas** (sección 6 — CU-15), no matriz de puntos
- CORS configurado en FastAPI para permitir el frontend en `http://localhost:5173`
- Los documentos se guardan en `/app/uploads/` con nombre UUID para evitar colisiones
- El frontend debe verse **profesional**, no académico (ver sección 12)
- **Sin referencias a códigos CU en la interfaz** de usuario
- Formularios de registro con **stepper multi-paso** para mejor UX
- Rutas del frontend protegidas por rol con `RutaProtegida`
