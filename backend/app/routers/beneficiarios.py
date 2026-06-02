from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import obtener_db
from app.models.beneficiario_final import BeneficiarioFinal
from app.models.cliente import Cliente
from app.core.rbac import obtener_usuario_actual, requiere_rol
from app.models.usuario import Usuario
from app.services.auditoria_service import registrar_auditoria
from app.services.estado_service import verificar_bf_para_pendiente

router = APIRouter(prefix="/clientes", tags=["Beneficiarios Finales"])


@router.post("/{id}/beneficiarios")
def registrar_beneficiario(
    id: str,
    datos: dict,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("registrar_bf"))
):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == id, Cliente.eliminado == False).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    porcentaje = datos.get("porcentaje_participacion", 0)
    bf = BeneficiarioFinal(
        id_cliente=id,
        nombre_completo=datos["nombre_completo"],
        numero_documento=datos["numero_documento"],
        nacionalidad=datos["nacionalidad"],
        porcentaje_participacion=porcentaje,
        tipo_control=datos.get("tipo_control"),
        es_pep=datos.get("es_pep", False),
        es_relevante=(porcentaje >= 25)
    )
    db.add(bf)
    db.commit()
    db.refresh(bf)

    registrar_auditoria(db, usuario.correo, "REGISTRAR_BF", id)
    return {"id": str(bf.id), "estado_validacion": bf.estado_validacion}


@router.get("/{id}/beneficiarios", response_model=List[dict])
def listar_beneficiarios(
    id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    bfs = db.query(BeneficiarioFinal).filter(BeneficiarioFinal.id_cliente == id).all()
    return [
        {
            "id": str(b.id),
            "nombre_completo": b.nombre_completo,
            "numero_documento": b.numero_documento,
            "nacionalidad": b.nacionalidad,
            "porcentaje_participacion": float(b.porcentaje_participacion),
            "tipo_control": b.tipo_control,
            "es_pep": b.es_pep,
            "es_relevante": b.es_relevante,
            "estado_validacion": b.estado_validacion,
            "validado_por": b.validado_por,
            "motivo_rechazo": b.motivo_rechazo,
            "fecha_validacion": str(b.fecha_validacion) if b.fecha_validacion else None
        }
        for b in bfs
    ]


@router.patch("/beneficiarios/{bf_id}/aprobar")
def aprobar_beneficiario(
    bf_id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("validar_bf"))
):
    bf = db.query(BeneficiarioFinal).filter(BeneficiarioFinal.id == bf_id).first()
    if not bf:
        raise HTTPException(status_code=404, detail="Beneficiario no encontrado")

    bf.estado_validacion = "APROBADO"
    bf.validado_por = usuario.correo
    from sqlalchemy import func
    bf.fecha_validacion = func.now()
    db.commit()

    registrar_auditoria(db, usuario.correo, "VALIDAR_BF", str(bf.id_cliente))
    verificar_bf_para_pendiente(db, str(bf.id_cliente), usuario.correo)
    return {"mensaje": "Beneficiario aprobado"}


@router.patch("/beneficiarios/{bf_id}/rechazar")
def rechazar_beneficiario(
    bf_id: str,
    motivo: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("rechazar_bf"))
):
    bf = db.query(BeneficiarioFinal).filter(BeneficiarioFinal.id == bf_id).first()
    if not bf:
        raise HTTPException(status_code=404, detail="Beneficiario no encontrado")

    if not motivo or not motivo.strip():
        raise HTTPException(status_code=400, detail="El motivo de rechazo es obligatorio")

    bf.estado_validacion = "RECHAZADO"
    bf.validado_por = usuario.correo
    bf.motivo_rechazo = motivo
    from sqlalchemy import func
    bf.fecha_validacion = func.now()
    db.commit()

    registrar_auditoria(db, usuario.correo, "RECHAZAR_BF", str(bf.id_cliente))
    return {"mensaje": "Beneficiario rechazado"}
