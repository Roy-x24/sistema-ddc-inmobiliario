# Observaciones

## Objetivo

Las observaciones son el mecanismo formal para pedir correcciones, aclaraciones o soportes adicionales sin perder trazabilidad del expediente.

Una observacion abierta significa que el expediente no esta listo para activarse. Puede venir de revision documental, revision de datos, beneficiarios finales, riesgo, screening o criterio manual del Oficial.

## Estados

Estados operativos recomendados:

- `ABIERTA`: el Oficial requiere respuesta o correccion.
- `RESPONDIDA`: el Empleado respondio y espera revision.
- `CERRADA`: el Oficial acepto la respuesta o resolvio el punto.

La activacion debe bloquearse mientras exista al menos una observacion abierta o respondida pendiente de cierre oficial.

## Flujo

1. El Oficial crea una observacion indicando motivo, area afectada y accion esperada.
2. El sistema marca el expediente como `OBSERVADO` si estaba `PENDIENTE` o `EN_REVISION`.
3. El Empleado ve la observacion en su bandeja y responde con texto o documentos.
4. El Oficial revisa la respuesta.
5. El Oficial cierra la observacion mediante modal con confirmacion `CERRAR`.
6. El sistema reevalua checklist, documentos, BF, riesgo y posibilidad de avance.

## UX esperada

La pantalla de Observaciones debe funcionar igual que las otras bandejas operativas:

- selector de expediente retractil
- filtros externos por abiertas, respondidas y cerradas
- busqueda por cliente, identificacion, motivo o area
- estado claro de la observacion
- accion primaria contextual
- acceso directo a documentos o checklist si la observacion bloquea algo

No debe quedar como pantalla vacia ni como lista generica. El usuario debe entender:

- que falta
- quien debe actuar
- que accion desbloquea el expediente
- que pasara despues de cerrar

## Relacion con checklist global

La checklist global marca Observaciones como:

| Caso | Resultado checklist |
|------|---------------------|
| Sin observaciones abiertas | `COMPLETO` |
| Observacion abierta | `BLOQUEADO` |
| Observacion respondida sin cierre oficial | `BLOQUEADO` |
| Todas cerradas | `COMPLETO` |

Esto debe consultarse en Documentos, Activacion, Cumplimiento, Beneficiarios Finales y Detalle de Expediente.

## IA/OCR

La IA puede asistir, pero no cerrar observaciones automaticamente.

Usos permitidos:

- resumir observaciones largas
- sugerir respuesta para el Empleado
- sugerir al Oficial si la respuesta parece suficiente
- detectar discrepancias entre documento cargado y observacion original
- crear borrador de una nueva observacion desde una discrepancia documental

Usos no permitidos:

- cerrar observaciones sin Oficial
- activar expedientes solamente por recomendacion IA
- eliminar una observacion sin auditoria

## Auditoria

Cada evento debe registrarse:

- creacion
- respuesta
- cierre
- reapertura, si se implementa
- usuario responsable
- fecha
- motivo
- documentos relacionados
- cambio de estado del expediente si aplica
