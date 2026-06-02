from sqlalchemy.orm import Session
from app.models.auditoria import Auditoria

ACCIONES_VALIDAS = {
    "CREAR_CLIENTE",
    "ADJUNTAR_DOCUMENTO",
    "VERIFICAR_DOCUMENTO",
    "RECHAZAR_DOCUMENTO",
    "DESCARGAR_DOCUMENTO",
    "VER_DOCUMENTO",
    "REGISTRAR_PERFIL_FINANCIERO",
    "REGISTRAR_PERFIL_TRANSACCIONAL",
    "CALCULAR_RIESGO",
    "CREAR_OBSERVACION",
    "RESPONDER_OBSERVACION",
    "CERRAR_OBSERVACION",
    "CAMBIAR_ESTADO",
    "ACTIVAR_CLIENTE",
    "RECHAZAR_CLIENTE",
    "BLOQUEAR_CLIENTE",
    "DESBLOQUEAR_CLIENTE",
    "REGISTRAR_BF",
    "VALIDAR_BF",
    "RECHAZAR_BF"
}


def registrar_auditoria(
    db: Session,
    usuario: str,
    accion: str,
    cliente_id: str | None = None,
    valor_anterior: str | None = None,
    valor_nuevo: str | None = None
):
    if accion not in ACCIONES_VALIDAS:
        raise ValueError(f"Accion de auditoria no valida: {accion}")

    registro = Auditoria(
        usuario=usuario,
        accion=accion,
        cliente_id=cliente_id,
        valor_anterior=valor_anterior,
        valor_nuevo=valor_nuevo
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro
