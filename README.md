# DDC/KYC Inmobiliario — Sistema de Debida Diligencia de Clientes

Sistema web para la gestión de Debida Diligencia de Clientes (DDC/KYC) enfocado en promotoras inmobiliarias de la República de Panamá, conforme a la Ley 23 de 2015 y supervisión de la SSNF.

## Stack Tecnológico

- **Frontend:** React 18 + Vite 5 + Tailwind CSS v3 + pnpm
- **Backend:** Python 3.11 + FastAPI
- **Base de datos:** PostgreSQL 15
- **ORM:** SQLAlchemy 2.0 + Alembic
- **Autenticación:** JWT (15 min) + Refresh Token (7 días, SHA-256 en BD) + Sesión única
- **Contenedores:** Docker + Docker Compose
- **Testing E2E:** Playwright

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

## Usuarios precargados (seed)

| Usuario | Rol | Contraseña |
|---------|-----|------------|
| empleado@ddc.com | empleado | empleado123 |
| oficial@ddc.com | oficial_cumplimiento | oficial123 |
| auditor@ddc.com | auditor | auditor123 |
| admin@ddc.com | admin | admin123 |
| demo_empleado@ddc.com | empleado | empleado123 |

> **Seguridad:** Las contraseñas se almacenan con hash bcrypt. El token de acceso JWT expira en 15 minutos. El refresh token expira en 7 días. Un nuevo login revoca automáticamente la sesión anterior.

## Estructura del proyecto

```
ddc-kyc-sistema/
├── backend/           # API FastAPI
│   ├── app/
│   ├── alembic/
│   └── seed_demo.py   # Seed determinista para demos
├── frontend/          # Aplicación React + Vite + Tailwind CSS
├── database/          # Scripts de inicialización
├── e2e/               # Pruebas end-to-end con Playwright
├── docker-compose.yml
├── .env.example
└── README.md
```

## Novedades de la versión 3.0

- **Matriz de riesgo versionada:** El administrador puede configurar factores de riesgo, pesos y umbrales sin tocar código.
- **Observaciones accionables:** El Oficial de Cumplimiento puede crear observaciones sobre expedientes; el Empleado las responde; sin observaciones abiertas no se puede activar.
- **Bloqueo y desbloqueo de clientes:** Un cliente ACTIVO puede ser bloqueado por el Oficial con motivo obligatorio, y posteriormente desbloqueado.
- **Beneficiarios Finales con validación OC:** Las personas jurídicas inician en estado `PENDIENTE_BF` hasta que al menos un BF sea aprobado por el Oficial.
- **Sesión única y refresh automático:** El frontend renueva el token de acceso automáticamente vía interceptor Axios. Cierre por inactividad de 30 minutos.
- **Auditoría administrativa separada:** Registra login/logout, cambios en la matriz y exportaciones CSV.
- **Exportación CSV:** Auditor y Admin pueden exportar historial de auditoría de expediente y administrativa.

## Notas

- Todo corre dentro de contenedores; no se necesita instalar Python ni PostgreSQL localmente.
- Los documentos adjuntos se almacenan en el volumen `./uploads` con nombre UUID y hash SHA-256 para integridad.
- Los usuarios se crean automáticamente al iniciar PostgreSQL por primera vez mediante `database/init.sql`.
- Para reconstruir desde cero (borrar datos): `docker-compose down -v && docker-compose up --build`
