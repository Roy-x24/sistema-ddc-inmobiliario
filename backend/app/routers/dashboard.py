from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.rbac import requiere_rol
from app.database import obtener_db
from app.models.usuario import Usuario
from app.services.dashboard_service import dashboard_empleado, dashboard_oficial

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/empleado")
def obtener_dashboard_empleado(
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    return dashboard_empleado(db, usuario.correo)


@router.get("/oficial")
def obtener_dashboard_oficial(
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("ver_cumplimiento"))
):
    return dashboard_oficial(db)
