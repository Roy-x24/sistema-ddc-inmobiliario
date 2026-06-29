# Arquitectura IA/OCR

## Principio

La IA asiste, pero no decide cumplimiento. Las transiciones de estado, activacion, rechazo y riesgo siguen controladas por reglas deterministicas y usuarios autorizados.

## Modos

- `AI_MODE=mock`: demo segura sin API keys.
- `OCR_PROVIDER=local`: usa PyMuPDF/pdfplumber para PDF y Tesseract para imagenes.
- `LLM_PROVIDER=groq|google|local`: conecta resumenes y explicaciones estructuradas contra Groq, Google Gemini u Ollama.
- `EMBEDDINGS_PROVIDER=mock|google|local`: busqueda semantica y recuperacion de contexto; no participa en decisiones.

## Estado actual de implementacion

### Implementado

- `AI_MODE=mock`: genera corridas auditables sin API keys.
- `OCR_PROVIDER=mock`: usa modo demo/fallback, registra baja confianza cuando no hay OCR real.
- `OCR_PROVIDER=local`: intenta OCR real con PyMuPDF/pdfplumber/Tesseract si el contenedor fue reconstruido.
- `AI_MIN_CONFIDENCE`: controla si la extraccion requiere revision humana.
- `ai_model_runs`: guarda proveedor, modelo, version de prompt, hash, schema, confianza y errores.
- `ai_extractions`: guarda campos detectados, comparaciones, evidencia y sugerencia.
- `document_embeddings`: guarda embeddings demo en JSON para busqueda semantica basica.

### Conectado por configuracion

- Groq: resumenes JSON por chat completions y OCR/vision para imagenes.
- Google Gemini: resumenes JSON, OCR/vision multimodal y embeddings.
- Ollama: resumenes JSON y embeddings locales.

### Aun pendiente

- Google Document AI nativo con procesadores/document processors.
- `pgvector` para similitud vectorial real en PostgreSQL; hoy se persiste JSON y se calcula similitud en aplicacion.

En otras palabras: no esta hardcoded a un proveedor. El proveedor se cambia por `.env`/`docker-compose.yml`, y si falla, el sistema registra error y usa fallback seguro.

## Matriz operativa por funcion

| Funcion | Mock | Local | Groq | Google | Decision de negocio |
|---------|------|-------|------|--------|---------------------|
| OCR / lectura documental | Devuelve una extraccion demo auditable. | Lee PDF con PyMuPDF/pdfplumber y usa Tesseract para imagenes. | Lee imagenes mediante vision; no se recomienda como OCR principal para PDF. | Lee PDF/imagenes con Gemini multimodal. | OCR nunca aprueba por si solo; solo alimenta comparaciones y confianza. |
| Clasificacion documental | Clasifica por fallback demo. | Clasifica usando texto extraido y reglas. | Puede sugerir tipo documental desde imagen. | Puede sugerir tipo documental desde contenido multimodal. | La clase final debe validarse contra el tipo esperado del expediente. |
| Extraccion de campos | Genera campos de ejemplo para probar UI. | Extrae texto y busca campos por reglas/heuristicas. | Puede devolver JSON estructurado desde imagen. | Puede devolver JSON estructurado desde PDF/imagen. | Campos criticos distintos a lo registrado generan observacion o revision humana. |
| Comparacion registrado vs detectado | Compara contra payload demo. | Compara datos OCR contra cliente/documento. | Puede explicar discrepancias, si LLM esta activo. | Puede explicar discrepancias con contexto documental. | Las reglas deterministicas definen si hay bloqueo, observacion o revision. |
| Resumen de expediente | Resumen deterministico sin LLM. | Ollama genera resumen JSON local. | Groq genera resumen JSON rapido. | Gemini genera resumen JSON. | El resumen no cambia estados; solo ayuda a leer el caso. |
| Embeddings / busqueda semantica | Vector hash simple en JSON. | Ollama embeddings locales. | No se usa como proveedor de embeddings. | Gemini Embeddings. | Embeddings solo recuperan contexto; no activan, rechazan ni validan BF. |
| Auditoria IA | Guarda corrida demo con proveedor/modelo/confianza. | Guarda corridas locales y errores de OCR/Ollama. | Guarda modelo Groq, prompt/schema y errores. | Guarda modelo Google, prompt/schema y errores. | Toda accion asistida debe poder explicarse por eventos fuente. |

## Formas estandar de uso

| Modo | Variables minimas | Uso ideal | Buenas practicas |
|------|-------------------|-----------|------------------|
| Mock seguro | `AI_MODE=mock`, `OCR_PROVIDER=mock`, `LLM_PROVIDER=none`, `EMBEDDINGS_PROVIDER=mock` | Probar pantallas, estados, auditoria y demo sin dependencias externas. | Mantenerlo como default; no requiere API keys; no usarlo para validar precision documental. |
| OCR local | `AI_MODE=local`, `OCR_PROVIDER=local`, `LLM_PROVIDER=none`, `EMBEDDINGS_PROVIDER=mock` | Leer documentos reales basicos sin enviar datos fuera del entorno. | Reconstruir imagen Docker; usar documentos nítidos; enviar baja confianza a revision humana. |
| Local con Ollama | `AI_MODE=local`, `OCR_PROVIDER=local`, `LLM_PROVIDER=local`, `EMBEDDINGS_PROVIDER=local`, `OLLAMA_BASE_URL=http://host.docker.internal:11434`, `OLLAMA_LLM_MODEL=gemma3:4b`, `OLLAMA_EMBEDDING_MODEL=nomic-embed-text` | Demo offline con resumenes y busqueda semantica local. | Descargar ambos modelos antes; temperatura baja; aceptar menor precision que proveedores gestionados. |
| Groq LLM | `AI_MODE=groq`, `LLM_PROVIDER=groq`, `GROQ_API_KEY=...`, `GROQ_MODEL=...` | Resumenes JSON rapidos y explicaciones operativas. | Usar JSON estricto; mantener OCR local/Google para PDF; no enviar secretos innecesarios. |
| Groq vision | `OCR_PROVIDER=groq_vision`, `GROQ_VISION_MODEL=...`, `GROQ_API_KEY=...` | Imagenes JPG/PNG donde se quiere lectura visual rapida. | No usarlo como OCR documental principal de PDF; registrar confianza y evidencia. |
| Google completo | `AI_MODE=google`, `OCR_PROVIDER=google`, `LLM_PROVIDER=google`, `EMBEDDINGS_PROVIDER=google`, `GOOGLE_API_KEY=...` | Demo conectada mas completa: OCR/vision, resumenes y embeddings. | Usar un solo proveedor reduce complejidad; para produccion documental evaluar Document AI nativo. |

## Politica de fallback actual

Configuracion recomendada para demo con bajo costo:

```env
AI_MODE=groq
OCR_PROVIDER=local
LLM_PROVIDER=groq
EMBEDDINGS_PROVIDER=local
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_LLM_MODEL=gemma3:4b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

Flujo:

- LLM: Groq es proveedor principal.
- LLM fallback: si Groq falla, no tiene API key o devuelve error/rate limit, se intenta Ollama.
- LLM fallback final: si Ollama falla, se usa resumen deterministico local.
- Embeddings: Ollama es proveedor principal.
- Embeddings fallback: si Ollama falla, se usa vector hash local para mantener busqueda basica.
- OCR: `local` es el proveedor recomendado para PDF y documentos de demo sin costo.

Esto mantiene la UX operativa aunque un proveedor externo falle y evita que un error de IA bloquee la demo.

## Configuracion de modelos

| Archivo | Responsabilidad |
|---------|-----------------|
| `.env` | Configuracion local real: proveedor activo, API keys y modelos. |
| `.env.example` | Plantilla versionada sin secretos. |
| `docker-compose.yml` | Expone variables al contenedor backend y define defaults seguros. |
| `backend/app/core/config.py` | Defaults internos usados por Pydantic Settings. |
| `backend/app/services/ai_gateway.py` | Selecciona proveedor/modelo y ejecuta llamadas externas/locales. |

| Proveedor | Variable | Default | Uso |
|-----------|----------|---------|-----|
| Groq | `GROQ_MODEL` | `llama-3.3-70b-versatile` | LLM para resumenes JSON. |
| Groq | `GROQ_VISION_MODEL` | `meta-llama/llama-4-scout-17b-16e-instruct` | Vision/OCR para imagenes. |
| Google | `GOOGLE_MODEL` | `gemini-1.5-flash` | OCR/vision multimodal y resumenes JSON. |
| Google | `GOOGLE_EMBEDDING_MODEL` | `text-embedding-004` | Embeddings. |
| Ollama | `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` en Docker | URL del servidor Ollama. |
| Ollama | `OLLAMA_LLM_MODEL` | `gemma3:4b` | LLM local para resumenes JSON. |
| Ollama | `OLLAMA_EMBEDDING_MODEL` | `nomic-embed-text` | Embeddings locales. |

Ollama usa un solo `OLLAMA_BASE_URL` porque la URL apunta al servidor, no al modelo. El backend escoge el modelo por request. Para modo local completo:

```bash
ollama pull gemma3:4b
ollama pull nomic-embed-text
```

## Docker y proveedores IA

| Componente | En Docker | Motivo |
|------------|-----------|--------|
| Backend | Si | Reglas, auditoria, endpoints IA y llamadas a proveedores. |
| OCR local | Si | Tesseract, PyMuPDF y pdfplumber quedan reproducibles en la imagen backend. |
| PostgreSQL | Si | Base de datos reproducible para demo/desarrollo. |
| Frontend | Si | Entorno consistente de React/Vite. |
| Ollama | No recomendado | Es mejor correrlo en el host y conectarse desde Docker via `host.docker.internal`. |
| Groq/Google | No aplica | Son APIs externas; el backend solo necesita API keys. |

Docker no es requisito conceptual para IA externa, pero si reduce variabilidad del entorno para backend, OCR local y base de datos. Para Ollama, meterlo en el mismo Compose agrega peso y consumo de recursos; conviene dejarlo como servicio local separado.

## Buenas practicas de configuracion

- Mantener `mock` como default del repositorio para que cualquier desarrollador pueda levantar el sistema sin llaves.
- Usar `.env` local para llaves y nunca commitear API keys.
- Separar proveedor por funcion: OCR puede ser `local` y LLM `groq`; no todo tiene que vivir en el mismo proveedor.
- Usar temperatura baja y salida JSON cuando el LLM alimente pantallas operativas.
- Validar todo output IA contra schema antes de guardarlo.
- Guardar `provider`, `model`, `prompt_version`, `schema_version`, `input_hash`, `confidence` y errores.
- Si falla el proveedor, baja la confianza o rompe schema, el fallback correcto es revision humana, no aprobacion.
- No usar embeddings ni resumenes para decisiones regulatorias finales.

## Configuracion recomendada

### Demo estable sin OCR real

```env
AI_MODE=mock
OCR_PROVIDER=mock
LLM_PROVIDER=none
EMBEDDINGS_PROVIDER=mock
AI_STRICT_MODE=true
AI_MIN_CONFIDENCE=0.82
```

### Demo con OCR local

```env
AI_MODE=local
OCR_PROVIDER=local
LLM_PROVIDER=none
EMBEDDINGS_PROVIDER=mock
AI_STRICT_MODE=true
AI_MIN_CONFIDENCE=0.82
```

Requiere:

```bash
docker-compose up --build
```

### Groq

```env
AI_MODE=groq
OCR_PROVIDER=mock
LLM_PROVIDER=groq
EMBEDDINGS_PROVIDER=mock
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
```

Para vision sobre imagenes:

```env
OCR_PROVIDER=groq_vision
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```

Uso esperado: resumenes y explicaciones JSON rapidas; vision para JPG/PNG.

### Google Gemini

```env
AI_MODE=google
OCR_PROVIDER=google
LLM_PROVIDER=google
EMBEDDINGS_PROVIDER=google
GOOGLE_API_KEY=...
GOOGLE_MODEL=gemini-1.5-flash
GOOGLE_EMBEDDING_MODEL=text-embedding-004
```

Uso esperado: OCR/vision multimodal, resumenes y embeddings.

### Ollama/Gemma

```env
AI_MODE=local
OCR_PROVIDER=local
LLM_PROVIDER=local
EMBEDDINGS_PROVIDER=local
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_LLM_MODEL=gemma3:4b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

Uso esperado: demo offline con menor precision; siempre con validacion humana.

## Guardrails

Toda corrida queda en `ai_model_runs` con proveedor, modelo, version de prompt, hash de entrada, version de schema, confianza y errores.

Las extracciones documentales quedan en `ai_extractions` con:

- campos extraidos
- evidencia
- comparaciones contra el expediente
- sugerencia de decision
- bandera `requires_human_review`

Si la confianza es baja, falla OCR, hay discrepancia critica o el schema no valida, el sistema requiere revision humana.

## Embeddings

La demo guarda embeddings simples en JSON para busqueda semantica basica. En produccion se recomienda PostgreSQL + pgvector y un proveedor como Gemini Embeddings o un modelo local multilingual.

Los embeddings se usan para:

- buscar contexto en documentos
- recuperar observaciones/auditoria relacionada
- detectar similitud documental
- explicar bloqueos del expediente

No se usan para:

- activar clientes
- rechazar expedientes
- validar BF
- modificar riesgo

## Proveedores recomendados

- Demo sin internet: `mock` o `local`.
- Demo con API rapida: Groq para resumenes y explicaciones JSON.
- Produccion documental: Google Document AI para OCR robusto y Gemini Embeddings para busqueda semantica.
