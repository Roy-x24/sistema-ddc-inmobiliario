from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import obtener_db
from app.models.version_matriz_riesgo import VersionMatrizRiesgo
from app.models.factor_riesgo import FactorRiesgo
from app.models.cliente import Cliente
from app.core.rbac import obtener_usuario_actual, requiere_rol
from app.models.usuario import Usuario
from app.services.auditoria_admin_service import registrar_auditoria_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/matriz")
def ver_matriz_activa(
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_matriz"))
):
    version = db.query(VersionMatrizRiesgo).filter(VersionMatrizRiesgo.esta_activa == True).first()
    if not version:
        raise HTTPException(status_code=404, detail="No hay matriz activa")
    factores = db.query(FactorRiesgo).filter(FactorRiesgo.version_id == version.id).all()
    return {
        "version": {"id": str(version.id), "version_numero": version.version_numero, "descripcion": version.descripcion},
        "factores": [
            {"id": str(f.id), "nombre_factor": f.nombre_factor, "descripcion": f.descripcion, "peso": f.peso, "tipo": f.tipo, "activo": f.activo}
            for f in factores
        ]
    }


@router.get("/matriz/versiones")
def listar_versiones(
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_matriz"))
):
    versiones = db.query(VersionMatrizRiesgo).order_by(VersionMatrizRiesgo.version_numero.desc()).all()
    return versiones


@router.post("/matriz")
def crear_version_borrador(
    datos: dict,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_matriz"))
):
    ultima = db.query(VersionMatrizRiesgo).order_by(VersionMatrizRiesgo.version_numero.desc()).first()
    nuevo_numero = (ultima.version_numero + 1) if ultima else 1

    version = VersionMatrizRiesgo(
        version_numero=nuevo_numero,
        descripcion=datos.get("descripcion", ""),
        esta_activa=False,
        publicada_por=usuario.correo
    )
    db.add(version)
    db.commit()
    db.refresh(version)

    # Copiar factores de la version activa anterior
    if ultima:
        factores = db.query(FactorRiesgo).filter(FactorRiesgo.version_id == ultima.id).all()
        for f in factores:
            nf = FactorRiesgo(
                version_id=version.id,
                nombre_factor=f.nombre_factor,
                descripcion=f.descripcion,
                peso=f.peso,
                tipo=f.tipo,
                activo=f.activo
            )
            db.add(nf)
        db.commit()

    return {"id": str(version.id), "version_numero": version.version_numero}


@router.patch("/matriz/{version_id}/publicar")
def publicar_version(
    version_id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_matriz"))
):
    version = db.query(VersionMatrizRiesgo).filter(VersionMatrizRiesgo.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version no encontrada")

    # Desactivar la anterior
    db.query(VersionMatrizRiesgo).filter(VersionMatrizRiesgo.esta_activa == True).update({"esta_activa": False})

    version.esta_activa = True
    version.publicada_por = usuario.correo
    db.commit()

    # Marcar expedientes para reevaluacion
    db.query(Cliente).filter(
        Cliente.estado.in_(["EN_REVISION", "ACTIVO"])
    ).update({"requiere_reevaluacion": True})
    db.commit()

    registrar_auditoria_admin(db, usuario.correo, "PUBLICAR_MATRIZ", {"version_id": str(version_id)})
    return {"mensaje": "Version publicada"}


@router.patch("/factores/{factor_id}")
def editar_factor(
    factor_id: str,
    datos: dict,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_matriz"))
):
    factor = db.query(FactorRiesgo).filter(FactorRiesgo.id == factor_id).first()
    if not factor:
        raise HTTPException(status_code=404, detail="Factor no encontrado")

    if "peso" in datos:
        factor.peso = datos["peso"]
    if "activo" in datos:
        factor.activo = datos["activo"]
    db.commit()

    registrar_auditoria_admin(db, usuario.correo, "EDITAR_FACTOR", {"factor_id": str(factor_id), "cambios": datos})
    return {"mensaje": "Factor actualizado"}
