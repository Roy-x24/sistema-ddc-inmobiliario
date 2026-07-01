# Notificaciones operativas

## Objetivo

Las notificaciones ayudan a que Empleado, Oficial, Auditor y Administrador encuentren rapidamente los casos que requieren atencion.

La primera version no persiste bandeja de entrada ni estado leido/no leido. Calcula avisos vivos desde datos existentes:

- checklist del expediente
- observaciones abiertas o respondidas
- documentos faltantes, observados o rechazados
- beneficiarios finales pendientes
- colas de cumplimiento
- alertas PEP/sanciones
- auditoria reciente

## Modelo actual

Endpoint:

```http
GET /notificaciones/
```

Respuesta:

- `total`: cantidad total de avisos calculados
- `alta`: cantidad de avisos de prioridad alta
- `items`: lista accionable

Cada item incluye:

- `id`
- `titulo`
- `mensaje`
- `prioridad`: `ALTA`, `MEDIA` o `BAJA`
- `tipo`
- `destino`
- `entidad_id`

## Por rol

| Rol | Avisos principales |
|-----|--------------------|
| Empleado | observaciones por responder, documentos faltantes, expedientes incompletos |
| Oficial | alto riesgo, observados, BF pendientes, screening, colas de cumplimiento |
| Auditor | eventos auditables recientes |
| Administrador | avisos operativos del Oficial para soporte y gobierno |

## Criterio de UX

La pantalla `/notificaciones` debe ser una entrada rapida al flujo correcto. Cada aviso tiene boton `Abrir flujo`, no intenta resolver el caso desde la notificacion.

Esto mantiene la responsabilidad en las pantallas operativas:

- Documentos
- Observaciones
- Beneficiarios finales
- Cumplimiento
- Auditoria

## Evolucion recomendada

Cuando se necesite trazabilidad de inbox real, agregar tabla `notificaciones` con:

- usuario destinatario
- estado `NUEVA`, `LEIDA`, `ARCHIVADA`
- fecha de creacion
- fecha de lectura
- correlation_id
- entidad relacionada
- snapshot del mensaje al momento de creacion

Hasta entonces, las notificaciones derivadas evitan duplicar estado y reducen riesgo de inconsistencias.
