# ADR-005: Motor de reglas documental con extraccion simulada

## Estado

Aceptado para la siguiente etapa post-MVP.

## Contexto

El sistema necesita reducir la carga del Oficial de Cumplimiento en escenarios de alto volumen, como proyectos inmobiliarios de cientos de viviendas. La validacion manual de varios documentos por cliente no escala.

## Decision

Implementar primero un motor de reglas auditable con extraccion simulada. La extraccion simulada permite demostrar el flujo completo sin depender todavia de OCR real o APIs externas.

## Consecuencias positivas

- Implementacion rapida.
- Decisiones explicables.
- Auditoria granular.
- Base preparada para OCR real.
- Menos riesgo tecnico en la entrega academica.

## Consecuencias negativas

- No valida contenido real del archivo.
- No detecta fraude visual.
- Requiere reemplazar el adaptador de extraccion para produccion.

## Ruta futura

Sustituir el adaptador simulado por OCR local o servicio externo, manteniendo el motor de reglas como capa de decision.
