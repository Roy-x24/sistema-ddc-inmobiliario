# Beneficiarios finales

## Objetivo

La validacion de beneficiarios finales evita que una persona juridica sea activada sin identificar y aprobar a las personas que tienen participacion o control relevante sobre la entidad.

## Estados de validacion

Cada beneficiario final puede estar en uno de estos estados:

- `PENDIENTE`: registrado por el empleado, pendiente de revision del Oficial.
- `APROBADO`: validado por el Oficial de Cumplimiento.
- `RECHAZADO`: rechazado por el Oficial, siempre con motivo obligatorio.

## Relevancia actual

En la version actual, el sistema marca automaticamente `es_relevante = true` cuando:

- `porcentaje_participacion >= 25`

Los beneficiarios relevantes son bloqueantes para activacion. Una persona juridica no debe activarse si existe al menos un BF relevante pendiente o rechazado.

## Regla de avance y activacion

Una persona juridica inicia en `PENDIENTE_BF`.

El sistema puede moverla a `PENDIENTE` solo cuando:

- existe al menos un BF relevante registrado
- todos los BF relevantes estan en estado `APROBADO`

Para activar una persona juridica, ademas de documentos, perfiles, riesgo y observaciones, debe cumplirse:

- todos los BF relevantes aprobados por el Oficial
- ningun BF relevante pendiente
- ningun BF relevante rechazado

## Limitacion conocida

El porcentaje no siempre captura control real. Un BF con menos de 25% puede ser relevante si ejerce control efectivo.

Para una version de produccion, el criterio recomendado es:

- participacion mayor o igual a 25%
- control indirecto
- representacion o poderes de firma
- condicion PEP
- control por acuerdos, estructuras fiduciarias o relacion familiar
- decision manual del Oficial con motivo auditado

## Auditoria esperada

Toda aprobacion o rechazo de BF debe dejar trazabilidad:

- usuario que valida
- fecha de validacion
- estado anterior y nuevo
- motivo de rechazo cuando aplique
- impacto en estado del expediente si cambia de `PENDIENTE_BF` a `PENDIENTE`

## Recomendacion de evolucion

Agregar un campo editable por el Oficial:

- `relevancia_manual`
- `motivo_relevancia`
- `marcado_relevante_por`
- `fecha_marcado_relevante`

Esto permitiria cubrir casos donde el porcentaje es bajo, pero el control real es alto.
