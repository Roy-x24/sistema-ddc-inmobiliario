from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import obtener_db
from app.models.cliente import Cliente
from app.core.rbac import obtener_usuario_actual, requiere_rol
from app.models.usuario import Usuario
from app.services.estado_service import cambiar_estado_cliente, evaluar_requisitos_activacion, verificar_documentos_para_revision
from app.services.auditoria_service import registrar_auditoria

router = APIRouter(prefix="/clientes", tags=["Activacion"])


@router.patch("/{id}/activar")
def activar_cliente(
    id: str,
    confirmacion_alto: bool = False,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("activar_cliente"))
):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == id, Cliente.eliminado == False).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if cliente.estado == "PENDIENTE":
        verificar_documentos_para_revision(db, id, usuario.correo)
        db.refresh(cliente)

    _, errores = evaluar_requisitos_activacion(
        db,
        id,
        requerir_confirmacion_alto=not confirmacion_alto
    )

    if errores:
        raise HTTPException(status_code=400, detail={"requisitos_faltantes": errores})

    cambiar_estado_cliente(db, cliente, "ACTIVO", usuario.correo)
    registrar_auditoria(db, usuario.correo, "ACTIVAR_CLIENTE", id, "EN_REVISION", "ACTIVO")

    return {"mensaje": "Cliente activado por el Oficial"}


@router.patch("/{id}/rechazar")
def rechazar_cliente(
    id: str,
    motivo: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("rechazar_cliente"))
):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == id, Cliente.eliminado == False).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if not motivo or not motivo.strip():
        raise HTTPException(status_code=400, detail="El motivo de rechazo es obligatorio")

    estado_anterior = cliente.estado
    cambiar_estado_cliente(db, cliente, "RECHAZADO", usuario.correo)
    registrar_auditoria(db, usuario.correo, "RECHAZAR_CLIENTE", id, estado_anterior, f"RECHAZADO: {motivo}")

    return {"mensaje": "Cliente rechazado"}


@router.patch("/{id}/bloquear")
def bloquear_cliente(
    id: str,
    motivo: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("bloquear_cliente"))
):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == id, Cliente.eliminado == False).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if not motivo or not motivo.strip():
        raise HTTPException(status_code=400, detail="El motivo de bloqueo es obligatorio")

    if cliente.estado != "ACTIVO":
        raise HTTPException(status_code=400, detail="Solo se puede bloquear un cliente ACTIVO")

    cambiar_estado_cliente(db, cliente, "BLOQUEADO", usuario.correo)
    registrar_auditoria(db, usuario.correo, "BLOQUEAR_CLIENTE", id, "ACTIVO", f"BLOQUEADO: {motivo}")
    return {"mensaje": "Cliente bloqueado"}


@router.patch("/{id}/desbloquear")
def desbloquear_cliente(
    id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("desbloquear_cliente"))
):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == id, Cliente.eliminado == False).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if cliente.estado != "BLOQUEADO":
        raise HTTPException(status_code=400, detail="Solo se puede desbloquear un cliente BLOQUEADO")

    cambiar_estado_cliente(db, cliente, "ACTIVO", usuario.correo)
    registrar_auditoria(db, usuario.correo, "DESBLOQUEAR_CLIENTE", id, "BLOQUEADO", "ACTIVO")
    return {"mensaje": "Cliente desbloqueado"}


@router.patch("/{id}/revertir-activacion")
def revertir_activacion(
    id: str,
    motivo: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("revertir_activacion"))
):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == id, Cliente.eliminado == False).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if not motivo or not motivo.strip():
        raise HTTPException(status_code=400, detail="El motivo de reversion es obligatorio")

    if cliente.estado != "ACTIVO":
        raise HTTPException(status_code=400, detail="Solo se puede revertir un cliente ACTIVO")

    cambiar_estado_cliente(db, cliente, "EN_REVISION", usuario.correo)
    registrar_auditoria(db, usuario.correo, "REVERTIR_ACTIVACION", id, "ACTIVO", f"EN_REVISION: {motivo}")
    return {"mensaje": "Activacion revertida. El expediente volvio a EN_REVISION"}
