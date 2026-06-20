from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import obtener_db
from app.models.clasificacion_riesgo import ClasificacionRiesgo
from app.schemas.riesgo import RiesgoResponse
from app.core.rbac import obtener_usuario_actual, requiere_rol
from app.models.usuario import Usuario
from app.services.riesgo_service import calcular_riesgo_cliente
from app.services.estado_service import intentar_activacion_automatica

router = APIRouter(prefix="/clientes", tags=["Riesgo"])


@router.get("/{id}/riesgo", response_model=RiesgoResponse)
def obtener_riesgo(
    id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("ver_riesgo"))
):
    riesgo = db.query(ClasificacionRiesgo).filter(
        ClasificacionRiesgo.id_cliente == id
    ).order_by(ClasificacionRiesgo.fecha_calculo.desc()).first()
    if not riesgo:
        raise HTTPException(status_code=404, detail="Clasificacion de riesgo no encontrada")
    return riesgo


@router.post("/{id}/riesgo/calcular")
def forzar_calculo_riesgo(
    id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("ver_riesgo"))
):
    clasificacion = calcular_riesgo_cliente(db, id, usuario.correo)
    if not clasificacion:
        raise HTTPException(status_code=400, detail="No se pudo calcular el riesgo. Verifique perfiles.")
    decision = intentar_activacion_automatica(db, id, "sistema")
    return {
        "mensaje": "Riesgo recalculado",
        "nivel": clasificacion.nivel_riesgo,
        "decision_automatica": decision
    }
