from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import obtener_db
from app.models.auditoria import Auditoria
from app.schemas.auditoria import AuditoriaResponse
from app.routers.auth import obtener_usuario_actual
from app.models.usuario import Usuario

router = APIRouter(tags=["Auditoría"])


def verificar_rol_auditor_oficial(usuario: Usuario):
    if usuario.rol not in ("auditor", "oficial_cumplimiento", "administrador"):
        raise HTTPException(status_code=403, detail="Acceso denegado")


@router.get("/clientes/{id}/auditoria", response_model=List[AuditoriaResponse])
def auditoria_por_cliente(id: str, db: Session = Depends(obtener_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    verificar_rol_auditor_oficial(usuario)
    registros = db.query(Auditoria).filter(Auditoria.cliente_id == id).order_by(Auditoria.fecha.desc()).all()
    return registros


@router.get("/auditoria", response_model=List[AuditoriaResponse])
def auditoria_global(db: Session = Depends(obtener_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    verificar_rol_auditor_oficial(usuario)
    registros = db.query(Auditoria).order_by(Auditoria.fecha.desc()).limit(200).all()
    return registros
