# Flujo de cumplimiento automatizado

```mermaid
flowchart TD
    A["Empleado registra cliente"] --> B["Empleado adjunta documentos"]
    B --> C["Motor documental ejecuta reglas"]
    C --> D{"Documento valido?"}
    D -->|Si| E["VALIDADO_AUTOMATICO"]
    D -->|No, corregible| F["OBSERVADO"]
    D -->|No critico| G["RECHAZADO"]
    E --> H{"Expediente completo?"}
    F --> I["Bandeja: Observados"]
    G --> I
    H -->|No| J["Bandeja: Pendientes"]
    H -->|Si| K["EN_REVISION"]
    K --> L{"Riesgo"}
    L -->|BAJO| M["Activacion automatica"]
    L -->|ESTANDAR| N["Bandeja: Revision oficial"]
    L -->|ALTO| O["Bandeja: Alto riesgo"]
```

## Resultado operativo

El sistema procesa casos simples y el Oficial atiende excepciones. La auditoria registra cada regla y cada decision para justificar el resultado.
