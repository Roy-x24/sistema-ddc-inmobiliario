# Motor documental

## Objetivo

Automatizar la revision inicial de documentos para que el Oficial de Cumplimiento revise excepciones y no cada archivo de cada cliente.

## Flujo actual

1. El empleado sube un PDF, JPG o PNG.
2. El sistema calcula hash SHA-256 y guarda el archivo.
3. El motor documental ejecuta reglas.
4. Se crean registros en `documento_validaciones`.
5. El documento queda como `VALIDADO_AUTOMATICO`, `OBSERVADO` o `RECHAZADO`.
6. Se registra auditoria tecnica por cada regla y por el resultado global.
7. Si el expediente queda completo, el sistema intenta avanzar estado y evaluar activacion automatica.

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

## Evolucion a OCR real

Para produccion, reemplazar o complementar el adaptador local por:

- OCR local para PDF/imagenes: Tesseract, OCRmyPDF, pdfplumber, PyMuPDF.
- OCR administrado: AWS Textract, Azure Document Intelligence, Google Document AI.
- Clasificacion documental: modelo ML o reglas sobre texto extraido.
- Extraccion estructurada: campos por tipo documental.
- Reglas conservan la decision final, aunque el OCR provea los datos.

La decision de cumplimiento debe seguir siendo explicable por reglas, no por una respuesta opaca de IA.
