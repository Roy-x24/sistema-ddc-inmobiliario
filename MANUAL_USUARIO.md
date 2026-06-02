# Manual de Usuario — Sistema DDC/KYC Inmobiliario

> Versión MVP 1.0 — Junio 2026
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

El sistema viene configurado con 4 usuarios de prueba creados automáticamente al levantar la base de datos por primera vez:

| Correo | Rol | Contraseña | ¿Qué puede hacer? |
|--------|-----|------------|-------------------|
| `empleado@ddc.com` | Empleado | `empleado123` | Registrar clientes, adjuntar documentos, registrar perfiles |
| `oficial@ddc.com` | Oficial de Cumplimiento | `oficial123` | Verificar documentos, ver riesgo, activar/rechazar clientes, ver auditoría |
| `auditor@ddc.com` | Auditor | `auditor123` | Ver riesgo, ver auditoría, consultar clientes |
| `admin@ddc.com` | Administrador | `admin123` | Todo lo anterior + crear usuarios y gestionar roles |

> **Seguridad:** Las contraseñas se almacenan con hash bcrypt. Nunca se guardan en texto plano.

---

## 4. Flujo de trabajo del expediente (resumen visual)

```
PENDIENTE
    │  ← Empleado registra cliente (CU-01)
    │  ← Empleado adjunta documentos (CU-04)
    │  ← Oficial verifica documentos (CU-08)
    │  ← Empleado registra perfiles (CU-05, CU-06)
    │  ← Sistema calcula riesgo automático (CU-15)
    ▼
EN_REVISION  (automático cuando todos los docs obligatorios están VERIFICADOS)
    │  ← Oficial revisa requisitos completos
    ▼
ACTIVO  ← Oficial activa al cliente (CU-11)
    │
    └── O bien: RECHAZADO ← Oficial rechaza con motivo
```

**Regla crítica:** Un cliente **NO puede saltarse estados**. No se activa desde `PENDIENTE`. Debe pasar obligatoriamente por `EN_REVISION`.

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
- Datos de los beneficiarios finales (UBO): nombre, documento, nacionalidad, porcentaje de participación (mínimo 25%)
- Perfil financiero y transaccional (igual que persona natural)

> **Validaciones del registro:**
> - El número de documento/cédula y el RUC deben ser únicos en el sistema
> - El monto estimado debe ser mayor a $0
> - Para beneficiarios finales, el porcentaje debe ser ≥ 25%
> - Al guardar, el cliente queda en estado **PENDIENTE**

#### 5.1.3 Adjuntar documentos
1. Ve al menú **Documentos**
2. Selecciona el cliente del dropdown
3. Selecciona el **tipo de documento**
4. Elige el archivo desde tu computadora (PDF, JPG o PNG, máximo 10 MB)
5. Haz clic en **Subir documento**

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

> **Importante:** Los documentos subidos quedan en estado **PENDIENTE_DE_VERIFICACION**. Solo el Oficial de Cumplimiento puede aprobarlos o rechazarlos.

#### 5.1.4 Registrar perfiles
1. Ve al menú **Perfiles**
2. Selecciona el cliente
3. Completa el **Perfil financiero:**
   - Fuente de ingresos
   - Rango de ingresos mensuales
   - Origen de los fondos para la compra
   - Patrimonio declarado aproximado (opcional)
4. Completa el **Perfil transaccional:**
   - Propósito de la compra
   - Monto estimado (USD)
   - Tipo de transacción: transferencia, cheque de gerencia, financiamiento o mixto
   - Si tiene financiamiento bancario: banco y monto del préstamo
5. Haz clic en **Guardar** en cada perfil

> **Regla automática:** Cuando existen **ambos perfiles** (financiero y transaccional), el sistema dispara automáticamente el cálculo de riesgo (CU-15).

---

### 5.2 Oficial de Cumplimiento

El Oficial es quien valida la documentación y toma la decisión final de activar o rechazar al cliente.

#### 5.2.1 Verificar documentos
1. Inicia sesión como `oficial@ddc.com`
2. Ve al menú **Documentos**
3. Selecciona un cliente con documentos pendientes
4. Revisa cada documento en la tabla
5. Para cada documento, tienes dos opciones:
   - **Aprobar:** El documento pasa a estado **VERIFICADO**
   - **Rechazar:** Debes ingresar un **motivo obligatorio** de texto. El documento queda en estado **RECHAZADO**

> **Efecto automático:** Cuando **todos los documentos obligatorios** de un cliente están en estado VERIFICADO, el sistema cambia automáticamente el estado del expediente de **PENDIENTE → EN_REVISION**.

#### 5.2.2 Revisar clasificación de riesgo
1. Ve al menú **Riesgo**
2. Selecciona un cliente
3. Visualiza:
   - Nivel de riesgo: **BAJO**, **ESTÁNDAR** o **ALTO**
   - Justificación automática del sistema
   - Factores que aplicaron en la evaluación
   - Fecha del cálculo
4. Si es necesario, haz clic en **Forzar recálculo** para actualizar la clasificación

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

> **Regla crítica:** Si el riesgo es **ALTO**, el cliente **NO puede activarse automáticamente**. El Oficial debe confirmar manualmente que acepta el riesgo antes de activar.

#### 5.2.3 Activar o rechazar un cliente
1. Ve al menú **Activación**
2. Verás la lista de clientes que están pendientes de decisión
3. Revisa que el cliente cumpla todas las precondiciones:
   - Estado del expediente: **EN_REVISION**
   - Todos los documentos obligatorios verificados
   - Perfil financiero completo
   - Perfil transaccional completo
   - Riesgo calculado
   - Si es PJ: beneficiarios finales registrados
4. Si todo está completo:
   - Haz clic en **Activar** → Cliente pasa a **ACTIVO**
   - O haz clic en **Rechazar** → Ingresa un **motivo obligatorio** → Cliente pasa a **RECHAZADO**

> **Nota:** Si intentas activar un cliente que aún no cumple los requisitos, el sistema mostrará un panel de errores detallado indicando exactamente qué falta: documentos faltantes, perfiles incompletos, estado incorrecto, etc.

---

### 5.3 Auditor

El Auditor tiene acceso de solo lectura a los registros de trazabilidad.

#### 5.3.1 Consultar auditoría global
1. Inicia sesión como `auditor@ddc.com`
2. Ve al menú **Auditoría**
3. Visualiza el historial cronológico de **todas las acciones** del sistema:
   - Creación de clientes
   - Subida y verificación de documentos
   - Registro de perfiles
   - Cálculo de riesgo
   - Activaciones y rechazos
   - Cambios de estado

Cada registro muestra:
- Fecha y hora exacta
- Usuario que ejecutó la acción
- Tipo de acción
- Expediente afectado
- Valor anterior → Valor nuevo

#### 5.3.2 Filtrar por expediente
1. En el campo de búsqueda, ingresa el **ID del cliente**
2. Haz clic en **Filtrar**
3. Verás solo las acciones de ese expediente específico

---

### 5.4 Administrador

El Administrador tiene acceso total al sistema, incluyendo la gestión de usuarios.

#### 5.4.1 Crear nuevos usuarios
1. Inicia sesión como `admin@ddc.com`
2. Ve al menú **Administración**
3. En el panel izquierdo, completa el formulario:
   - Nombre completo
   - Correo electrónico (debe ser único)
   - Contraseña
   - Rol: Empleado, Oficial de Cumplimiento, Auditor o Administrador
4. Haz clic en **Crear usuario**

#### 5.4.2 Ver usuarios registrados
En el panel derecho de Administración se muestra la tabla de todos los usuarios del sistema con su nombre, correo, rol y estado (activo/inactivo).

> **Nota:** En esta versión MVP no se permite editar ni eliminar usuarios existentes, solo crear nuevos.

---

## 6. Pantalla por pantalla

### 6.1 Dashboard

Es la pantalla de inicio después de iniciar sesión. Muestra:
- **Tarjetas de resumen:** Total de clientes, pendientes, en revisión, activos y rechazados
- **Feed de acciones recientes:** Últimas 8 acciones registradas en auditoría

### 6.2 Clientes (Listado)

Tabla paginada de todos los expedientes con:
- Búsqueda por nombre o identificación
- Filtro por tipo (Natural / Jurídica)
- Filtro por estado (Pendiente, En revisión, Activo, Rechazado)
- Botón **Ver expediente** para acceder al detalle completo

### 6.3 Nuevo Cliente (Registro)

Formulario en dos pasos (stepper):
- **Paso 1:** Datos identificatorios
- **Paso 2:** Perfil financiero/transaccional

El diseño divide la pantalla en dos columnas: Persona Natural a la izquierda, Persona Jurídica a la derecha.

### 6.4 Expediente (Detalle)

Vista completa de toda la información del cliente:
- Datos generales (estado, riesgo, PEP, fechas)
- Datos específicos según tipo de cliente
- Lista de representantes legales (solo PJ)
- Lista de beneficiarios finales (solo PJ)

### 6.5 Documentos

Panel de gestión documental:
- Selector de cliente
- Selector de tipo de documento
- Campo para subir archivo
- Tabla de documentos subidos con estado
- Botones **Aprobar** / **Rechazar** (solo visible para Oficial)

### 6.6 Perfiles

Dos paneles lado a lado:
- **Perfil financiero:** Fuente de ingresos, rango, origen de fondos, patrimonio
- **Perfil transaccional:** Propósito, monto, tipo de transacción, financiamiento

### 6.7 Riesgo

Visualización de la clasificación de riesgo calculada automáticamente. Muestra:
- Nivel (BAJO / ESTÁNDAR / ALTO) con indicador visual
- Justificación descriptiva
- Factores aplicados
- Fecha del cálculo
- Botón para forzar recálculo

### 6.8 Activación

Tabla de clientes pendientes de decisión final. El Oficial puede:
- **Activar:** Si todos los requisitos están completos
- **Rechazar:** Siempre requiere motivo obligatorio

Si faltan requisitos, aparece un panel rojo listando exactamente qué falta.

### 6.9 Auditoría

Tabla cronológica de todas las acciones del sistema. Soporta filtrado por ID de cliente.

### 6.10 Administración

Panel exclusivo para el rol Administrador:
- Formulario para crear usuarios
- Tabla de usuarios existentes

---

## 7. Reglas de validación del sistema

### 7.1 Validaciones de registro
| Campo | Regla |
|-------|-------|
| Número de documento (PN) | Único en base de datos |
| RUC (PJ) | Único en base de datos |
| Fecha de nacimiento | Mayor de 18 años |
| Monto estimado | Mayor a $0 |
| Porcentaje UBO | Mayor o igual a 25% |
| Correo | Único en base de datos |
| Archivo adjunto | PDF, JPG o PNG. Máximo 10 MB |

### 7.2 Máquina de estados
| Estado actual | Estado destino | Condición |
|---------------|----------------|-----------|
| PENDIENTE | EN_REVISION | Todos los documentos obligatorios VERIFICADOS (automático) |
| EN_REVISION | ACTIVO | Oficial confirma y todos los requisitos completos |
| EN_REVISION | RECHAZADO | Oficial rechaza con motivo obligatorio |
| PENDIENTE | RECHAZADO | Oficial rechaza con motivo obligatorio |
| ACTIVO | (ninguno) | Estado final. No se puede modificar. |
| RECHAZADO | (ninguno) | Estado final. No se puede modificar. |

### 7.3 Cálculo de riesgo (automático)
**Trigger:** Cuando existen ambos perfiles (financiero + transaccional).

**Lógica:** Evaluación por reglas cualitativas. Si cualquier condición de ALTO se cumple, el resultado es ALTO sin importar los demás factores.

| Factor | Resultado |
|--------|-----------|
| Cliente PEP | ALTO |
| País en lista de riesgo | ALTO |
| Monto > $500,000 | ALTO |
| Origen de fondos en efectivo/no verificable | ALTO |
| PJ extranjera + fideicomiso/fundación | ALTO |
| Monto $100,000–$500,000 | ESTÁNDAR |
| PJ nacional + documentación completa | ESTÁNDAR |
| Ningún factor de riesgo | BAJO |

### 7.4 Requisitos para activar un cliente
- [ ] Estado del expediente: **EN_REVISION**
- [ ] Todos los documentos obligatorios subidos y verificados
- [ ] Perfil financiero registrado
- [ ] Perfil transaccional registrado
- [ ] Riesgo calculado
- [ ] Si es PJ: al menos un beneficiario final registrado
- [ ] Si riesgo es ALTO: confirmación manual del Oficial

---

## 8. Errores comunes y soluciones

| Error / Situación | Causa probable | Solución |
|-------------------|----------------|----------|
| "Credenciales incorrectas" | Contraseña errónea o usuario inactivo | Verifica mayúsculas/minúsculas. Si persisten, contacta al Administrador. |
| "Acceso denegado" | El rol no tiene permiso para esa acción | Cierra sesión e ingresa con un usuario que tenga el rol adecuado. |
| No puedo activar un cliente | Faltan documentos, perfiles o el estado no es EN_REVISION | Revisa el panel de errores que aparece al intentar activar. Completa lo que falta. |
| "El perfil ya existe" | Ya se registró un perfil financiero o transaccional para ese cliente | Cada cliente solo puede tener un perfil financiero y uno transaccional. |
| "Documento excede 10 MB" | El archivo es demasiado grande | Comprime el archivo o reduce la resolución de la imagen. |
| "Formato no permitido" | El archivo no es PDF, JPG ni PNG | Convierte el archivo a uno de los formatos permitidos. |
| El riesgo no se calcula | Falta uno de los dos perfiles | Registra el perfil financiero y el transaccional. El cálculo es automático. |
| "Token inválido o expirado" | La sesión expiró (8 horas) | Cierra sesión y vuelve a iniciar. |

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
| **Estado** | Fase del expediente: PENDIENTE, EN_REVISION, ACTIVO, RECHAZADO |
| **Riesgo** | Clasificación automática: BAJO, ESTÁNDAR o ALTO |

---

## 10. Soporte y contacto

Si encuentras un error del sistema que no está documentado en este manual:
1. Revisa la consola del navegador (F12 → Console) para ver mensajes de error
2. Revisa los logs del backend en la terminal de Docker
3. Documenta el paso a paso para reproducir el error
4. Reporta al equipo de desarrollo o al Administrador del sistema

---

> **Nota legal:** Este sistema es una herramienta de soporte al cumplimiento regulatorio. No reemplaza el juicio profesional del Oficial de Cumplimiento ni la asesoría legal especializada. La promotora inmobiliaria sigue siendo responsable de la debida diligencia conforme a la Ley 23 de 2015 y las regulaciones de la SSNF.

---

*Documento generado para fines académicos — UTP — Ingeniería de Software — Parcial 2 — 2026*
