# Motor documental

## Objetivo

Automatizar la revision inicial de documentos para que el Oficial de Cumplimiento revise excepciones y no cada archivo de cada cliente.

## Flujo actual

1. El empleado selecciona un expediente y ve la checklist documental.
2. La pantalla muestra documentos obligatorios, condicionales y opcionales segun el tipo de cliente.
3. El empleado escoge el requisito documental, sube un PDF/JPG/PNG y revisa la previsualizacion antes de confirmar.
4. El sistema calcula hash SHA-256 y guarda el archivo.
5. El motor documental ejecuta reglas.
6. Se crean registros en `documento_validaciones`.
7. El documento queda como `VALIDADO_AUTOMATICO`, `OBSERVADO` o `RECHAZADO`.
8. Se registra auditoria tecnica por cada regla y por el resultado global.
9. Si el expediente queda completo, el sistema intenta avanzar estado y evaluar activacion automatica.

## Catalogo documental y checklist

La UI usa un catalogo documental central en `frontend/src/utils/documentosCatalog.js`.

Cada requisito define:

- etiqueta visible
- descripcion operativa
- tipo de cliente aplicable
- obligatoriedad: `OBLIGATORIO`, `CONDICIONAL` u `OPCIONAL`
- si es repetible
- campos que puede ayudar a prellenar mediante OCR/IA

Documentos obligatorios actuales:

| Tipo cliente | Documentos obligatorios |
|--------------|-------------------------|
| Natural | `DOCUMENTO_IDENTIDAD`, `COMPROBANTE_INGRESOS`, `COMPROBANTE_RESIDENCIA` |
| Juridica | `AVISO_OPERACION`, `CERTIFICADO_EXISTENCIA`, `IDENTIFICACION_REPRESENTANTE`, `IDENTIFICACION_BENEFICIARIOS` |

La checklist documental muestra:

- cuantos obligatorios estan cubiertos
- que requisito falta
- que requisito esta pendiente, observado, rechazado o cubierto
- accion contextual: subir, ver o reemplazar
- si el requisito bloquea el expediente

## Repetibles y no repetibles

Los documentos repetibles permiten multiples evidencias bajo el mismo requisito. Ejemplos: soportes de ingresos, origen de fondos y evidencias adicionales.

Los no repetibles representan un requisito principal que no debe duplicarse cuando ya esta cubierto. Ejemplos:

- `DOCUMENTO_IDENTIDAD`
- `COMPROBANTE_RESIDENCIA`
- `AVISO_OPERACION`
- `CERTIFICADO_EXISTENCIA`
- `IDENTIFICACION_REPRESENTANTE`

Si un documento no repetible ya esta cubierto, el backend rechaza una carga directa duplicada con `409`. Esto evita que la UI sea la unica barrera.

## Reemplazo auditado

Cuando un documento no repetible cubierto debe cambiarse, se usa el endpoint:

```http
POST /clientes/documentos/{doc_id}/reemplazar
```

El reemplazo exige:

- archivo nuevo
- motivo obligatorio
- usuario con permiso de adjuntar documentos

Comportamiento:

1. El documento anterior pasa a estado `REEMPLAZADO`.
2. Se conserva el documento anterior como historial.
3. El nuevo documento se crea con el mismo tipo documental.
4. El nuevo documento entra al motor documental y OCR/IA.
5. Se registra auditoria `REEMPLAZAR_DOCUMENTO` con documento anterior, documento nuevo y motivo.

Este flujo cubre casos como archivo incorrecto, documento vencido o version actualizada sin perder trazabilidad.

## Extraccion IA/OCR asistida

La version actual agrega una capa `ai_gateway` configurable. En `mock` no requiere API keys; con `OCR_PROVIDER=local` intenta extraer texto con PyMuPDF/pdfplumber para PDF y Tesseract para imagenes.

Cada corrida registra `ai_model_runs`, `ai_extractions`, auditoria `AI_DOCUMENTO_EXTRAIDO` y embeddings demo. La IA genera campos detectados, comparaciones, confianza, evidencia y sugerencia; no cambia por si sola la decision regulatoria.

## Extraccion simulada historica

La extraccion simulada es una capa deterministica que imita lo que haria un OCR real:

- toma los datos ya registrados del cliente
- construye campos detectados como nombre, identificacion, pais, monto y tipo documental
- marca `simulado: true`
- permite probar comparaciones y auditoria sin depender todavia de un proveedor externo

Esto no pretende validar documentos reales en produccion. Sirve para demostrar el diseno: reglas, trazabilidad, estados, bandeja y activacion automatica.

## Reglas v1

- `FORMATO_PERMITIDO`: valida PDF/JPG/PNG.
- `TAMANO_MAXIMO`: valida limite de 10 MB.
- `HASH_DUPLICADO`: detecta archivo repetido en otro expediente.
- `TIPO_DOCUMENTAL_ESPERADO`: compara tipo declarado contra tipo detectado simulado.
- `DOCUMENTO_OBLIGATORIO`: registra si el documento soporta un requisito obligatorio u opcional.
- `COINCIDENCIA_IDENTIDAD_SIMULADA`: confirma que la extraccion simulada contiene identidad/RUC del expediente.

## Estados documentales

- `PENDIENTE_VERIFICACION`: cargado, sin decision.
- `VALIDADO_AUTOMATICO`: aprobado por reglas.
- `VERIFICADO_MANUAL`: aprobado por Oficial.
- `OBSERVADO`: requiere revision o correccion.
- `RECHAZADO`: no cumple una regla critica o fue rechazado manualmente.
- `REEMPLAZADO`: documento historico sustituido por un nuevo soporte mediante flujo auditado.

## Prellenado asistido en registro

El registro de persona natural y juridica tiene un analizador documental asistido.

Antes de ejecutar OCR/IA, el empleado debe:

- seleccionar que documento esta usando
- subir PDF/JPG/PNG
- revisar la previsualizacion
- ejecutar analisis

El sistema devuelve campos detectados y comparacion contra lo escrito. Nada se guarda automaticamente: el empleado aplica cada campo o todos los campos bajo confirmacion humana.

## Evolucion a OCR real

Para produccion, reemplazar o complementar el adaptador local por:

- OCR local para PDF/imagenes: Tesseract, OCRmyPDF, pdfplumber, PyMuPDF.
- OCR administrado: AWS Textract, Azure Document Intelligence, Google Document AI.
- Clasificacion documental: modelo ML o reglas sobre texto extraido.
- Extraccion estructurada: campos por tipo documental.
- Reglas conservan la decision final, aunque el OCR provea los datos.

La decision de cumplimiento debe seguir siendo explicable por reglas, no por una respuesta opaca de IA.
