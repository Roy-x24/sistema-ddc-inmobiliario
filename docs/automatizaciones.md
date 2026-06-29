# Automatizaciones de cumplimiento

## Automatizaciones implementadas

### Validacion documental automatica

Se ejecuta al subir un documento. Aplica reglas de formato, tamano, duplicados, tipo y coincidencia simulada. Produce estado documental y registros de auditoria.

### Extraccion IA/OCR asistida

Se ejecuta al subir documentos y tambien puede forzarse desde la pantalla Documentos. Extrae campos, compara contra el expediente, guarda evidencia, confianza, sugerencia y auditoria tecnica. Si hay baja confianza o discrepancias criticas, requiere revision humana.

### Avance a revision

Cuando todos los documentos obligatorios son validos, el sistema puede mover el expediente de `PENDIENTE` a `EN_REVISION`.

### Activacion automatica

El sistema activa automaticamente solo si:

- expediente en `EN_REVISION`
- riesgo `BAJO`
- documentos obligatorios validados
- perfil financiero completo
- perfil transaccional completo
- sin observaciones abiertas
- si es persona juridica, todos los beneficiarios finales relevantes aprobados

## Beneficiarios finales relevantes

En la version actual, el sistema marca un beneficiario final como relevante cuando su porcentaje de participacion es mayor o igual a 25%.

La activacion de una persona juridica se bloquea si:

- no existe ningun BF relevante
- existe un BF relevante en estado `PENDIENTE`
- existe un BF relevante en estado `RECHAZADO`

El criterio recomendado para produccion debe considerar control efectivo, no solo porcentaje: control indirecto, representacion, poderes de firma, condicion PEP o decision manual del Oficial con motivo auditado.

### Escalamiento automatico

Si el expediente esta completo pero el riesgo no es bajo, se registra escalamiento al Oficial.

## Automatizaciones futuras

- proveedores externos OCR/LLM como Google Document AI, Groq, Gemini u Ollama local
- screening PEP/sanciones
- muestreo automatico
- SLA por cola
- priorizacion por monto, riesgo y antiguedad
- integracion con listas internas
