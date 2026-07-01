# DDC/KYC Inmobiliario

Sistema web para gestionar Debida Diligencia de Clientes (DDC/KYC) en promotoras inmobiliarias de Panama. El producto organiza el trabajo por roles, automatiza validaciones documentales y deja trazabilidad de decisiones humanas, reglas automaticas e IA/OCR asistida.

## Que resuelve

- Registro de clientes naturales y juridicos.
- Carga y revision de documentos obligatorios.
- Validacion de beneficiarios finales relevantes.
- Matriz de riesgo versionada y auditable.
- Bandejas operativas para Empleado y Oficial de Cumplimiento.
- Activacion, rechazo, bloqueo, desbloqueo y reversion con motivo auditado.
- Auditoria funcional, auditoria administrativa y corridas tecnicas IA.
- IA/OCR configurable para extraer datos, comparar evidencia, resumir expedientes, sugerir observaciones, ejecutar screening local y priorizar casos.

La IA asiste, pero no decide cumplimiento. Activacion, rechazo, riesgo y validacion final siguen dependiendo de reglas deterministicas y usuarios autorizados.

## Stack

- Frontend: React 18 + Vite 5 + Tailwind CSS + pnpm
- Backend: Python 3.11 + FastAPI + SQLAlchemy
- Base de datos: PostgreSQL 15
- Autenticacion: JWT + refresh token + sesion unica
- Contenedores: Docker + Docker Compose
- E2E: Playwright
- QA academico: SonarQube Community
- IA/OCR: modo `mock`, OCR local, Ollama, Groq y Google configurables por entorno/admin

## Prerequisitos

- Docker Desktop
- Git
- Node.js/npm para instalar pnpm si hace falta
- pnpm: `npm install -g pnpm`
- Opcional para IA local: Ollama instalado en la maquina host

## Inicio rapido

1. Copia la plantilla de entorno:

```bash
cp .env.example .env
```

2. Levanta el stack:

```bash
docker-compose up --build
```

3. Abre:

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Swagger API | http://localhost:8000/docs |
| ReDoc API | http://localhost:8000/redoc |
| SonarQube | http://localhost:9000 |

## Usuarios base

| Usuario | Rol | Contrasena | Uso principal |
|---------|-----|------------|---------------|
| `empleado@ddc.com` | empleado | `empleado123` | Registro, documentos, perfiles, BF y respuestas a observaciones. |
| `oficial@ddc.com` | oficial_cumplimiento | `oficial123` | Cumplimiento, riesgo, activacion, BF, observaciones y post-activacion. |
| `auditor@ddc.com` | auditor | `auditor123` | Consulta de auditoria y exportaciones. |
| `admin@ddc.com` | admin | `admin123` | Gobierno del sistema, usuarios, matriz, IA y screening. |
| `demo_empleado@ddc.com` | empleado | `empleado123` | Usuario adicional para demos y pruebas. |

Los usuarios base se cargan desde `database/init.sql` cuando PostgreSQL inicializa una base nueva.

## Seed demo

El seed extendido queda desactivado por defecto para no sobrescribir datos de trabajo.

Ejecutarlo al levantar el stack:

```bash
RUN_DEMO_SEED=true docker-compose up --build
```

Ejecutarlo manualmente con el backend arriba:

```bash
docker-compose exec backend python seed_demo.py
```

## IA/OCR en corto

Defaults seguros sin API keys:

```env
AI_MODE=mock
OCR_PROVIDER=mock
LLM_PROVIDER=none
EMBEDDINGS_PROVIDER=mock
AI_STRICT_MODE=true
AI_MIN_CONFIDENCE=0.82
```

Modo recomendado para demo con Groq + Ollama:

```env
AI_MODE=groq
OCR_PROVIDER=local
LLM_PROVIDER=groq
EMBEDDINGS_PROVIDER=local
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_LLM_MODEL=gemma3:4b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

Antes de usar Ollama:

```bash
ollama pull gemma3:4b
ollama pull nomic-embed-text
```

La configuracion operativa tambien puede administrarse desde `/admin/ia`. Las API keys siguen viviendo en `.env`; no se guardan en base de datos ni se commitean.

Detalle completo: [docs/ai-ocr-architecture.md](docs/ai-ocr-architecture.md).

## Pruebas

Con el stack levantado:

```bash
cd e2e
npm install
npm run test:smoke
npm run test:ai
npx playwright test ocr_prefill.spec.js
```

Comandos disponibles:

| Comando | Estado |
|---------|--------|
| `npm run test:smoke` | Estable: login y dashboard. |
| `npm run test:ai` | Estable: admin IA, presets, prueba de proveedor y asistente. |
| `npx playwright test ocr_prefill.spec.js` | Estable: prellenado OCR y comparacion registrado vs detectado. |
| `npm run test:pn` | Recordatorio de QA manual pendiente. |
| `npm run test:pj` | Recordatorio de QA manual pendiente. |
| `npm run test:pn:raw` | E2E PN inestable para diagnostico puntual. |
| `npm run test:pj:raw` | E2E PJ inestable para diagnostico puntual. |

Nota: los flujos PN/PJ con carga documental multiple deben revisarse manualmente antes de volver a usarlos como gate automatico.

## Estructura

```text
backend/              API FastAPI, reglas, servicios, modelos y routers
frontend/             App React/Vite, paginas, componentes y shells
database/             Inicializacion de PostgreSQL
e2e/                  Pruebas Playwright
docs/                 Documentacion funcional, tecnica y operativa
uploads/              Documentos cargados localmente
docker-compose.yml    Stack local
.env.example          Plantilla de configuracion sin secretos
```

## Documentacion

Lee primero:

- [docs/manual-operativo.md](docs/manual-operativo.md): guia por rol para usar el sistema.
- [docs/actores-y-responsabilidades.md](docs/actores-y-responsabilidades.md): responsabilidades de Empleado, Oficial, Auditor, Admin y Sistema.
- [docs/flujo-cumplimiento.md](docs/flujo-cumplimiento.md): flujo general del expediente.
- [docs/bandeja-oficial.md](docs/bandeja-oficial.md): logica de colas del Oficial.
- [docs/notificaciones.md](docs/notificaciones.md): avisos operativos por rol.
- [docs/beneficiarios-finales.md](docs/beneficiarios-finales.md): regla de BF relevante y bloqueo de activacion PJ.
- [docs/observaciones.md](docs/observaciones.md): observaciones, bloqueos y cierre auditado.
- [docs/motor-documental.md](docs/motor-documental.md): validacion documental y ruta OCR.
- [docs/automatizaciones.md](docs/automatizaciones.md): automatizaciones actuales y futuras.
- [docs/auditoria.md](docs/auditoria.md): auditoria funcional y tecnica.
- [docs/ai-ocr-architecture.md](docs/ai-ocr-architecture.md): proveedores IA/OCR, fallback, guardrails y diagramas Mermaid.
- [docs/decision-riesgo-cualitativo.md](docs/decision-riesgo-cualitativo.md): ADR de matriz cualitativa.
- [docs/adr-005-motor-reglas-documental.md](docs/adr-005-motor-reglas-documental.md): ADR del motor documental.

## Notas operativas

- Para reiniciar datos: `docker-compose down -v && docker-compose up --build`.
- Los documentos se guardan en `uploads/` con nombre UUID y hash SHA-256.
- El admin gobierna usuarios, matriz, IA y screening; su navegacion principal no mezcla funciones operativas.
- El Oficial trabaja por excepciones: alto riesgo, observados, revision manual, BF y post-activacion.
- El Empleado prepara el expediente: datos, perfiles, documentos, BF y respuestas.
