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

Validar coherencia del seed:

```bash
docker-compose exec backend python validate_seed_demo.py
```

El validador falla si encuentra casos demo incoherentes, por ejemplo:

- clientes activos con documentos obligatorios pendientes/rechazados
- clientes activos con observaciones abiertas
- personas juridicas activas con BF relevantes no aprobados
- expedientes `PENDIENTE_BF` sin BF relevante pendiente
- expedientes `EN_REVISION` con bloqueos basicos
- expedientes `OBSERVADO` sin excepcion visible

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
npm run audit:visual
npx playwright test ocr_prefill.spec.js
```

| Comando | Uso |
|---------|-----|
| `npm run test:smoke` | Login y carga del dashboard. |
| `npm run test:ai` | Admin IA, presets, prueba de proveedor y asistente. |
| `npm run audit:visual` | Captura pantallas clave en desktop y movil para empleado, oficial y admin. |
| `npx playwright test ocr_prefill.spec.js` | Prellenado OCR y comparacion de datos detectados. |
| `npm run test:pn` | Recordatorio de QA manual PN. |
| `npm run test:pj` | Recordatorio de QA manual PJ. |
| `npm run test:pn:raw` | E2E PN inestable para diagnostico. |
| `npm run test:pj:raw` | E2E PJ inestable para diagnostico. |

La auditoria visual guarda capturas en `e2e/artifacts/visual-audit/`. Ese directorio esta ignorado por Git porque son evidencias locales de revision, no codigo fuente.

## QA manual pendiente

Antes de cerrar los flujos PN/PJ como automatizados otra vez, revisar manualmente:

1. Registro PN completo.
2. Registro PJ completo.
3. Redireccion al expediente luego de guardar.
4. Carga de documentos obligatorios.
5. OCR/IA sobre documentos cargados.
6. Beneficiarios finales relevantes en PJ.
7. Paso a revision del Oficial.

## QA manual de separacion por rol

Ejecutar despues de levantar el stack y cargar el seed demo:

1. Iniciar sesion como `empleado@ddc.com`.
2. Abrir Observaciones y seleccionar un expediente.
3. Confirmar que no aparece panel IA de cierre, screening, prioridad, riesgo ni validacion BF.
4. Confirmar que el Empleado puede responder observaciones abiertas, pero no cerrarlas.
5. Abrir Beneficiarios Finales y confirmar que puede registrar BF, pero no validar/rechazar BF ni ejecutar screening.
6. Abrir Detalle de Expediente y confirmar que no aparece boton `Resumen IA` ni panel IA conversacional para el Empleado.
7. Iniciar sesion como `oficial@ddc.com`.
8. Abrir Observaciones y confirmar que el Oficial si ve el asistente IA de observaciones, puede cerrar respuestas y no ve acciones de respuesta del Empleado.
9. Abrir Beneficiarios Finales y confirmar que el Oficial puede validar/rechazar BF y usar IA asistida.
10. Revisar checklist en Observaciones, Cumplimiento y Activacion: los botones deben cambiar segun rol o mostrar `Lo completa Empleado`, `Lo revisa Oficial`, `Solo lectura` o `Control completo`.
11. Iniciar sesion como `auditor@ddc.com` y confirmar que solo puede consultar/resumir evidencia sin operar expedientes.

## QA manual de UI e informacion contextual

1. En Observaciones, validar que las tarjetas del checklist no se solapan en desktop ni movil.
2. Confirmar que el panel compacto usa una o dos columnas como maximo y que los botones no se cortan.
3. Revisar los iconos de informacion en filtros, IA, checklist y busqueda semantica.
4. Confirmar que cada icono explica el significado operativo y no solo repite el nombre del campo.
5. Verificar que las pantallas sin resultados muestren empty state con accion o explicacion clara.

## QA manual de modales, auditoria y paginacion

1. Como Empleado, abrir el modal de respuesta de Observaciones y confirmar que aparece centrado, con scroll interno y sin necesidad de subir la pagina.
2. Como Oficial, abrir modales de aprobar/rechazar documento y cerrar observacion. Deben mantener header/footer visibles y contenido scrolleable.
3. En Documentos, abrir vista previa de imagen/PDF y navegar con anterior/siguiente. El header, cerrar y descargar deben seguir accesibles.
4. Como Auditor, iniciar sesion y confirmar redireccion a `/auditor/dashboard`.
5. Confirmar que el Auditor no puede abrir `/cumplimiento` y que su sidebar muestra Dashboard, Notificaciones y Auditoria.
6. En Auditoria, probar paginacion de auditoria funcional y auditoria tecnica IA por separado.
7. En Notificaciones, Admin Auditoria, Admin Screening y Admin Usuarios, probar busqueda/filtros y paginacion.
8. En Admin Screening, validar contraste del hero y legibilidad de `Listas locales`.

## Reinicio limpio

Para borrar datos locales y reconstruir:

```bash
docker-compose down -v
docker-compose up --build
```
