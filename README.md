# DDC/KYC Inmobiliario — Sistema de Debida Diligencia de Clientes

Sistema web para la gestión de Debida Diligencia de Clientes (DDC/KYC) enfocado en promotoras inmobiliarias de la República de Panamá, conforme a la Ley 23 de 2015 y supervisión de la SSNF.

## Stack Tecnológico

- **Frontend:** React + Vite + pnpm
- **Backend:** Python 3.11 + FastAPI
- **Base de datos:** PostgreSQL 15
- **ORM:** SQLAlchemy 2.0 + Alembic
- **Contenedores:** Docker + Docker Compose

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
   - Backend API docs: http://localhost:8000/docs
   - Backend API redoc: http://localhost:8000/redoc

## Usuarios precargados (seed)

| Usuario | Rol | Contraseña |
|---------|-----|------------|
| empleado@ddc.com | empleado | empleado123 |
| oficial@ddc.com | oficial_cumplimiento | oficial123 |
| auditor@ddc.com | auditor | auditor123 |
| admin@ddc.com | administrador | admin123 |

## Estructura del proyecto

```
ddc-kyc-sistema/
├── backend/       # API FastAPI
├── frontend/      # Aplicación React + Vite
├── database/      # Scripts de inicialización
├── docker-compose.yml
└── README.md
```

## Notas

- Todo corre dentro de contenedores; no se necesita instalar Python ni PostgreSQL localmente.
- Los documentos adjuntos se almacenan en el volumen `./uploads`.
- Los usuarios se crean automáticamente al iniciar PostgreSQL por primera vez mediante `database/init.sql`.
