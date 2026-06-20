from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import obtener_db
from app.models.observacion import Observacion
from app.models.cliente import Cliente
from app.schemas.observacion import ObservacionCreate, ObservacionResponse
from app.core.rbac import obtener_usuario_actual, requiere_rol
from app.models.usuario import Usuario
from app.services.auditoria_service import registrar_auditoria
from app.services.estado_service import cambiar_estado_cliente, intentar_activacion_automatica, verificar_observaciones_para_revision

router = APIRouter(prefix="/clientes", tags=["Observaciones"])


@router.post("/{id}/observaciones")
def crear_observacion(
    id: str,
    datos: ObservacionCreate,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("crear_observacion"))
):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == id, Cliente.eliminado == False).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    obs = Observacion(
        id_cliente=id,
        descripcion=datos.descripcion,
        creada_por=usuario.correo
    )
    db.add(obs)

    # Cambiar estado a OBSERVADO si no lo esta ya
    if cliente.estado in ("EN_REVISION", "PENDIENTE"):
        cambiar_estado_cliente(db, cliente, "OBSERVADO", usuario.correo)

    db.commit()
    db.refresh(obs)

    registrar_auditoria(db, usuario.correo, "CREAR_OBSERVACION", id)
    return obs


@router.get("/{id}/observaciones")
def listar_observaciones(
    id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    obs = db.query(Observacion).filter(Observacion.id_cliente == id).order_by(Observacion.fecha_creacion.desc()).all()
    return obs


@router.patch("/observaciones/{obs_id}/responder")
def responder_observacion(
    obs_id: str,
    respuesta: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("responder_observacion"))
):
    obs = db.query(Observacion).filter(Observacion.id == obs_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observacion no encontrada")

    obs.respuesta = respuesta
    obs.respondida_por = usuario.correo
    from sqlalchemy import func
    obs.fecha_respuesta = func.now()
    db.commit()

    registrar_auditoria(db, usuario.correo, "RESPONDER_OBSERVACION", obs.id_cliente)
    return obs


@router.patch("/observaciones/{obs_id}/cerrar")
def cerrar_observacion(
    obs_id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("cerrar_observacion"))
):
    obs = db.query(Observacion).filter(Observacion.id == obs_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail="Observacion no encontrada")

    obs.estado = "CERRADA"
    from sqlalchemy import func
    obs.fecha_cierre = func.now()
    db.commit()

    registrar_auditoria(db, usuario.correo, "CERRAR_OBSERVACION", obs.id_cliente)
    verificar_observaciones_para_revision(db, str(obs.id_cliente), usuario.correo)
    intentar_activacion_automatica(db, str(obs.id_cliente), "sistema")
    return obs
