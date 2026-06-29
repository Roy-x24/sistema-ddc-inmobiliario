# Auditoria funcional y tecnica

## Principio

Toda decision relevante debe explicar quien la hizo, cuando, sobre que expediente, que cambio y por que.

El sistema separa dos niveles:

- Auditoria funcional: acciones humanas y cambios visibles del expediente.
- Auditoria tecnica: reglas automaticas, confianza, versiones y resultados.

## Campos nuevos

- `origen`: `humano` o `sistema`.
- `severidad`: `info`, `warning` o `error`.
- `detalle`: JSON con datos tecnicos de la decision.
- `correlation_id`: agrupa eventos de un mismo documento o evaluacion.
- `version_regla`: version del motor que ejecuto la decision.

## Eventos automaticos

- `AI_DOCUMENTO_EXTRAIDO`
- `AI_RESUMEN_EXPEDIENTE`
- `REGLA_DOCUMENTAL_EJECUTADA`
- `DOCUMENTO_VALIDADO_AUTOMATICO`
- `DOCUMENTO_OBSERVADO_AUTOMATICO`
- `EXPEDIENTE_COMPLETO_AUTOMATICO`
- `ACTIVACION_AUTOMATICA_EVALUADA`
- `ACTIVACION_AUTOMATICA_APROBADA`
- `ESCALAMIENTO_AUTOMATICO_OFICIAL`

## Orden recomendado de lectura

Para investigar un expediente:

1. Filtrar auditoria por cliente.
2. Revisar cambios de estado.
3. Revisar documentos observados o rechazados.
4. Revisar eventos con `origen = sistema`.
5. Agrupar por `correlation_id`.
6. Confirmar `version_regla`.

## Exportacion

El CSV de auditoria incluye metadatos automaticos para soportar revision interna o auditoria externa.
