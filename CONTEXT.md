# Contexto del Proyecto — DDC/KYC Inmobiliario

> Documento maestro de contexto para desarrolladores y agentes de IA.
> Versión MVP 1.0 — Junio 2026
> Universidad Tecnológica de Panamá (UTP) — Ingeniería de Software — Parcial 2

---

## 1. Visión General

### 1.1 Propósito
Sistema web de **Debida Diligencia de Clientes (DDC/KYC)** para el sector inmobiliario panameño. Digitaliza y automatiza el proceso regulatorio obligatorio por la **Ley 23 de 27 de abril de 2015** (Prevención de Blanqueo de Capitales, Financiamiento del Terrorismo y FPADM), supervisado por la **SSNF**.

### 1.2 Problema que resuelve
Las promotoras inmobiliarias realizan el proceso KYC manualmente, generando:
- Errores humanos en registro de información
- Retrasos en revisión y aprobación de expedientes
- Inconsistencias documentales
- Dificultad para demostrar trazabilidad ante auditorías de la SSNF
- Riesgo de sanciones por incumplimiento

### 1.3 Usuarios finales
Sujetos Obligados No Financieros (Art. 23 Ley 23/2015):
- Promotoras inmobiliarias registradas en Panamá
- Agentes y corredores de bienes raíces autorizados
- Empresas constructoras involucradas en venta/desarrollo inmobiliario

### 1.4 Contexto de uso
**Herramienta interna.** Los empleados de la promotora registran y verifican a los compradores. El cliente final NO interactúa con el sistema. El flujo es:
1. Empleado registra datos y adjunta documentos escaneados
2. Oficial de Cumplimiento verifica documentos y toma decisiones
3. Auditor revisa logs y trazabilidad
4. Administrador gestiona usuarios y roles

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| **Frontend** | React + Vite | React 18 / Vite 5 | SPA con React Router DOM v6 |
| **Gestor frontend** | **pnpm** | Latest | Prohibido npm/yarn en este proyecto |
| **Backend** | Python + FastAPI | Python 3.11 / FastAPI 0.104 | API REST async, auto-documentada |
| **Base de datos** | PostgreSQL | 15 | Persistencia de datos + seed automático |
| **ORM** | SQLAlchemy + Alembic | SQLAlchemy 2.0 | Modelos declarativos, migraciones listas |
| **Autenticación** | JWT (python-jose) + bcrypt | passlib 1.7.4 / bcrypt 4.0.1 | Token con expiración de 8 horas |
| **Contenedores** | Docker + Docker Compose | Docker 24+ | Todo corre en contenedores |
| **QA** | SonarQube Community | Latest | Métricas obligatorias para el parcial |
| **Control de versiones** | GitHub | Git 2.40+ | Repo local listo para push |

### 2.1 Dependencias clave del frontend
- `react` / `react-dom` — UI
- `react-router-dom` — Enrutamiento + rutas protegidas por rol
- `axios` — HTTP client con interceptor JWT
- `react-hook-form` — Formularios (usado en perfiles y admin)

### 2.2 Dependencias clave del backend
- `fastapi` — Framework web
- `uvicorn` — Servidor ASGI
- `sqlalchemy` + `psycopg2-binary` — ORM y driver PostgreSQL
- `alembic` — Migraciones de base de datos
- `python-jose[cryptography]` — Crear y verificar JWT
- `passlib` + `bcrypt` — Hash de contraseñas
- `python-multipart` — Upload de archivos
- `pydantic` + `pydantic-settings` — Validación y config

---

## 3. Arquitectura del Sistema

### 3.1 Diagrama de capas

```
┌─────────────────────────────────────────┐
│  FRONTEND (React + Vite)               │  Puerto 5173
│  - Componentes reutilizables            │
│  - Pages por módulo                     │
│  - AuthContext (JWT + rol global)       │
│  - Axios interceptor Bearer token       │
└─────────────────┬───────────────────────┘
                  │ HTTP REST + JSON
┌─────────────────▼───────────────────────┐
│  BACKEND (FastAPI)                      │  Puerto 8000
│  - Routers (auth, clientes, docs, etc.) │
│  - Schemas (Pydantic)                   │
│  - Models (SQLAlchemy)                  │
│  - Services (riesgo, estado, auditoría)│
│  - Core (config, security/JWT)          │
└─────────────────┬───────────────────────┘
                  │ SQLAlchemy + psycopg2
┌─────────────────▼───────────────────────┐
│  BASE DE DATOS (PostgreSQL 15)         │  Puerto 5432
│  - Tablas: 11 entidades               │
│  - Seed automático vía init.sql       │
│  - UUIDs nativos con uuid-ossp        │
└─────────────────────────────────────────┘
```

### 3.2 Patrones aplicados
- **Repository pattern** implícito: los routers acceden directamente a los modelos SQLAlchemy
- **Service layer**: `estado_service.py`, `riesgo_service.py`, `auditoria_service.py` encapsulan reglas de negocio
- **Dependency Injection**: FastAPI `Depends()` para DB session y usuario actual
- **HOC (Higher-Order Component)**: `RutaProtegida.jsx` protege rutas por rol
- **Context API**: `AuthContext.jsx` para estado global de autenticación

---

## 4. Estructura de Carpetas (real)

```
C:\Users\royba\OneDrive\Escritorio\parcial v2/
│
├── docker-compose.yml              # Orquesta db + backend + frontend
├── .env.example                    # Variables de entorno de referencia
├── .gitignore                      # Exclusiones de Git
├── README.md                       # Inicio rápido
├── MANUAL_USUARIO.md               # Guía de uso para usuarios finales
├── DDC_KYC_PROMPT_MAESTRO_v2.md    # Documento fuente del proyecto (intacto)
├── .skills/                        # Skill descargada de skills.sh
│   └── frontend-design/
│       └── SKILL.md
│
├── database/
│   └── init.sql                    # DDL completo + seed de 4 usuarios bcrypt
│
├── backend/
│   ├── Dockerfile                  # Python 3.11 slim + uvicorn --reload
│   ├── requirements.txt            # Dependencias Python fijadas
│   ├── alembic.ini                 # Config de migraciones
│   │
│   ├── alembic/
│   │   ├── env.py                  # Entorno Alembic con SQLAlchemy Base
│   │   └── versions/               # Carpetas de migraciones (vacía en MVP)
│   │
│   └── app/
│       ├── __init__.py
│       ├── main.py                 # Entry point FastAPI + CORS + include_routers
│       ├── database.py             # Engine, SessionLocal, Base declarative
│       │
│       ├── core/
│       │   ├── __init__.py
│       │   ├── config.py           # Variables de entorno con pydantic-settings
│       │   └── security.py         # JWT create/verify + bcrypt hash/verify
│       │
│       ├── models/                 # 11 modelos SQLAlchemy
│       │   ├── __init__.py
│       │   ├── usuario.py
│       │   ├── cliente.py
│       │   ├── persona_natural.py
│       │   ├── persona_juridica.py
│       │   ├── representante_legal.py
│       │   ├── beneficiario_final.py
│       │   ├── documento.py
│       │   ├── perfil_financiero.py
│       │   ├── perfil_transaccional.py
│       │   ├── clasificacion_riesgo.py
│       │   └── auditoria.py
│       │
│       ├── schemas/                # 6 módulos de Pydantic schemas
│       │   ├── __init__.py
│       │   ├── auth.py
│       │   ├── cliente.py
│       │   ├── documento.py
│       │   ├── perfil.py
│       │   ├── riesgo.py
│       │   └── auditoria.py
│       │
│       ├── routers/                # 7 routers de API
│       │   ├── __init__.py
│       │   ├── auth.py             # Login, me, listar/crear usuarios (admin)
│       │   ├── clientes.py         # CRUD clientes natural/jurídica
│       │   ├── documentos.py       # Upload, listar, verificar, rechazar
│       │   ├── perfiles.py         # Perfil financiero y transaccional
│       │   ├── riesgo.py           # Consultar y forzar recálculo
│       │   ├── activacion.py       # Activar y rechazar clientes
│       │   └── auditoria.py        # Historial por cliente y global
│       │
│       └── services/               # 3 servicios de reglas de negocio
│           ├── __init__.py
│           ├── estado_service.py   # Máquina de estados + transiciones
│           ├── riesgo_service.py   # Lógica cualitativa de riesgo
│           └── auditoria_service.py # Registro automático de auditoría
│
└── frontend/
    ├── Dockerfile                  # Node 20 slim + pnpm global
    ├── package.json                # Dependencias React (usar pnpm)
    ├── vite.config.js              # Config Vite con host true
    ├── index.html                  # HTML base con fuentes Google
    │
    └── src/
        ├── main.jsx                # Entry point React + import global.css
        ├── App.jsx                 # React Router + Layout + rutas protegidas
        │
        ├── api/
        │   └── axiosConfig.js      # Axios instance + interceptor JWT
        │
        ├── context/
        │   └── AuthContext.jsx     # Estado global: usuario, rol, token, login/logout
        │
        ├── styles/
        │   └── global.css          # Variables CSS, utilidades, animaciones, tema oscuro
        │
        ├── components/
        │   ├── Navbar.jsx          # Header fijo con blur + logo dorado
        │   ├── Sidebar.jsx         # Navegación lateral por rol
        │   ├── RutaProtegida.jsx   # HOC de protección por rol
        │   ├── EstadoBadge.jsx     # Badge visual por estado del expediente
        │   └── RiesgoIndicador.jsx # Indicador con glow por nivel de riesgo
        │
        └── pages/                  # 12 páginas principales
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── ListadoClientes.jsx
            ├── RegistroNatural.jsx
            ├── RegistroJuridica.jsx
            ├── DetalleExpediente.jsx
            ├── Documentos.jsx
            ├── Perfiles.jsx
            ├── Riesgo.jsx
            ├── Activacion.jsx
            ├── Auditoria.jsx
            └── Administracion.jsx
```

---

## 5. Modelo de Datos (entidades y relaciones)

### 5.1 Diagrama ER (texto)

```
usuarios
  │1
  │
  │*  registrado_por
  ▼
clientes (base abstracta)
  │1
  ││
  │├──────► personas_naturales (1:1 herencia)
  │├──────► personas_juridicas (1:1 herencia)
  ││
  ││*  id_cliente
  │▼
  ├──────► representantes_legales (1:N)
  ├──────► beneficiarios_finales (1:N)
  ├──────► documentos (1:N)
  ├──────► perfiles_financieros (1:1)
  ├──────► perfiles_transaccionales (1:1)
  ├──────► clasificaciones_riesgo (1:N histórico)
  └──────► auditorias (1:N)
```

### 5.2 Descripción de tablas

| Tabla | Propósito | Clave | Notas |
|-------|-----------|-------|-------|
| `usuarios` | Credenciales y roles del sistema | `id` UUID PK | 4 usuarios seed con bcrypt |
| `clientes` | Entidad base: tipo, estado, riesgo, PEP | `id_cliente` UUID PK | Estado máquina de estados |
| `personas_naturales` | Datos identificatorios del individuo | `id` UUID PK FK→clientes | Herencia por FK 1:1 |
| `personas_juridicas` | Datos de la empresa/entidad | `id` UUID PK FK→clientes | Herencia por FK 1:1 |
| `representantes_legales` | Datos del representante | `id` UUID PK | FK→clientes |
| `beneficiarios_finales` | UBOs con % de participación | `id` UUID PK | CHECK ≥25% |
| `documentos` | Archivos adjuntos | `id_documento` UUID PK | Estado: PENDIENTE/VERIFICADO/RECHAZADO |
| `perfiles_financieros` | Perfil financiero del cliente | `id_perfil` UUID PK | UNIQUE por cliente |
| `perfiles_transaccionales` | Perfil transaccional | `id_perfil` UUID PK | UNIQUE por cliente |
| `clasificaciones_riesgo` | Historial de cálculos de riesgo | `id_clasificacion` UUID PK | JSONB factores_aplicados |
| `auditorias` | Log inmutable de acciones | `id_auditoria` UUID PK | Registro automático |

---

## 6. Flujo de Casos de Uso (MVP)

### 6.1 Flujo principal completo

```
CU-00 Login
   │
   ▼
CU-01 Registrar Cliente (Empleado)
   ├── Persona Natural: datos personales + perfil
   └── Persona Jurídica: datos empresa + RL + UBO + perfil
   │
   ▼
CU-04 Adjuntar Documentos (Empleado)
   ├── PN: identidad, ingresos, residencia
   └── PJ: aviso_operacion, certificado_existencia, id_representante, id_beneficiarios
   │
   ▼
CU-08 Verificar Documentos (Oficial)
   ├── Aprobar → VERIFICADO
   └── Rechazar → RECHAZADO + motivo
   │
   └──► [AUTO] CU-?? Cambio de estado PENDIENTE → EN_REVISION
        (cuando todos los docs obligatorios están VERIFICADOS)
   │
   ▼
CU-05 Registrar Perfil Financiero (Empleado)
CU-06 Registrar Perfil Transaccional (Empleado)
   │
   └──► [AUTO] CU-15 Calcular Riesgo
        (disparado al completar ambos perfiles)
   │
   ▼
CU-11 Activar / Rechazar Cliente (Oficial)
   ├── Activar → ACTIVO (si requisitos completos)
   └── Rechazar → RECHAZADO + motivo
   │
   ▼
CU-17 Auditoría (Auditor / Oficial)
   └── Consulta histórico de todas las acciones
```

### 6.2 Casos de uso descartados del MVP
- Notificaciones automáticas (email/SMS)
- Reportes avanzados / exportación PDF
- Integración con SSNF, UAF, listas OFAC/ONU reales
- Firma digital, OCR, reconocimiento biométrico
- Dashboard con gráficas avanzadas
- Microservicios
- Refresh tokens, MFA, OAuth
- Multi-tenant

---

## 7. API REST — Endpoints

### 7.1 Auth
```
POST /auth/login                → Token JWT
GET  /auth/me                   → Datos del usuario autenticado
GET  /auth/usuarios             → Listar usuarios (admin)
POST /auth/usuarios             → Crear usuario (admin)
```

### 7.2 Clientes
```
POST /clientes/natural          → Registrar persona natural
POST /clientes/juridica         → Registrar persona jurídica
GET  /clientes                  → Listar con filtros y paginación
GET  /clientes/{id}             → Detalle completo del expediente
```

### 7.3 Documentos
```
POST /clientes/{id}/documentos              → Adjuntar documento (multipart/form-data)
GET  /clientes/{id}/documentos              → Listar documentos del cliente
PATCH /clientes/documentos/{id}/verificar   → Aprobar documento
PATCH /clientes/documentos/{id}/rechazar  → Rechazar documento + motivo
```

### 7.4 Perfiles
```
POST /clientes/{id}/perfil-financiero      → Registrar perfil financiero
GET  /clientes/{id}/perfil-financiero      → Consultar perfil financiero
POST /clientes/{id}/perfil-transaccional   → Registrar perfil transaccional
GET  /clientes/{id}/perfil-transaccional   → Consultar perfil transaccional
```

### 7.5 Riesgo
```
GET  /clientes/{id}/riesgo                 → Ver clasificación calculada
POST /clientes/{id}/riesgo/calcular        → Forzar recálculo manual
```

### 7.6 Activación
```
PATCH /clientes/{id}/activar               → Activar cliente
PATCH /clientes/{id}/rechazar              → Rechazar cliente + motivo
```

### 7.7 Auditoría
```
GET /clientes/{id}/auditoria               → Historial por expediente
GET /auditoria                             → Historial global (últimos 200)
```

---

## 8. Roles y Permisos

| Acción | Empleado | Oficial | Auditor | Administrador |
|--------|----------|---------|---------|---------------|
| Iniciar sesión | ✅ | ✅ | ✅ | ✅ |
| Registrar cliente | ✅ | ❌ | ❌ | ✅ |
| Consultar clientes | ✅ | ✅ | ✅ | ✅ |
| Adjuntar documentos | ✅ | ❌ | ❌ | ✅ |
| Verificar/aprobar documentos | ❌ | ✅ | ❌ | ✅ |
| Rechazar documentos | ❌ | ✅ | ❌ | ✅ |
| Registrar perfil financiero | ✅ | ❌ | ❌ | ✅ |
| Registrar perfil transaccional | ✅ | ❌ | ❌ | ✅ |
| Ver clasificación de riesgo | ❌ | ✅ | ✅ | ✅ |
| Activar cliente | ❌ | ✅ | ❌ | ✅ |
| Rechazar cliente | ❌ | ✅ | ❌ | ✅ |
| Ver historial de auditoría | ❌ | ✅ | ✅ | ✅ |
| Crear usuarios | ❌ | ❌ | ❌ | ✅ |

> Nota: El rol `administrador` es un superusuario que puede realizar cualquier acción. Fue agregado post-MVP documento original pero está completamente integrado.

---

## 9. Máquina de Estados del Expediente

```
PENDIENTE
    │
    │  (automático: cuando todos los docs obligatorios están VERIFICADOS)
    ▼
EN_REVISION
    │
    ├──────► ACTIVO      (Oficial confirma, requisitos completos)
    │
    └──────► RECHAZADO   (Oficial rechaza con motivo obligatorio)

PENDIENTE ──────► RECHAZADO  (Oficial puede rechazar desde cualquier estado)
```

**Transiciones permitidas:**

| Desde | Hacia | Condición | Actor |
|-------|-------|-----------|-------|
| PENDIENTE | EN_REVISION | Todos los docs obligatorios VERIFICADOS | Sistema (automático) |
| EN_REVISION | ACTIVO | Requisitos de activación completos | Oficial de Cumplimiento |
| EN_REVISION | RECHAZADO | Motivo obligatorio ingresado | Oficial de Cumplimiento |
| PENDIENTE | RECHAZADO | Motivo obligatorio ingresado | Oficial de Cumplimiento |

**Regla crítica:** Todo cambio de estado pasa obligatoriamente por `estado_service.py`. Ningún router modifica el estado directamente.

---

## 10. Reglas de Negocio Críticas

### 10.1 Activación de cliente (checklist)
Para que un cliente pueda activarse, DEBE cumplir:
1. Estado actual: **EN_REVISION**
2. Todos los documentos obligatorios subidos y **VERIFICADOS**
3. Perfil financiero registrado
4. Perfil transaccional registrado
5. Riesgo calculado (automático al completar ambos perfiles)
6. Si es Persona Jurídica: al menos un Beneficiario Final registrado
7. Si riesgo es **ALTO**: confirmación manual adicional del Oficial

### 10.2 Cálculo de riesgo (reglas cualitativas)
**Trigger:** Al completar perfil financiero Y perfil transaccional.

| Factor | Nivel | Condición |
|--------|-------|-----------|
| Cliente PEP | **ALTO** | `es_pep = true` |
| País de riesgo | **ALTO** | País en lista predefinida (IR, KP, SY, AF, BY, MM, RU) |
| Monto > $500,000 | **ALTO** | `monto_estimado > 500000` |
| Origen fondos efectivo/no verificable | **ALTO** | `origen_fondos in ['efectivo', 'desconocido', 'otro_no_verificable']` |
| PJ extranjera + estructura compleja | **ALTO** | `pais != 'PA'` y `tipo_pj in ['fideicomiso', 'fundacion']` |
| Monto $100,000–$500,000 | **ESTÁNDAR** | `100000 <= monto <= 500000` |
| PJ nacional + documentación completa | **ESTÁNDAR** | `tipo = 'JURIDICA'` y `pais = 'PA'` |
| Ningún factor de riesgo | **BAJO** | Default cuando no aplica ninguna condición anterior |

**Regla de prioridad:** Si cualquier condición de ALTO se cumple, el resultado es ALTO sin importar los demás factores.

### 10.3 Documentos obligatorios por tipo de cliente

**Persona Natural:**
- `DOCUMENTO_IDENTIDAD` — Cédula o pasaporte
- `COMPROBANTE_INGRESOS` — Recibo, declaración, extracto bancario
- `COMPROBANTE_RESIDENCIA` — No mayor a 3 meses

**Persona Jurídica:**
- `AVISO_OPERACION` — Aviso de operación vigente
- `CERTIFICADO_EXISTENCIA` — Certificado de existencia y representación legal
- `IDENTIFICACION_REPRESENTANTE` — Documento del representante legal
- `IDENTIFICACION_BENEFICIARIOS` — Documentos de beneficiarios finales

### 10.4 Auditoría automática
Cada acción relevante genera un registro inmutable en `auditorias`:

| Acción | Cuándo se registra |
|--------|---------------------|
| CREAR_CLIENTE | Al registrar PN o PJ |
| ADJUNTAR_DOCUMENTO | Al subir un archivo |
| VERIFICAR_DOCUMENTO | Al aprobar un documento |
| RECHAZAR_DOCUMENTO | Al rechazar un documento |
| REGISTRAR_PERFIL_FINANCIERO | Al guardar perfil financiero |
| REGISTRAR_PERFIL_TRANSACCIONAL | Al guardar perfil transaccional |
| CALCULAR_RIESGO | Al completar ambos perfiles |
| ACTIVAR_CLIENTE | Al activar cliente |
| RECHAZAR_CLIENTE | Al rechazar cliente |
| CAMBIAR_ESTADO | Cualquier transición de estado |

---

## 11. Decisiones Técnicas Importantes

### 11.1 Por qué no hay módulo de admin en el MVP original
El documento fuente indica "Sin módulo de administración en el MVP". Se agregó el rol `administrador` posteriormente como extensión porque el usuario lo solicitó, pero se mantuvo la simplicidad: solo crear usuarios, no editar/eliminar.

### 11.2 Por qué herencia por FK 1:1 en lugar de tabla única
`personas_naturales` y `personas_juridicas` heredan de `clientes` mediante FK 1:1 en lugar de una única tabla con campos nullable. Esto:
- Evita tablas anchas con muchos NULLs
- Facilita validaciones específicas por tipo
- Es más extensible para futuros tipos de cliente

### 11.3 Por qué el cálculo de riesgo es cualitativo, no cuantitativo
El documento maestro especifica explícitamente: "La lógica de riesgo usa reglas cualitativas, no matriz de puntos". Esto se ajusta mejor al contexto regulatorio panameño donde el criterio del Oficial es tan importante como las reglas automáticas.

### 11.4 Por qué no hay refresh tokens ni MFA en el MVP
El token JWT expira en 8 horas (`ACCESS_TOKEN_EXPIRE_MINUTES: 480`). Para un sistema interno de oficina donde los empleados trabajan jornadas diurnas, esto es suficiente. Refresh tokens y MFA son complejidad innecesaria para un MVP académico de 3 semanas.

### 11.5 Por qué los archivos se guardan en disco, no en BD
Los documentos escaneados (PDF/JPG/PNG) se almacenan en `/app/uploads/` con nombre UUID. La BD solo guarda la ruta. Esto:
- Evita inflar la base de datos con BLOBs
- Facilita backups separados
- Permite servir archivos estáticos si se escala

---

## 12. Cómo levantar el proyecto

### 12.1 Requisitos previos
- Docker Desktop ejecutándose
- Git
- pnpm (`npm install -g pnpm`) — aunque el contenedor lo instala automáticamente

### 12.2 Comandos

```bash
# 1. Entrar a la carpeta
cd "C:\Users\royba\OneDrive\Escritorio\parcial v2"

# 2. (Opcional) Copiar variables de entorno
copy .env.example .env

# 3. Levantar todo con build
#    - db: PostgreSQL 15 con init.sql
#    - backend: FastAPI en puerto 8000
#    - frontend: Vite en puerto 5173
docker-compose up --build

# 4. Para detener
docker-compose down

# 5. Para borrar TODO (datos incluidos) y reconstruir
docker-compose down -v
docker-compose up --build
```

### 12.3 URLs una vez levantado
| Servicio | URL |
|----------|-----|
| Frontend (app web) | http://localhost:5173 |
| Backend API docs (Swagger) | http://localhost:8000/docs |
| Backend API redoc | http://localhost:8000/redoc |

---

## 13. Usuarios Seed (bcrypt)

| Nombre | Correo | Rol | Contraseña | Hash bcrypt (rounds 12) |
|--------|--------|-----|------------|------------------------|
| Empleado Demo | empleado@ddc.com | empleado | empleado123 | `$2b$12$xm97PLDY2TZh.cX3n19Y/.ZG0xWKk.vQDodjeGPf9iQoIPxmBqmR.` |
| Oficial de Cumplimiento | oficial@ddc.com | oficial_cumplimiento | oficial123 | `$2b$12$9SmuZWQkMsRr9QhRrS0d2u4LHxlNl471tG3eIy.O6SJelcOIxI6L6` |
| Auditor Interno | auditor@ddc.com | auditor | auditor123 | `$2b$12$vfiwTTljWAFo3Qy4cOxqBOLpnPJeXd.xymrIVW.2jMExExJR.WH2a` |
| Administrador | admin@ddc.com | administrador | admin123 | `$2b$12$ZKoL33JcpJtmfRM1VPfja.EXZ2sKxUPJ3RdAPGOSj95kE1F7tE166` |

> El seed corre automáticamente al levantar PostgreSQL por primera vez vía `database/init.sql` mapeado a `/docker-entrypoint-initdb.d/`. Si ya existe el volumen, los datos persisten. Para regenerar el seed, usar `docker-compose down -v`.

---

## 14. Notas para Desarrolladores

### 14.1 Convenciones de código
- **Idioma:** Español para variables, funciones, comentarios y mensajes de usuario
- **IDs:** Todos los identificadores son UUID v4
- **Formato de respuesta:** Todos los endpoints devuelven JSON
- **Gestor de paquetes frontend:** pnpm (prohibido npm/yarn)
- **Estilos:** CSS global con variables CSS (tema oscuro Luxury Corporate Dark)

### 14.2 CORS
Configurado en `app/main.py` para permitir origen `http://localhost:5173`.

### 14.3 Hot reload
- Backend: `uvicorn --reload` (cambia código Python y se recarga automáticamente)
- Frontend: Vite dev server con HMR (Hot Module Replacement)

### 14.4 Logs útiles
```bash
# Ver logs del backend en tiempo real
docker-compose logs -f backend

# Ver logs de la base de datos
docker-compose logs -f db

# Acceder a la BD desde terminal del contenedor
docker-compose exec db psql -U ddc_user -d ddc_db
```

### 14.5 Archivos que NO deben modificarse sin razón
- `DDC_KYC_PROMPT_MAESTRO_v2.md` — Documento fuente intacto
- `database/init.sql` — Solo si se agregan nuevos usuarios seed o cambios de schema que requieren recreación del volumen
- `.skills/frontend-design/SKILL.md` — Skill descargada de skills.sh (referencia de diseño)

---

## 15. Contacto y Contexto Académico

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

---

*Documento generado como referencia única del proyecto. Para dudas de uso, ver `MANUAL_USUARIO.md`. Para el documento fuente de requerimientos, ver `DDC_KYC_PROMPT_MAESTRO_v2.md`.*
