# DDC/KYC Inmobiliario — Sistema de Debida Diligencia de Clientes

Sistema web para la gestión de Debida Diligencia de Clientes (DDC/KYC) enfocado en promotoras inmobiliarias de la República de Panamá, conforme a la Ley 23 de 2015 y supervisión de la SSNF. Versión 3.1 con rediseño luxury, acceso total para admin y gestión de usuarios.

## Stack Tecnológico

- **Frontend:** React 18 + Vite 5 + Tailwind CSS v3 + pnpm
- **Backend:** Python 3.11 + FastAPI
- **Base de datos:** PostgreSQL 15
- **ORM:** SQLAlchemy 2.0 + Alembic
- **Autenticación:** JWT (15 min) + Refresh Token (7 días, SHA-256 en BD) + Sesión única
- **Contenedores:** Docker + Docker Compose
- **Testing E2E:** Playwright
- **QA:** SonarQube Community (métricas obligatorias para el parcial)

## Requisitos previos

- Docker Desktop
- Git
- pnpm (`npm install -g pnpm`)

## Inicio rápido

1. Clonar el repositorio
2. Copiar `.env.example` a `.env`
3. Ejecutar:

```bash
docker-compose up --build
```

4. Acceder a:
   - Frontend: http://localhost:5173
   - Backend API docs (Swagger): http://localhost:8000/docs
   - Backend API redoc: http://localhost:8000/redoc

## Usuarios precargados y seed demo

| Usuario | Rol | Contraseña | Acceso |
|---------|-----|------------|--------|
| empleado@ddc.com | empleado | empleado123 | Registrar clientes, documentos, perfiles, beneficiarios, responder observaciones |
| oficial@ddc.com | oficial_cumplimiento | oficial123 | Verificar documentos, validar BF, ver riesgo, activar/rechazar/bloquear clientes, crear/cerrar observaciones, ver auditoría |
| auditor@ddc.com | auditor | auditor123 | Ver riesgo, ver auditoría, consultar clientes, exportar CSV |
| admin@ddc.com | admin | admin123 | **Acceso total a todos los paneles + gestión de usuarios + matriz de riesgo** |
| demo_empleado@ddc.com | empleado | empleado123 | Usuario adicional para demos y pruebas E2E |

> **Seguridad:** Las contraseñas se almacenan con hash bcrypt. El token de acceso JWT expira en 15 minutos. El refresh token expira en 7 días. Un nuevo login revoca automáticamente la sesión anterior. El admin puede crear nuevos usuarios desde `/admin/usuarios`.

Los usuarios base se cargan desde `database/init.sql` cuando PostgreSQL inicializa una base nueva. El seed demo extendido (`backend/seed_demo.py`) queda desactivado por defecto para no sobrescribir datos de trabajo en cada arranque.

Para iniciar el stack y ejecutar el seed demo una vez:

```bash
RUN_DEMO_SEED=true docker-compose up --build
```

También puede ejecutarse manualmente sobre el backend ya levantado:

```bash
docker-compose exec backend python seed_demo.py
```

## Estructura del proyecto

```
ddc-kyc-sistema/
├── backend/           # API FastAPI
│   ├── app/
│   │   ├── core/      # Config, seguridad (JWT, bcrypt), RBAC
│   │   ├── models/    # 11 modelos SQLAlchemy
│   │   ├── routers/   # 9 routers de API REST
│   │   ├── schemas/   # Validación Pydantic
│   │   └── services/  # Lógica de negocio (riesgo, estados, auditoría)
│   ├── alembic/       # Migraciones de base de datos
│   └── seed_demo.py   # Seed determinista para demos
├── frontend/          # Aplicación React + Vite + Tailwind CSS + pnpm
│   ├── src/
│   │   ├── components/  # Navbar, Sidebar, EstadoBadge, RiesgoIndicador, RutaProtegida
│   │   ├── pages/       # 12 páginas operativas + 2 de admin
│   │   ├── api/         # Axios instance con interceptor JWT
│   │   ├── context/     # AuthContext (JWT + rol global)
│   │   ├── shells/      # OperativeLayout y AdminShell
│   │   └── styles/      # global.css con tokens del tema luxury
│   ├── Dockerfile
│   └── package.json
├── database/          # Scripts de inicialización (init.sql con seed)
├── e2e/               # Pruebas end-to-end con Playwright
├── docker-compose.yml
├── .env.example
├── CONTEXT.md         # Documento maestro de contexto del proyecto
├── docs/              # Documentacion operativa, automatizaciones y reglas de cumplimiento
├── MANUAL_USUARIO.md  # Guía de uso completa
└── README.md
```

## Novedades de la versión 3.0

- **Admin con acceso total:** El rol `administrador` puede acceder a **todos** los paneles operativos (Clientes, Documentos, Perfiles, Riesgo, Activación, Observaciones, Beneficiarios, Auditoría) además de la Administración.
- **Gestión de usuarios (nuevo):** El Administrador puede crear usuarios, cambiar roles y eliminar usuarios desde el panel `/admin/usuarios` sin tocar la base de datos.
- **Matriz de riesgo versionada:** El administrador puede configurar factores de riesgo, pesos y umbrales sin tocar código.
- **Observaciones accionables:** El Oficial de Cumplimiento puede crear observaciones sobre expedientes; el Empleado las responde; sin observaciones abiertas no se puede activar.
- **Bloqueo y desbloqueo de clientes:** Un cliente ACTIVO puede ser bloqueado por el Oficial con motivo obligatorio, y posteriormente desbloqueado.
- **Beneficiarios Finales con validación OC:** Las personas jurídicas inician en estado `PENDIENTE_BF` hasta que todos sus beneficiarios finales relevantes sean aprobados por el Oficial.
- **Sesión única y refresh automático:** El frontend renueva el token de acceso automáticamente vía interceptor Axios. Cierre por inactividad de 30 minutos.
- **Auditoría administrativa separada:** Registra login/logout, cambios en la matriz, gestión de usuarios y exportaciones CSV.
- **Exportación CSV:** Auditor y Admin pueden exportar historial de auditoría de expediente y administrativa.
- **Rediseño luxury coherente:** Todos los paneles operativos y de administración comparten un mismo sistema de diseño con cards, tablas, badges, banners y botones estilizados.
- **Fixes funcionales:** Búsqueda de clientes por nombre/documento/RUC, campos correctos en perfil transaccional, confirmación manual para riesgo ALTO, descarga de documentos y manejo de UUID/datetime en schemas.

## Notas

- Todo corre dentro de contenedores; no se necesita instalar Python ni PostgreSQL localmente.
- Los documentos adjuntos se almacenan en el volumen `./uploads` con nombre UUID y hash SHA-256 para integridad.
- Los usuarios se crean automáticamente al iniciar PostgreSQL por primera vez mediante `database/init.sql`.
- El seed demo extendido no corre por defecto. Activarlo solo cuando se quieran regenerar datos de demostración, porque reemplaza documentos, observaciones, clasificaciones y auditorías asociadas a los clientes demo.
- El administrador puede crear usuarios adicionales desde la interfaz web en `/admin/usuarios` sin reiniciar la base de datos.
- Para reconstruir desde cero (borrar datos): `docker-compose down -v && docker-compose up --build`
- El frontend usa **pnpm** como gestor de paquetes (prohibido npm/yarn en este proyecto).
- Todos los paneles comparten un sistema de diseño coherente con tema **Luxury Corporate Dark** (colores dorado, navy y parchment).

## Documentacion de cumplimiento

- `docs/actores-y-responsabilidades.md`: responsabilidades por rol y actor sistema.
- `docs/flujo-cumplimiento.md`: flujo automatizado del expediente.
- `docs/motor-documental.md`: motor de reglas, extraccion simulada y ruta a OCR real.
- `docs/automatizaciones.md`: automatizaciones implementadas y futuras.
- `docs/auditoria.md`: auditoria funcional y tecnica.
- `docs/bandeja-oficial.md`: uso de la bandeja inteligente.
- `docs/manual-operativo.md`: guia operativa por actor.
- `docs/adr-005-motor-reglas-documental.md`: decision tecnica del motor documental.
