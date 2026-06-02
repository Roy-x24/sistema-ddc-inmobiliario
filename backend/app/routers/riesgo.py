from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import obtener_db
from app.models.clasificacion_riesgo import ClasificacionRiesgo
from app.schemas.riesgo import RiesgoResponse
from app.routers.auth import obtener_usuario_actual
from app.models.usuario import Usuario
from app.services.riesgo_service import calcular_riesgo_cliente

router = APIRouter(prefix="/clientes", tags=["Riesgo"])


def verificar_rol_oficial_auditor(usuario: Usuario):
    if usuario.rol not in ("oficial_cumplimiento", "auditor", "administrador"):
        raise HTTPException(status_code=403, detail="Acceso denegado")


@router.get("/{id}/riesgo", response_model=RiesgoResponse)
def obtener_riesgo(id: str, db: Session = Depends(obtener_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    verificar_rol_oficial_auditor(usuario)
    riesgo = db.query(ClasificacionRiesgo).filter(ClasificacionRiesgo.id_cliente == id).order_by(ClasificacionRiesgo.fecha_calculo.desc()).first()
    if not riesgo:
        raise HTTPException(status_code=404, detail="Clasificación de riesgo no encontrada")
    return riesgo


@router.post("/{id}/riesgo/calcular")
def forzar_calculo_riesgo(id: str, db: Session = Depends(obtener_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    verificar_rol_oficial_auditor(usuario)
    clasificacion = calcular_riesgo_cliente(db, id, usuario.correo)
    if not clasificacion:
        raise HTTPException(status_code=400, detail="No se pudo calcular el riesgo. Verifique perfiles.")
    return {"mensaje": "Riesgo recalculado", "nivel": clasificacion.nivel_riesgo}
