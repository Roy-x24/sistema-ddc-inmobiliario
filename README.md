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
- **IA/OCR asistida:** capa configurable `mock/local/groq/google` para extracción documental, resúmenes auditables y búsqueda semántica sin tomar decisiones regulatorias finales.

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
| oficial@ddc.com | oficial_cumplimiento | oficial123 | Verificar documentos, validar BF, ver riesgo, activar/rechazar, gestionar post-activación, crear/cerrar observaciones, ver auditoría |
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

## Configuración IA/OCR

La IA/OCR no está hardcoded: se configura por variables de entorno en el servicio `backend`. En Docker Compose hoy queda así por defecto:

```env
AI_MODE=mock
OCR_PROVIDER=mock
LLM_PROVIDER=none
EMBEDDINGS_PROVIDER=mock
AI_STRICT_MODE=true
AI_MIN_CONFIDENCE=0.82
```

### Qué funciona actualmente

| Variable | Valores | Estado actual |
|----------|---------|---------------|
| `AI_MODE` | `mock`, `local`, `groq`, `google` | Proveedor general reportado en auditoría cuando OCR está en `mock`. |
| `OCR_PROVIDER` | `mock`, `local`, `groq_vision`, `google` | `local` usa PyMuPDF/pdfplumber/Tesseract. `groq_vision` usa Groq para imágenes. `google` usa Gemini multimodal. |
| `LLM_PROVIDER` | `none`, `local`, `groq`, `google` | Conecta resúmenes JSON a Ollama, Groq o Google. `none` usa resumen determinístico local. |
| `EMBEDDINGS_PROVIDER` | `mock`, `local`, `google` | `mock` guarda vector hash JSON. `local` usa Ollama embeddings. `google` usa Gemini embeddings. |
| `AI_MIN_CONFIDENCE` | decimal `0-1` | Umbral para mandar a revisión humana si la confianza IA/OCR es baja. |

### Dónde se configuran los modelos

| Archivo | Uso |
|---------|-----|
| `.env` | Configuración local real. Aquí van API keys y modelos que usarás en tu máquina. No se commitea. |
| `.env.example` | Plantilla versionada para el equipo, sin secretos. |
| `docker-compose.yml` | Inyecta variables del `.env` al contenedor `backend`. Define defaults seguros si falta alguna variable. |
| `backend/app/core/config.py` | Defaults internos de FastAPI/Pydantic si la variable no existe. |
| `backend/app/services/ai_gateway.py` | Usa esas variables para llamar Groq, Google u Ollama. |

Modelos actuales por proveedor:

| Proveedor | Variable | Default | Para qué se usa |
|-----------|----------|---------|-----------------|
| Groq | `GROQ_MODEL` | `llama-3.3-70b-versatile` | Resúmenes JSON y explicación operativa. |
| Groq | `GROQ_VISION_MODEL` | `meta-llama/llama-4-scout-17b-16e-instruct` | Visión/OCR sobre imágenes JPG/PNG. |
| Google | `GOOGLE_MODEL` | `gemini-1.5-flash` | OCR/visión multimodal y resúmenes JSON. |
| Google | `GOOGLE_EMBEDDING_MODEL` | `text-embedding-004` | Embeddings/búsqueda semántica. |
| Ollama | `OLLAMA_LLM_MODEL` | `gemma3:4b` | Resúmenes JSON locales. |
| Ollama | `OLLAMA_EMBEDDING_MODEL` | `nomic-embed-text` | Embeddings locales. |
| Ollama | `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` en Docker | URL del servidor Ollama. Es la misma aunque uses varios modelos. |

Ollama usa un solo servidor (`OLLAMA_BASE_URL`) y varios modelos por nombre. Antes de usar modo local completo:

```bash
ollama pull gemma3:4b
ollama pull nomic-embed-text
```

### Qué hay en Docker para IA/OCR

| Parte | Corre en Docker | Motivo |
|-------|-----------------|--------|
| Backend FastAPI | Sí | Centraliza API, reglas, auditoría y llamadas a proveedores. |
| OCR local con Tesseract/PyMuPDF/pdfplumber | Sí | Hace reproducible el OCR local sin instalar dependencias manuales en cada máquina. |
| Frontend React | Sí | Entorno uniforme para demo/desarrollo. |
| PostgreSQL | Sí | Base reproducible para demos y seed. |
| Ollama | No | Recomendado correrlo en tu máquina host. Docker se conecta con `http://host.docker.internal:11434`. |
| Groq/Google | No | Son APIs externas; Docker solo envía requests desde backend usando API keys. |

No es obligatorio usar Docker para IA externa, pero en este proyecto sí conviene usar Docker para backend/base/frontend porque reduce diferencias de entorno. Para Ollama, lo correcto en Mac es dejarlo fuera de Docker y apuntar al host.

### Matriz de funciones IA/OCR

| Función | Mock | Local | Groq | Google | Recomendación |
|---------|------|-------|------|--------|---------------|
| Extracción documental | Simula extracción auditable y permite probar UI/flujos sin archivos reales. | Extrae texto de PDF con PyMuPDF/pdfplumber y OCR de imágenes con Tesseract. | Usa visión para JPG/PNG; no es la mejor opción para PDF. | Usa Gemini multimodal para leer PDF/imágenes; ruta recomendada para demo con API. | Para demo seria: `OCR_PROVIDER=local` si no hay internet/API; `google` si se quiere mejor lectura documental. |
| Clasificación de documento | Determinística/demo según nombre, tipo y fallback. | Usa texto OCR local y reglas del sistema. | Puede apoyar clasificación desde imagen. | Puede apoyar clasificación multimodal. | La clasificación puede sugerirse con IA, pero la aceptación debe pasar por reglas y confianza mínima. |
| Comparación contra expediente | Usa datos mock y reglas. | Compara campos OCR contra nombre, cédula/RUC y datos registrados. | Útil para explicar diferencias si se usa LLM. | Útil para extraer y comparar campos con mejor contexto. | Las discrepancias críticas deben generar observación o revisión humana, no aprobación automática. |
| Resumen de expediente | Resumen determinístico local (`LLM_PROVIDER=none`). | Ollama genera JSON local si está activo. | Groq genera JSON rápido para demo conectada. | Gemini genera JSON y puede usar mejor contexto documental. | Para presentación: Groq si quieres velocidad; Google si también usarás OCR/embeddings del mismo proveedor. |
| Embeddings/búsqueda semántica | Vector hash JSON para demo básica. | Ollama embeddings locales. | No configurado como proveedor de embeddings en este proyecto. | Gemini Embeddings. | Para producción: PostgreSQL + `pgvector` + Google/local multilingual. Hoy se persiste JSON y se calcula similitud en app. |
| Auditoría IA | Registra corrida, proveedor, modelo, confianza, errores y hash. | Igual, marcando proveedor local/Ollama. | Igual, con modelo Groq. | Igual, con modelo Google. | Siempre guardar evidencia, versión de prompt/schema y nunca guardar API keys ni secretos. |

### Formas de uso recomendadas

| Caso | Variables | Cuándo usarlo | Buenas prácticas |
|------|-----------|---------------|------------------|
| Demo estable sin dependencias | `AI_MODE=mock`, `OCR_PROVIDER=mock`, `LLM_PROVIDER=none`, `EMBEDDINGS_PROVIDER=mock` | Presentación donde importa que todo funcione sin internet ni llaves. | Úsalo para validar UX, estados, auditoría y flujos. No lo vendas como precisión OCR real. |
| OCR local sin LLM | `AI_MODE=local`, `OCR_PROVIDER=local`, `LLM_PROVIDER=none`, `EMBEDDINGS_PROVIDER=mock` | Demo con extracción real básica y cero API keys. | Reconstruir contenedores; usar documentos limpios; mantener revisión humana por baja confianza. |
| Local completo con Ollama | `AI_MODE=local`, `OCR_PROVIDER=local`, `LLM_PROVIDER=local`, `EMBEDDINGS_PROVIDER=local`, `OLLAMA_BASE_URL=http://host.docker.internal:11434`, `OLLAMA_LLM_MODEL=gemma3:4b`, `OLLAMA_EMBEDDING_MODEL=nomic-embed-text` | Demo offline con resúmenes y embeddings locales. | Descargar ambos modelos antes; usar modelos pequeños para latencia; no confiar en campos críticos sin reglas. |
| Groq para resúmenes rápidos | `AI_MODE=groq`, `OCR_PROVIDER=mock` o `local`, `LLM_PROVIDER=groq`, `EMBEDDINGS_PROVIDER=mock`, `GROQ_API_KEY=...` | Demo conectada donde quieres respuestas JSON rápidas. | Mantener OCR local/Google para PDF; usar temperatura baja y JSON estricto. |
| Groq visión para imágenes | `OCR_PROVIDER=groq_vision`, `GROQ_VISION_MODEL=...`, `GROQ_API_KEY=...` | Documentos JPG/PNG puntuales. | No usarlo como OCR principal de PDF; mandar a revisión si no hay confianza suficiente. |
| Google completo | `AI_MODE=google`, `OCR_PROVIDER=google`, `LLM_PROVIDER=google`, `EMBEDDINGS_PROVIDER=google`, `GOOGLE_API_KEY=...` | Demo más completa con OCR/visión, resúmenes y embeddings del mismo proveedor. | Mejor opción de API única para demo avanzada; en producción evaluar Google Document AI nativo. |

### Modo recomendado actual: Groq + Ollama

Para ahorrar presupuesto y mantener la demo útil:

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

Comportamiento:

- Groq intenta primero los resúmenes/explicaciones JSON.
- Si Groq falla, no hay llave o se alcanza límite/rate limit, el backend intenta Ollama.
- Si Ollama también falla, usa fallback determinístico local y registra el error en auditoría técnica.
- Los embeddings intentan siempre Ollama primero.
- Si Ollama embeddings falla, usa vector hash local para no romper el flujo.

Antes de usar este modo:

```bash
ollama pull gemma3:4b
ollama pull nomic-embed-text
```

### Modo demo recomendado

Sin API keys, estable para presentación:

```env
AI_MODE=mock
OCR_PROVIDER=mock
LLM_PROVIDER=none
EMBEDDINGS_PROVIDER=mock
```

### Modo OCR local

Ejecuta OCR real dentro del contenedor backend. Requiere reconstruir porque instala Tesseract y librerías Python:

```env
AI_MODE=local
OCR_PROVIDER=local
LLM_PROVIDER=none
EMBEDDINGS_PROVIDER=mock
```

Luego:

```bash
docker-compose up --build
```

### Groq

Para resúmenes JSON por Groq:

```env
AI_MODE=groq
OCR_PROVIDER=mock
LLM_PROVIDER=groq
EMBEDDINGS_PROVIDER=mock
GROQ_API_KEY=tu_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

Para OCR/visión con imágenes por Groq:

```env
OCR_PROVIDER=groq_vision
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```

Nota: para PDF, usa `OCR_PROVIDER=local` o `google`; Groq visión queda pensado para JPG/PNG.

### Google Gemini

Para resúmenes, visión/OCR y embeddings:

```env
AI_MODE=google
OCR_PROVIDER=google
LLM_PROVIDER=google
EMBEDDINGS_PROVIDER=google
GOOGLE_API_KEY=tu_api_key
GOOGLE_MODEL=gemini-1.5-flash
GOOGLE_EMBEDDING_MODEL=text-embedding-004
```

### Ollama local

Levanta Ollama en tu máquina y descarga un modelo, por ejemplo:

```bash
ollama pull gemma3:4b
```

Configura:

```env
AI_MODE=local
OCR_PROVIDER=local
LLM_PROVIDER=local
EMBEDDINGS_PROVIDER=local
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_LLM_MODEL=gemma3:4b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

Si usas otro modelo generativo local de hasta 8B, cambia `OLLAMA_LLM_MODEL`. Para embeddings, usa un modelo específico de embeddings como `nomic-embed-text`; no conviene reutilizar el LLM generativo para vectores.

Regla crítica: IA/OCR sugiere y documenta; las reglas determinísticas y usuarios autorizados siguen decidiendo activación, rechazo, riesgo y validación final.

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
- **Post-activación separado:** Un cliente `ACTIVO` puede ser bloqueado, desbloqueado o devuelto a `EN_REVISION` por corrección operativa, siempre con trazabilidad.
- **Beneficiarios Finales con validación OC:** Las personas jurídicas inician en estado `PENDIENTE_BF` hasta que todos sus beneficiarios finales relevantes sean aprobados por el Oficial.
- **Sesión única y refresh automático:** El frontend renueva el token de acceso automáticamente vía interceptor Axios. Cierre por inactividad de 30 minutos.
- **Auditoría administrativa separada:** Registra login/logout, cambios en la matriz, gestión de usuarios y exportaciones CSV.
- **Exportación CSV:** Auditor y Admin pueden exportar historial de auditoría de expediente y administrativa.
- **Rediseño luxury coherente:** Todos los paneles operativos y de administración comparten un mismo sistema de diseño con cards, tablas, badges, banners y botones estilizados.
- **Fixes funcionales:** Búsqueda de clientes por nombre/documento/RUC, campos correctos en perfil transaccional, confirmación manual para riesgo ALTO, descarga de documentos y manejo de UUID/datetime en schemas.
- **IA/OCR auditable:** nuevas rutas `/ai/*`, extracción documental asistida, `ai_model_runs`, `ai_extractions`, embeddings demo y guardrails de confianza.
- **Dashboards operativos por rol:** el Empleado ve próximos pasos de captura; el Oficial ve prioridades, alto riesgo, observados, BF pendientes y auditoría IA reciente.

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
- `docs/ai-ocr-architecture.md`: arquitectura IA/OCR, proveedores, embeddings y guardrails.
