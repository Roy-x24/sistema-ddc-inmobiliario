from sqlalchemy.orm import Session
from app.models.auditoria_admin import AuditoriaAdmin

ACCIONES_ADMIN_VALIDAS = {
    "LOGIN_EXITOSO",
    "LOGIN_FALLIDO",
    "LOGOUT",
    "SESION_REVOCADA",
    "CAMBIO_ROL",
    "CAMBIAR_ROL",
    "CREAR_USUARIO",
    "ACTUALIZAR_USUARIO",
    "ELIMINAR_USUARIO",
    "PUBLICAR_MATRIZ",
    "EDITAR_FACTOR",
    "EDITAR_CONFIG_IA",
    "CREAR_WATCHLIST",
    "EDITAR_WATCHLIST",
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
