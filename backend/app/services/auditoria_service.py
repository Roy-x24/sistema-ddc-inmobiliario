from sqlalchemy.orm import Session
from app.models.auditoria import Auditoria

ACCIONES_VALIDAS = {
    "CREAR_CLIENTE",
    "ADJUNTAR_DOCUMENTO",
    "VERIFICAR_DOCUMENTO",
    "RECHAZAR_DOCUMENTO",
    "DESCARGAR_DOCUMENTO",
    "VER_DOCUMENTO",
    "VISUALIZAR_DOCUMENTO",
    "REEMPLAZAR_DOCUMENTO",
    "REGISTRAR_PERFIL_FINANCIERO",
    "REGISTRAR_PERFIL_TRANSACCIONAL",
    "CALCULAR_RIESGO",
    "CREAR_OBSERVACION",
    "RESPONDER_OBSERVACION",
    "CERRAR_OBSERVACION",
    "CAMBIAR_ESTADO",
    "ACTIVAR_CLIENTE",
    "ACTIVAR_CLIENTE_AUTOMATICO",
    "ESCALAR_CLIENTE_CUMPLIMIENTO",
    "RECHAZAR_CLIENTE",
    "BLOQUEAR_CLIENTE",
    "DESBLOQUEAR_CLIENTE",
    "REGISTRAR_BF",
    "VALIDAR_BF",
    "RECHAZAR_BF",
    "DOCUMENTO_VALIDADO_AUTOMATICO",
    "DOCUMENTO_OBSERVADO_AUTOMATICO",
    "EXPEDIENTE_COMPLETO_AUTOMATICO",
    "ACTIVACION_AUTOMATICA_EVALUADA",
    "ACTIVACION_AUTOMATICA_APROBADA",
    "ESCALAMIENTO_AUTOMATICO_OFICIAL",
    "REGLA_DOCUMENTAL_EJECUTADA",
    "AI_DOCUMENTO_EXTRAIDO",
    "AI_RESUMEN_EXPEDIENTE",
    "AI_OBSERVACION_SUGERIDA",
    "AI_BF_SUGERIDOS",
    "AI_SCREENING_LOCAL",
    "AI_PRIORIDAD_CALCULADA",
    "AI_CONTEXT_SEARCH"
}


def registrar_auditoria(
    db: Session,
    usuario: str,
    accion: str,
    cliente_id: str | None = None,
    valor_anterior: str | None = None,
    valor_nuevo: str | None = None,
    detalle: dict | None = None,
    origen: str = "humano",
    severidad: str = "info",
    correlation_id: str | None = None,
    version_regla: str | None = None
):
    if accion not in ACCIONES_VALIDAS:
        raise ValueError(f"Accion de auditoria no valida: {accion}")

    registro = Auditoria(
        usuario=usuario,
        accion=accion,
        cliente_id=cliente_id,
        valor_anterior=valor_anterior,
        valor_nuevo=valor_nuevo,
        detalle=detalle,
        origen=origen,
        severidad=severidad,
        correlation_id=correlation_id,
        version_regla=version_regla
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro
