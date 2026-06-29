# Guia de ejecucion y pruebas

## Prerequisitos

- Docker Desktop.
- Git.
- pnpm instalado globalmente si se trabaja fuera de contenedores: `npm install -g pnpm`.
- Opcional para modo IA local: Ollama instalado en la maquina host.

## Configuracion inicial

Copiar la plantilla:

```bash
cp .env.example .env
```

El archivo `.env` es local y no debe commitearse. Ahi van API keys, proveedores activos y modelos.

## Levantar el proyecto

```bash
docker-compose up --build
```

Servicios principales:

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Swagger API | http://localhost:8000/docs |
| ReDoc API | http://localhost:8000/redoc |
| SonarQube | http://localhost:9000 |

## Usuarios base

| Usuario | Rol | Contrasena |
|---------|-----|------------|
| `empleado@ddc.com` | empleado | `empleado123` |
| `oficial@ddc.com` | oficial_cumplimiento | `oficial123` |
| `auditor@ddc.com` | auditor | `auditor123` |
| `admin@ddc.com` | admin | `admin123` |
| `demo_empleado@ddc.com` | empleado | `empleado123` |

## Seed demo

El seed extendido no corre por defecto para evitar sobrescribir datos locales.

Ejecutar con el stack:

```bash
RUN_DEMO_SEED=true docker-compose up --build
```

Ejecutar manualmente:

```bash
docker-compose exec backend python seed_demo.py
```

## Modo IA/OCR recomendado para demo

Sin llaves externas:

```env
AI_MODE=mock
OCR_PROVIDER=mock
LLM_PROVIDER=none
EMBEDDINGS_PROVIDER=mock
```

Con Groq + Ollama:

```env
AI_MODE=groq
OCR_PROVIDER=local
LLM_PROVIDER=groq
EMBEDDINGS_PROVIDER=local
GROQ_API_KEY=tu_api_key
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_LLM_MODEL=gemma3:4b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

Preparar Ollama:

```bash
ollama pull gemma3:4b
ollama pull nomic-embed-text
```

Mas detalle: `docs/ai-ocr-architecture.md`.

## Pruebas automaticas

Con el stack en ejecucion:

```bash
cd e2e
npm install
npm run test:smoke
npm run test:ai
npx playwright test ocr_prefill.spec.js
```

| Comando | Uso |
|---------|-----|
| `npm run test:smoke` | Login y carga del dashboard. |
| `npm run test:ai` | Admin IA, presets, prueba de proveedor y asistente. |
| `npx playwright test ocr_prefill.spec.js` | Prellenado OCR y comparacion de datos detectados. |
| `npm run test:pn` | Recordatorio de QA manual PN. |
| `npm run test:pj` | Recordatorio de QA manual PJ. |
| `npm run test:pn:raw` | E2E PN inestable para diagnostico. |
| `npm run test:pj:raw` | E2E PJ inestable para diagnostico. |

## QA manual pendiente

Antes de cerrar los flujos PN/PJ como automatizados otra vez, revisar manualmente:

1. Registro PN completo.
2. Registro PJ completo.
3. Redireccion al expediente luego de guardar.
4. Carga de documentos obligatorios.
5. OCR/IA sobre documentos cargados.
6. Beneficiarios finales relevantes en PJ.
7. Paso a revision del Oficial.

## Reinicio limpio

Para borrar datos locales y reconstruir:

```bash
docker-compose down -v
docker-compose up --build
```
