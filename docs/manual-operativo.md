# Manual operativo de automatizacion

## Para el empleado

1. Registrar cliente.
2. Adjuntar documentos correctos.
3. Revisar si algun documento queda observado.
4. Corregir documentos u observaciones.

## Para el Oficial de Cumplimiento

1. Abrir Bandeja de cumplimiento.
2. Revisar primero Alto riesgo y Observados.
3. Revisar Revision oficial.
4. Validar beneficiarios finales relevantes antes de activar personas juridicas.
5. Usar Auditoria para entender reglas ejecutadas.
6. Activar o rechazar expedientes desde Activacion. El rechazo es una salida formal para expedientes pre-activacion en `PENDIENTE_BF`, `PENDIENTE`, `EN_REVISION` u `OBSERVADO`, siempre con motivo obligatorio.
7. Gestionar bloqueos, desbloqueos y reversión de activación desde Post-activacion.

## Regla operativa de BF relevante

Un expediente juridico no debe activarse con BF relevantes pendientes o rechazados. En esta version, `es_relevante` se calcula por porcentaje de participacion mayor o igual a 25%.

Si el Oficial detecta control efectivo con menos de 25%, debe tratarlo como excepcion operativa: dejar observacion, documentar el motivo y no activar hasta que el caso este resuelto.

## Para el auditor

1. Revisar Auditoria.
2. Filtrar por expediente.
3. Confirmar eventos con origen `sistema`.
4. Exportar CSV para evidencia.

## Para el administrador

1. Gestionar usuarios.
2. Mantener matriz de riesgo.
3. Revisar auditoria administrativa.
4. Coordinar cambios de reglas documentales.
