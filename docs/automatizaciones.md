# Automatizaciones de cumplimiento

## Automatizaciones implementadas

### Validacion documental automatica

Se ejecuta al subir un documento. Aplica reglas de formato, tamano, duplicados, tipo y coincidencia simulada. Produce estado documental y registros de auditoria.

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
- si es persona juridica, beneficiario final aprobado

### Escalamiento automatico

Si el expediente esta completo pero el riesgo no es bajo, se registra escalamiento al Oficial.

## Automatizaciones futuras

- OCR real
- screening PEP/sanciones
- muestreo automatico
- SLA por cola
- priorizacion por monto, riesgo y antiguedad
- integracion con listas internas
