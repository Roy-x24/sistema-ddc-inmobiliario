# Documentacion del sistema

Esta carpeta contiene la documentacion funcional, operativa y tecnica del sistema DDC/KYC inmobiliario.

## 1. Arranque y pruebas

- `guia-ejecucion-y-pruebas.md`: prerequisitos, `.env`, Docker, usuarios, seed demo, pruebas automaticas y QA manual pendiente.

## 2. Operacion por rol

- `manual-operativo.md`: pasos diarios por Empleado, Oficial, Auditor y Administrador.
- `actores-y-responsabilidades.md`: limites, responsabilidades y matriz de IA por rol.
- `bandeja-oficial.md`: colas y prioridad de trabajo del Oficial de Cumplimiento.
- `notificaciones.md`: avisos operativos derivados por rol y ruta `/notificaciones`.

## 3. Cumplimiento y reglas

- `flujo-cumplimiento.md`: flujo general del expediente y diagrama Mermaid.
- `beneficiarios-finales.md`: estados, relevancia, bloqueo de activacion PJ y evolucion recomendada.
- `observaciones.md`: flujo de observaciones, bloqueos, cierre auditado y uso de IA asistida.
- `motor-documental.md`: validacion documental, estados, reglas y evolucion a OCR real.
- `automatizaciones.md`: automatizaciones implementadas y futuras.
- `decision-riesgo-cualitativo.md`: ADR de matriz de riesgo cualitativa.
- `adr-005-motor-reglas-documental.md`: ADR del motor documental.

## 4. IA/OCR y auditoria

- `ai-ocr-architecture.md`: arquitectura IA/OCR, proveedores, fallback, embeddings, guardrails, permisos por rol, iconos de informacion y diagramas Mermaid.
- `auditoria.md`: auditoria funcional, tecnica, eventos automaticos y exportacion.

## Lectura recomendada

1. `guia-ejecucion-y-pruebas.md`
2. `manual-operativo.md`
3. `actores-y-responsabilidades.md`
4. `flujo-cumplimiento.md`
5. `ai-ocr-architecture.md`
