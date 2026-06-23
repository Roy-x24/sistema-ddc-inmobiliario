from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.rbac import requiere_rol
from app.database import obtener_db
from app.models.usuario import Usuario
from app.services.cumplimiento_service import bandeja_cumplimiento, decision_expediente, evaluar_automatizacion, resumen_cumplimiento

router = APIRouter(prefix="/cumplimiento", tags=["Cumplimiento"])


@router.get("/bandeja")
def obtener_bandeja(
    tipo: str = "",
    cola: str = "",
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("ver_cumplimiento"))
):
    return bandeja_cumplimiento(db, tipo, cola)


@router.get("/resumen")
def obtener_resumen(
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("ver_cumplimiento"))
):
    return resumen_cumplimiento(db)


@router.get("/clientes/{id}/decision")
def obtener_decision(
    id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("ver_cumplimiento"))
):
    decision = decision_expediente(db, id)
    if not decision:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return decision


@router.post("/clientes/{id}/evaluar-automatizacion")
def ejecutar_evaluacion(
    id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("ver_cumplimiento"))
):
    return evaluar_automatizacion(db, id)
