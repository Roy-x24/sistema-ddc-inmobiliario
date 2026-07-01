# Actores y responsabilidades

## Empleado

Inicia y mantiene el expediente operativo. Registra clientes naturales o juridicos, adjunta documentos, registra perfiles financiero/transaccional, registra beneficiarios finales y responde observaciones.

No decide riesgo, no activa clientes y no valida documentos de cumplimiento. Su responsabilidad es entregar datos completos y corregir observaciones.

### IA permitida para el Empleado

El Empleado puede usar automatizaciones e IA solamente como apoyo de captura:

- OCR y prellenado asistido al cargar documentos.
- Comparacion entre datos registrados y datos detectados.
- Checklist operativo para saber que falta completar.
- Respuesta manual a observaciones abiertas.

No debe ver herramientas IA de criterio de cumplimiento, cierre de observaciones, screening PEP/sanciones, priorizacion de cola, riesgo, validacion de BF ni activacion/rechazo.

## Oficial de Cumplimiento

Trabaja por excepciones. Revisa beneficiarios finales, documentos observados, casos de riesgo estandar o alto, observaciones abiertas y decisiones que el sistema no puede cerrar automaticamente.

En personas juridicas, valida todos los beneficiarios finales relevantes antes de activar. El criterio automatico actual marca como relevante a quien tenga participacion mayor o igual a 25%; el Oficial debe documentar excepciones cuando exista control efectivo aunque la participacion sea menor.

En el modelo automatizado, el Oficial deja de revisar todos los documentos de todos los clientes y se concentra en:

- discrepancias documentales
- alto riesgo
- expedientes observados
- muestreo
- aprobaciones manuales
- bloqueos, rechazos y desbloqueos

## Auditor

Consulta trazabilidad. Revisa acciones humanas, eventos automaticos, reglas ejecutadas, resultados del motor y exportaciones CSV. No opera expedientes.

## Administrador

Gestiona usuarios, matriz de riesgo, auditoria administrativa y configuracion sensible. Puede acceder al flujo operativo para soporte, pero su rol principal es gobierno del sistema.

Responsabilidades administrativas separadas:

- `gestionar_usuarios`: crear usuarios, cambiar roles, activar/desactivar cuentas y mantener accesos.
- `gestionar_matriz`: mantener versiones, factores y publicacion de la matriz de riesgo.
- `gestionar_ia`: configurar modo IA/OCR, proveedores, modelos, umbrales y pruebas de conexion.
- `gestionar_screening`: mantener la lista local PEP/sanciones usada por el screening asistido.

La interfaz del administrador debe mantenerse enfocada en gobierno y configuracion. Las pantallas operativas pueden existir para soporte puntual, pero no deben mezclarse en la navegacion principal del admin.

## Sistema

Actor automatico formal. Ejecuta validaciones, calcula riesgo, cambia estados cuando se cumplen reglas, escala expedientes y registra auditoria tecnica.

Toda accion del sistema debe quedar auditada con origen `sistema`, version de regla y detalle suficiente para explicar la decision.

## Matriz de IA por rol

| Rol | IA visible | IA no visible |
|-----|------------|---------------|
| Empleado | OCR/prellenado, comparacion registrado vs detectado y checklist operativo. | Screening, prioridad, riesgo, cierre de observaciones, validacion BF, activacion y rechazo. |
| Oficial de Cumplimiento | Resumenes, busqueda de evidencia, observaciones sugeridas, BF sugeridos, screening, prioridad y soporte de activacion. | Ejecucion automatica de decisiones sensibles sin modal humano. |
| Auditor | Resumen auditable y busqueda de evidencia fuente. | Acciones operativas o cambios de estado. |
| Administrador | Configuracion de proveedores, modelos, umbrales, matriz y reglas. | Guardar secretos en base de datos o saltarse reglas deterministicas. |

Los iconos de informacion de la interfaz deben explicar estos limites cuando aparezcan conceptos como `Asistido`, `JSON estricto`, `Revision humana`, `Auditable`, checklist, bandejas o busqueda semantica.
