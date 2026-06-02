from sqlalchemy.orm import Session
from app.models.auditoria_admin import AuditoriaAdmin

ACCIONES_ADMIN_VALIDAS = {
    "LOGIN_EXITOSO",
    "LOGIN_FALLIDO",
    "LOGOUT",
    "SESION_REVOCADA",
    "CAMBIO_ROL",
    "PUBLICAR_MATRIZ",
    "EDITAR_FACTOR",
    "EXPORTAR_CSV_EXPEDIENTE",
    "EXPORTAR_CSV_ADMIN"
}


def registrar_auditoria_admin(
    db: Session,
    usuario: str,
    accion: str,
    detalle: dict | None = None
):
    if accion not in ACCIONES_ADMIN_VALIDAS:
        raise ValueError(f"Accion de auditoria admin no valida: {accion}")

    registro = AuditoriaAdmin(
        usuario=usuario,
        accion=accion,
        detalle=detalle
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro
