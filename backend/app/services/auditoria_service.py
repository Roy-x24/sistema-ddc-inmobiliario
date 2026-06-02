from sqlalchemy.orm import Session
from app.models.auditoria import Auditoria


ACCIONES_VALIDAS = {
    "CREAR_CLIENTE",
    "ACTUALIZAR_CLIENTE",
    "ADJUNTAR_DOCUMENTO",
    "VERIFICAR_DOCUMENTO",
    "RECHAZAR_DOCUMENTO",
    "REGISTRAR_PERFIL_FINANCIERO",
    "REGISTRAR_PERFIL_TRANSACCIONAL",
    "CALCULAR_RIESGO",
    "ACTIVAR_CLIENTE",
    "RECHAZAR_CLIENTE",
    "CAMBIAR_ESTADO"
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
        raise ValueError(f"Acción de auditoría no válida: {accion}")

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
