# Bandeja del Oficial de Cumplimiento

## Objetivo

La bandeja convierte una lista grande de clientes en colas accionables. Para proyectos de 500 casas o multiples proyectos, el Oficial no debe abrir cada expediente: debe atender excepciones.

## Colas

- `Listos auto`: bajo riesgo, expediente completo y sin excepciones.
- `Revision oficial`: riesgo estandar o decision manual pendiente.
- `Observados`: documentos observados, rechazados u observaciones abiertas.
- `Alto riesgo`: casos que nunca deben activarse automaticamente.
- `Pendientes`: faltan documentos, perfiles o datos.

## Datos por fila

- cliente
- identificacion
- tipo
- estado
- riesgo
- completitud documental
- documentos obligatorios verificados
- motivo principal
- accion sugerida

## Uso esperado

El Oficial empieza por `Alto riesgo` y `Observados`, luego revisa `Revision oficial`. Los casos `Listos auto` pueden ser evaluados por el sistema y solo se revisan por muestreo o auditoria.
