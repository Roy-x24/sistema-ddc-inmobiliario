    # Actores y responsabilidades

## Empleado

Inicia y mantiene el expediente operativo. Registra clientes naturales o juridicos, adjunta documentos, registra perfiles financiero/transaccional, registra beneficiarios finales y responde observaciones.

No decide riesgo, no activa clientes y no valida documentos de cumplimiento. Su responsabilidad es entregar datos completos y corregir observaciones.

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
