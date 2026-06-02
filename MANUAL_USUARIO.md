# Manual de Usuario — Sistema DDC/KYC Inmobiliario

> Versión 3.0 — Junio 2026
> Universidad Tecnológica de Panamá (UTP) — Ingeniería de Software

---

## 1. ¿Qué es este sistema?

El **Sistema de Debida Diligencia de Clientes (DDC/KYC)** es una herramienta web interna diseñada para promotoras inmobiliarias, agentes de bienes raíces y empresas constructoras de la República de Panamá que están obligadas por la **Ley 23 de 27 de abril de 2015** a conocer, verificar y evaluar el riesgo de sus compradores e inversionistas antes de formalizar cualquier compraventa de bien inmueble.

El sistema digitaliza y automatiza el proceso KYC, eliminando errores humanos del registro manual, garantizando trazabilidad completa ante auditorías de la **Superintendencia de Sujetos No Financieros (SSNF)** y reduciendo el riesgo de sanciones por incumplimiento regulatorio.

---

## 2. Requisitos para usar el sistema

- **Docker Desktop** instalado y en ejecución
- Navegador web moderno (Chrome, Edge, Firefox)
- Conexión a la red local donde corre el contenedor

### URLs de acceso

| Servicio | URL |
|----------|-----|
| Aplicación web (frontend) | http://localhost:5173 |
| Documentación de la API | http://localhost:8000/docs |

---

## 3. Usuarios y credenciales precargados

El sistema viene configurado con 5 usuarios de prueba creados automáticamente al levantar la base de datos por primera vez:

| Correo | Rol | Contraseña | ¿Qué puede hacer? |
|--------|-----|------------|-------------------|
| `empleado@ddc.com` | Empleado | `empleado123` | Registrar clientes, adjuntar documentos, registrar perfiles, responder observaciones, registrar BF |
| `oficial@ddc.com` | Oficial de Cumplimiento | `oficial123` | Verificar documentos, validar BF, ver riesgo, activar/rechazar/bloquear clientes, crear/cerrar observaciones, ver auditoría |
| `auditor@ddc.com` | Auditor | `auditor123` | Ver riesgo, ver auditoría, consultar clientes, exportar CSV de auditoría expediente |
| `admin@ddc.com` | Administrador | `admin123` | Gestiona matriz de riesgo, exportar CSV auditoría administrativa |
| `demo_empleado@ddc.com` | Empleado | `empleado123` | Usuario adicional para demos y pruebas E2E |

> **Seguridad:** Las contraseñas se almacenan con hash bcrypt. Nunca se guardan en texto plano. El token de acceso expira en 15 minutos; el sistema lo renueva automáticamente. Si no hay actividad durante 30 minutos, la sesión se cierra.

---

## 4. Flujo de trabajo del expediente (resumen visual)

```
PENDIENTE_BF  (solo PJ — esperando BF aprobado por OC)
    ↓
PENDIENTE     (estado inicial PN / PJ con BF aprobado)
    │  ← Empleado registra cliente
    │  ← Empleado adjunta documentos (CU-04)
    │  ← Oficial verifica documentos (CU-08)
    │  ← Empleado registra perfiles (CU-05, CU-06)
    │  ← Sistema calcula riesgo automático (CU-15)
    ▼
EN_REVISION  (automático cuando todos los docs obligatorios están VERIFICADOS)
    │
    ├──► OBSERVADO  ← OC crea observación (CU-OBS)
    │       ↓ (empleado responde y OC cierra)
    └──► EN_REVISION
            │
            ▼
        ACTIVO  ← Oficial activa al cliente (CU-11)
            │
            └──► BLOQUEADO  ← Oficial bloquea con motivo
                    │
                    └──► ACTIVO  ← Oficial desbloquea

    └──► RECHAZADO  ← Oficial rechaza con motivo (desde cualquier estado excepto final)
```

**Regla crítica:** Un cliente **NO puede saltarse estados**. No se activa desde `PENDIENTE`. Debe pasar obligatoriamente por `EN_REVISION`. Las observaciones abiertas bloquean la activación.

---

## 5. Guía por rol de usuario

### 5.1 Empleado

El empleado es quien inicia el expediente. Su trabajo es registrar la información del cliente y adjuntar la documentación física escaneada.

#### 5.1.1 Iniciar sesión
1. Ve a http://localhost:5173
2. Ingresa tu correo (`empleado@ddc.com`) y contraseña (`empleado123`)
3. El sistema te lleva al **Dashboard**

#### 5.1.2 Registrar un cliente nuevo
1. Ve al menú **Clientes**
2. Haz clic en **+ Nuevo cliente**
3. Selecciona el tipo de cliente:
   - **Persona natural:** Comprador individual
   - **Persona jurídica:** Empresa, sociedad, fideicomiso, fundación

**Persona natural — Paso 1 (Datos personales):**
- Nombres, apellidos, tipo y número de documento (cédula o pasaporte)
- Fecha de nacimiento (debe ser mayor de 18 años)
- Nacionalidad, país de residencia, dirección completa
- Teléfono, correo electrónico, ocupación
- Indicar si es **PEP** (Persona Expuesta Políticamente)

**Persona natural — Paso 2 (Perfil y transacción):**
- Fuente de ingresos, rango de ingresos mensuales
- Origen de los fondos, propósito de la transacción
- Monto estimado de la compra en USD

**Persona jurídica — Paso 1 (Datos de la empresa):**
- Razón social, RUC, tipo de persona jurídica (SA, SRL, fideicomiso, fundación, etc.)
- País de constitución, actividad económica principal
- Domicilio legal, teléfono, correo oficial
- Propósito de la adquisición del inmueble

**Persona jurídica — Paso 2 (Representantes, beneficiarios y transacción):**
- Datos del representante legal: nombre, identificación, cargo, poderes otorgados
- Datos de los beneficiarios finales (UBO): nombre, documento, nacionalidad, porcentaje de participación, tipo de control, ¿es PEP?
- Perfil financiero y transaccional (igual que persona natural)

> **Validaciones del registro:**
> - El número de documento/cédula y el RUC deben ser únicos en el sistema
> - El monto estimado debe ser mayor a $0
> - Al guardar, la PN queda en estado **PENDIENTE**
> - La PJ queda en estado **PENDIENTE_BF** (no puede avanzar hasta que un Oficial apruebe al menos un BF)

#### 5.1.3 Registrar Beneficiarios Finales (solo PJ)
1. Ve al expediente de un cliente jurídico
2. Haz clic en la pestaña **Beneficiarios Finales**
3. Completa los datos de cada UBO:
   - Nombre completo, número de documento, nacionalidad
   - Porcentaje de participación (el sistema marca como relevante si es ≥ 25%)
   - Tipo de control: directo, indirecto o representación
   - Indicar si es PEP
4. El Oficial de Cumplimiento deberá aprobar al menos uno para que el expediente avance

#### 5.1.4 Adjuntar documentos
1. Ve al expediente del cliente → pestaña **Documentos**
2. Selecciona el **tipo de documento**
3. Elige el archivo desde tu computadora (PDF, JPG o PNG, máximo 10 MB)
4. Haz clic en **Subir documento**

**Documentos obligatorios — Persona Natural:**
| Documento | ¿Obligatorio? |
|-----------|---------------|
| Documento de identidad | Sí |
| Comprobante de ingresos | Sí |
| Comprobante de residencia | Sí |
| Carta de referencia bancaria | Opcional |
| Declaración de origen de fondos | Opcional (si monto supera umbral) |

**Documentos obligatorios — Persona Jurídica:**
| Documento | ¿Obligatorio? |
|-----------|---------------|
| Aviso de operación | Sí |
| Certificado de existencia y representación legal | Sí |
| Identificación del representante legal | Sí |
| Identificación de beneficiarios finales | Sí |
| Estructura corporativa / organigrama | Opcional |
| Estados financieros | Opcional |
| Poder notarial | Opcional |

> **Importante:** Los documentos subidos quedan en estado **PENDIENTE_VERIFICACION**. Solo el Oficial de Cumplimiento puede aprobarlos o rechazarlos. El sistema calcula **hash SHA-256** para garantizar integridad.

#### 5.1.5 Registrar perfiles
1. Ve al expediente del cliente → pestaña **Perfiles**
2. Completa el **Perfil financiero:**
   - Fuente de ingresos
   - Rango de ingresos mensuales
   - Origen de los fondos para la compra
   - Patrimonio declarado aproximado (opcional)
3. Completa el **Perfil transaccional:**
   - Monto total de la propiedad (USD)
   - Método de pago predominante: transferencia, cheque de gerencia, financiamiento, mixto
   - Tipo de operación: residencia propia, inversión, alquiler, otro
   - Banco de origen de fondos (opcional)
   - Financiamiento bancario: banco y monto del préstamo (si aplica)
4. Haz clic en **Guardar** en cada perfil

> **Regla automática:** Cuando existen **ambos perfiles** (financiero y transaccional), el sistema dispara automáticamente el cálculo de riesgo (CU-15).

#### 5.1.6 Responder observaciones
1. Si el Oficial creó una observación sobre el expediente, verás una alerta
2. Ve a la pestaña **Observaciones**
3. Ingresa tu respuesta en el campo correspondiente
4. Haz clic en **Responder**
5. El Oficial deberá cerrar la observación para que el expediente pueda activarse

---

### 5.2 Oficial de Cumplimiento

El Oficial es quien valida la documentación, los beneficiarios finales, las observaciones y toma la decisión final de activar, bloquear o rechazar al cliente.

#### 5.2.1 Validar Beneficiarios Finales
1. Inicia sesión como `oficial@ddc.com`
2. Ve al expediente de un cliente jurídico → pestaña **Beneficiarios Finales**
3. Revisa cada BF en la tabla
4. Para cada BF pendiente, tienes dos opciones:
   - **Aprobar:** El BF pasa a estado **APROBADO**; si es el primero, el expediente pasa de `PENDIENTE_BF` a `PENDIENTE`
   - **Rechazar:** Debes ingresar un **motivo obligatorio**. El BF queda en estado **RECHAZADO**

#### 5.2.2 Verificar documentos
1. Ve al expediente del cliente → pestaña **Documentos**
2. Revisa cada documento en la tabla
3. Puedes **descargar** el archivo (la acción queda auditada)
4. Para cada documento, tienes dos opciones:
   - **Aprobar:** El documento pasa a estado **VERIFICADO**
   - **Rechazar:** Debes ingresar un **motivo obligatorio** de texto. El documento queda en estado **RECHAZADO**

> **Efecto automático:** Cuando **todos los documentos obligatorios** de un cliente están en estado VERIFICADO, el sistema cambia automáticamente el estado del expediente de **PENDIENTE → EN_REVISION**.

#### 5.2.3 Crear observaciones
1. Ve al expediente del cliente → pestaña **Observaciones**
2. Escribe la descripción de la observación
3. Haz clic en **Crear observación**
4. El expediente pasa a estado **OBSERVADO** y no puede activarse hasta que:
   - El Empleado responda
   - Tú cierres la observación

#### 5.2.4 Revisar clasificación de riesgo
1. Ve al expediente del cliente → pestaña **Riesgo**
2. Visualiza:
   - Nivel de riesgo: **BAJO**, **ESTÁNDAR** o **ALTO**
   - Puntaje bruto y puntaje final
   - Justificación automática del sistema
   - Factores que aplicaron en la evaluación (positivos, mitigantes, bloqueantes)
   - Versión de la matriz de riesgo usada
   - Fecha del cálculo
3. Si es necesario, haz clic en **Forzar recálculo** para actualizar la clasificación

**Factores que generan riesgo ALTO:**
- El cliente es PEP
- País de residencia/constitución en lista de riesgo
- Monto de transacción > $500,000 USD
- Origen de fondos en efectivo o no verificable
- Persona jurídica extranjera con estructura compleja (fideicomiso o fundación)

**Factores que generan riesgo ESTÁNDAR:**
- Monto entre $100,000 y $500,000
- Persona jurídica nacional con documentación completa

**Riesgo BAJO:**
- Cliente nacional, ingresos verificables, monto < $100,000, sin factores de riesgo

> **Regla crítica:** Si el riesgo es **ALTO**, el cliente **NO puede activarse automáticamente**. Debes confirmar manualmente que aceptas el riesgo antes de activar.

#### 5.2.5 Activar, bloquear o rechazar un cliente
1. Ve al expediente del cliente → pestaña **Activación**
2. Revisa que el cliente cumpla todas las precondiciones:
   - Estado del expediente: **EN_REVISION**
   - Todos los documentos obligatorios verificados
   - Perfil financiero completo
   - Perfil transaccional completo
   - Riesgo calculado
   - Sin observaciones abiertas
   - Si es PJ: al menos un BF aprobado
3. Si todo está completo:
   - Haz clic en **Activar** → Cliente pasa a **ACTIVO**
   - Si el riesgo es ALTO, se mostrará una confirmación adicional
   - O haz clic en **Rechazar** → Ingresa un **motivo obligatorio** → Cliente pasa a **RECHAZADO**

#### 5.2.6 Bloquear y desbloquear clientes activos
1. Ve al expediente de un cliente **ACTIVO**
2. Haz clic en **Bloquear**
3. Ingresa un **motivo obligatorio**
4. El cliente pasa a estado **BLOQUEADO**
5. Para desbloquear, haz clic en **Desbloquear** (no requiere motivo)

> **Nota:** Si intentas activar un cliente que aún no cumple los requisitos, el sistema mostrará un panel de errores detallado indicando exactamente qué falta.

---

### 5.3 Auditor

El Auditor tiene acceso de solo lectura a los registros de trazabilidad y puede exportar CSV.

#### 5.3.1 Consultar auditoría de expedientes
1. Inicia sesión como `auditor@ddc.com`
2. Ve al menú **Auditoría**
3. Visualiza el historial cronológico de **todas las acciones** del sistema
4. Puedes filtrar por expediente específico usando el ID del cliente

#### 5.3.2 Exportar CSV de auditoría de expediente
1. En la pantalla de **Auditoría**, haz clic en **Exportar CSV**
2. Se descargará un archivo CSV con hasta 5,000 registros
3. La exportación queda registrada automáticamente en la auditoría administrativa

---

### 5.4 Administrador

El Administrador gestiona la matriz de riesgo y la auditoría administrativa.

#### 5.4.1 Gestionar la matriz de riesgo
1. Inicia sesión como `admin@ddc.com`
2. El sistema te redirige directamente al **AdminShell** → sección **Matriz de Riesgo**
3. Visualiza la **versión activa** de la matriz con sus factores:
   - Nombre del factor, descripción, peso numérico, tipo (positivo/mitigante/bloqueante)
   - Estado activo/inactivo
4. Para editar un factor:
   - Cambia el valor del **peso** en el campo numérico
   - Presiona Enter o haz clic fuera para guardar
5. Para activar/desactivar un factor:
   - Usa el interruptor de la columna **Activo**
6. Para publicar una nueva versión:
   - Haz clic en **Publicar nueva versión**
   - El sistema archiva la versión anterior y activa la nueva
   - Todos los expedientes en `EN_REVISION` o `ACTIVO` se marcan con `requiere_reevaluacion = true`

> **Regla crítica:** El administrador **NO** crea usuarios desde la interfaz en esta versión. Los usuarios se generan vía `init.sql` o `seed_demo.py`.

#### 5.4.2 Ver auditoría administrativa
1. Desde el **AdminShell**, accede a **Auditoría Administrativa**
2. Visualiza:
   - Logins exitosos y fallidos
   - Cierres de sesión
   - Publicaciones de matriz
   - Ediciones de factores
   - Exportaciones CSV
3. Puedes exportar CSV de auditoría administrativa

---

## 6. Pantalla por pantalla

### 6.1 Login
Pantalla de inicio de sesión con fondo oscuro. Ingresa correo y contraseña. El sistema maneja tokens de forma transparente.

### 6.2 Sesión Expirada
Si el refresh token expira o hay 30 minutos de inactividad, el sistema te redirige aquí. Debes iniciar sesión nuevamente.

### 6.3 No Autorizado
Aparece si intentas acceder a una ruta que no corresponde a tu rol.

### 6.4 Dashboard
Pantalla de inicio después de iniciar sesión. Muestra:
- **Tarjetas de resumen:** Total de clientes, pendientes, en revisión, observados, activos, bloqueados y rechazados
- **Feed de acciones recientes:** Últimas acciones registradas en auditoría

### 6.5 Clientes (Listado)
Tabla paginada de todos los expedientes con:
- Búsqueda por nombre o identificación
- Filtro por tipo (Natural / Jurídica)
- Filtro por estado (PENDIENTE, PENDIENTE_BF, EN_REVISION, OBSERVADO, ACTIVO, BLOQUEADO, RECHAZADO)
- Botón **Ver expediente** para acceder al detalle completo

### 6.6 Expediente (Detalle)
Vista completa de toda la información del cliente en pestañas:
- **General:** Datos identificatorios, estado, riesgo, PEP, fechas
- **Documentos:** Lista con estado, hash, verificador
- **Perfiles:** Financiero y transaccional lado a lado
- **Beneficiarios Finales:** Solo PJ. Tabla con validación OC
- **Riesgo:** Clasificación calculada con factores aplicados
- **Observaciones:** Historial de observaciones con estado
- **Activación:** Panel de acciones para Oficial

### 6.7 Nuevo Cliente (Registro)
Formulario en dos pasos (stepper):
- **Paso 1:** Datos identificatorios
- **Paso 2:** Perfil financiero/transaccional

### 6.8 Documentos
Panel de gestión documental por expediente:
- Selector de tipo de documento
- Campo para subir archivo (drag & drop)
- Tabla de documentos subidos con estado, hash SHA-256, tamaño
- Botones **Aprobar** / **Rechazar** / **Descargar** (solo visible para Oficial)

### 6.9 Perfiles
Dos paneles lado a lado:
- **Perfil financiero:** Fuente de ingresos, rango, origen de fondos, patrimonio
- **Perfil transaccional:** Monto total, método de pago, tipo operación, banco origen, financiamiento

### 6.10 Riesgo
Visualización de la clasificación de riesgo calculada automáticamente. Muestra:
- Nivel (BAJO / ESTÁNDAR / ALTO) con indicador visual
- Puntaje bruto y final
- Justificación descriptiva
- Factores aplicados con desglose de pesos
- Versión de matriz usada
- Botón para forzar recálculo

### 6.11 Activación
Panel de acciones para el Oficial:
- **Activar:** Si todos los requisitos están completos (incluyendo confirmación ALTO)
- **Rechazar:** Siempre requiere motivo obligatorio
- **Bloquear:** Desde ACTIVO, requiere motivo
- **Desbloquear:** Desde BLOQUEADO

Si faltan requisitos, aparece un panel rojo listando exactamente qué falta.

### 6.12 Observaciones
Tabla de observaciones del expediente:
- **Empleado:** Puede responder observaciones abiertas
- **Oficial:** Puede crear observaciones (bloquea activación) y cerrarlas cuando hayan sido respondidas

### 6.13 Auditoría
Tabla cronológica de todas las acciones del sistema. Soporta filtrado por ID de cliente. Botón de **Exportar CSV** (Auditor y Admin).

### 6.14 Administración (Matriz de Riesgo)
Panel exclusivo para el rol Admin:
- Versión activa de la matriz con factores editables
- Historial de versiones archivadas
- Botón para publicar nueva versión

---

## 7. Reglas de validación del sistema

### 7.1 Validaciones de registro
| Campo | Regla |
|-------|-------|
| Número de documento (PN) | Único en base de datos |
| RUC (PJ) | Único en base de datos |
| Fecha de nacimiento | Mayor de 18 años |
| Monto total de la propiedad | Mayor a $0 |
| Porcentaje UBO | Mayor o igual a 0% (relevante si ≥ 25%) |
| Correo | Único en base de datos |
| Archivo adjunto | PDF, JPG o PNG. Máximo 10 MB |
| Hash SHA-256 | Calculado automáticamente al subir |

### 7.2 Máquina de estados
| Estado actual | Estado destino | Condición |
|---------------|----------------|-----------|
| PENDIENTE_BF | PENDIENTE | Al menos un BF aprobado por OC (automático) |
| PENDIENTE | EN_REVISION | Todos los documentos obligatorios VERIFICADOS (automático) |
| EN_REVISION | OBSERVADO | OC crea observación |
| OBSERVADO | EN_REVISION | No quedan observaciones abiertas (automático) |
| EN_REVISION | ACTIVO | Oficial confirma, todos los requisitos completos |
| EN_REVISION | RECHAZADO | Oficial rechaza con motivo obligatorio |
| PENDIENTE | RECHAZADO | Oficial rechaza con motivo obligatorio |
| ACTIVO | BLOQUEADO | Oficial bloquea con motivo obligatorio |
| BLOQUEADO | ACTIVO | Oficial desbloquea |
| RECHAZADO | (ninguno) | Estado final. No se puede modificar. |

### 7.3 Cálculo de riesgo (automático)
**Trigger:** Cuando existen ambos perfiles (financiero + transaccional).

**Motor:** Usa la **versión activa** de la matriz de riesgo almacenada en BD. Cada cálculo guarda la versión usada.

**Estructura:**
- Factores **positivos:** suman puntos al riesgo
- Factores **mitigantes:** restan puntos
- Factores **bloqueantes:** si se cumplen, resultado es ALTO sin importar el puntaje
- Puntaje bruto: 0–100 (se trunca si supera)
- Puntaje final: no baja de 0

**Umbrales:**
- Puntaje final < 30 → **BAJO**
- Puntaje final 30–69 → **ESTÁNDAR**
- Puntaje final ≥ 70 → **ALTO**
- Cualquier bloqueante → **ALTO**

### 7.4 Requisitos para activar un cliente
- [ ] Estado del expediente: **EN_REVISION**
- [ ] Todos los documentos obligatorios subidos y verificados
- [ ] Perfil financiero registrado
- [ ] Perfil transaccional registrado
- [ ] Riesgo calculado
- [ ] Sin observaciones abiertas
- [ ] Si es PJ: al menos un BF aprobado por OC
- [ ] Si riesgo es ALTO: confirmación manual del Oficial

---

## 8. Errores comunes y soluciones

| Error / Situación | Causa probable | Solución |
|-------------------|----------------|----------|
| "Credenciales incorrectas" | Contraseña errónea o usuario inactivo | Verifica mayúsculas/minúsculas. Si persisten, contacta al Administrador. |
| "Acceso denegado" | El rol no tiene permiso para esa acción | Cierra sesión e ingresa con un usuario que tenga el rol adecuado. |
| "Token inválido o expirado" | El access token expiró (15 min) | El sistema debería renovarlo automáticamente. Si persiste, cierra sesión y vuelve a iniciar. |
| "Sesión expirada" | Inactividad mayor a 30 min o refresh token revocado | Inicia sesión nuevamente. |
| No puedo activar un cliente | Faltan documentos, perfiles, observaciones abiertas o el estado no es EN_REVISION | Revisa el panel de errores que aparece al intentar activar. Completa lo que falta. |
| "El perfil ya existe" | Ya se registró un perfil financiero o transaccional para ese cliente | Cada cliente solo puede tener un perfil financiero y uno transaccional. |
| "Documento excede 10 MB" | El archivo es demasiado grande | Comprime el archivo o reduce la resolución de la imagen. |
| "Formato no permitido" | El archivo no es PDF, JPG ni PNG | Convierte el archivo a uno de los formatos permitidos. |
| El riesgo no se calcula | Falta uno de los dos perfiles | Registra el perfil financiero y el transaccional. El cálculo es automático. |
| El expediente PJ no avanza de PENDIENTE_BF | Ningún BF ha sido aprobado por el Oficial | Solicita al Oficial que valide al menos un beneficiario final. |
| "No se puede activar: observaciones abiertas" | Hay observaciones sin cerrar | Responde las observaciones y solicita al Oficial que las cierre. |

---

## 9. Glosario de términos

| Término | Significado |
|---------|-------------|
| **DDC/KYC** | Debida Diligencia de Clientes / Know Your Customer |
| **PEP** | Persona Expuesta Políticamente (políticos, altos funcionarios, militares de alto rango, etc.) |
| **UBO** | Ultimate Beneficial Owner — Beneficiario Final |
| **SSNF** | Superintendencia de Sujetos No Financieros de Panamá |
| **GAFI/FATF** | Grupo de Acción Financiera Internacional — estándares globales contra lavado de dinero |
| **Ley 23 de 2015** | Ley panameña de Prevención de Blanqueo de Capitales, Financiamiento del Terrorismo y FPADM |
| **Expediente** | Conjunto de información, documentos y perfiles de un cliente en el sistema |
| **Estado** | Fase del expediente: PENDIENTE, PENDIENTE_BF, EN_REVISION, OBSERVADO, ACTIVO, BLOQUEADO, RECHAZADO |
| **Riesgo** | Clasificación automática: BAJO, ESTÁNDAR o ALTO |
| **BF** | Beneficiario Final |
| **OC** | Oficial de Cumplimiento |
| **Matriz de riesgo** | Configuración versionada de factores, pesos y umbrales que el sistema usa para calcular el riesgo |
| **Hash SHA-256** | Huella digital criptográfica de un archivo. Garantiza que no fue alterado. |

---

## 10. Soporte y contacto

Si encuentras un error del sistema que no está documentado en este manual:
1. Revisa la consola del navegador (F12 → Console) para ver mensajes de error
2. Revisa los logs del backend en la terminal de Docker: `docker-compose logs -f backend`
3. Documenta el paso a paso para reproducir el error
4. Reporta al equipo de desarrollo o al Administrador del sistema

---

> **Nota legal:** Este sistema es una herramienta de soporte al cumplimiento regulatorio. No reemplaza el juicio profesional del Oficial de Cumplimiento ni la asesoría legal especializada. La promotora inmobiliaria sigue siendo responsable de la debida diligencia conforme a la Ley 23 de 2015 y las regulaciones de la SSNF.

---

*Documento generado para fines académicos — UTP — Ingeniería de Software — Parcial 2 — 2026*
