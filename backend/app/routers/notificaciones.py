from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.rbac import obtener_usuario_actual
from app.database import obtener_db
from app.models.usuario import Usuario
from app.services.notificaciones_service import obtener_notificaciones

router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


@router.get("/")
def listar_notificaciones(
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    items = obtener_notificaciones(db, usuario)
    return {
        "total": len(items),
        "alta": sum(1 for item in items if item["prioridad"] == "ALTA"),
        "items": items,
    }
