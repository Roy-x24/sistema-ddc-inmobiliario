# ADR-004: Matriz de Riesgo Cualitativa en lugar de Matriz de Puntos

## Estado
Aceptado

## Contexto
El sistema debe clasificar el riesgo de cada cliente según criterios regulatorios panameños (Ley 23/2015). Tradicionalmente, muchos sistemas KYC usan una matriz de puntos donde cada factor suma/resta un valor numérico y el total determina la categoría (bajo, estándar, alto).

Se evaluaron dos alternativas:
- **Opción A (elegida):** Reglas cualitativas con factores bloqueantes y ponderaciones fijas por versión de matriz.
- **Opción B:** Matriz de puntos pura (0-100) donde cada factor tiene un peso configurable y el sumatorio define el nivel.

## Decisión
Se implementó una **matriz de riesgo versionada cualitativa**:
- Existe una `VersionMatrizRiesgo` que puede estar activa o no.
- Cada versión tiene `FactorRiesgo` con `tipo` (bloqueante, ponderado) y `peso`.
- Si cualquier factor **bloqueante** se cumple (PEP, país de riesgo, origen de fondos no verificable, monto > $500k, PJ extranjera compleja), el resultado es **ALTO** sin importar el puntaje.
- Si no hay bloqueantes, el puntaje ponderado determina el nivel (`<30` = BAJO, `<70` = ESTÁNDAR, `>=70` = ALTO).
- Si no hay matriz activa, existe un **fallback cualitativo** que replica la lógica legacy con reglas directas.

## Consecuencias

### Positivas
- **Alineado con el contexto regulatorio panameño:** La SSNF y la UAF valoran el criterio del Oficial de Cumplimiento tanto como las reglas automáticas.
- **Claridad para auditorías:** La justificación del riesgo es una lista de factores aplicados (ej. "PEP; país de riesgo KP") en lugar de un número opaco.
- **Versionado:** Permite cambiar la matriz sin afectar clientes ya calculados (se mantiene el historial con `version_matriz_id`).
- **Bloqueantes explícitos:** Garantiza que ciertos clientes nunca se clasifiquen como BAJO ni ESTÁNDAR, independientemente de otros atributos.

### Negativas
- **Menos granularidad:** No permite un cálculo fino como "riesgo 45.3".
- **Configuración manual:** Cada cambio regulatorio requiere que un administrador publique una nueva versión de matriz desde el frontend.
- **Fallback duplicado:** La lógica del fallback (`_calcular_riesgo_cualitativo`) debe mantenerse sincronizada con los factores de la matriz versionada.
