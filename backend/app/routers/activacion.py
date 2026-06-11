from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import obtener_db
from app.models.cliente import Cliente
from app.models.documento import Documento
from app.models.perfil_financiero import PerfilFinanciero
from app.models.perfil_transaccional import PerfilTransaccional
from app.models.beneficiario_final import BeneficiarioFinal
from app.models.observacion import Observacion
from app.core.rbac import obtener_usuario_actual, requiere_rol
from app.models.usuario import Usuario
from app.services.estado_service import cambiar_estado_cliente, obtener_tipos_obligatorios, verificar_documentos_para_revision
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

    errores = []

    # Estado
    if cliente.estado != "EN_REVISION":
        errores.append(f"Estado actual: '{cliente.estado}'. El expediente debe estar en 'EN_REVISION' para activarse.")

    # Documentos obligatorios
    tipos_obligatorios = obtener_tipos_obligatorios(cliente.tipo_cliente)
    docs = db.query(Documento).filter(Documento.id_cliente == id).all()
    documentos_por_tipo = {d.tipo_documento: d for d in docs}

    for tipo in tipos_obligatorios:
        if tipo not in documentos_por_tipo:
            errores.append(f"Documento obligatorio faltante: {tipo}")
        elif documentos_por_tipo[tipo].estado != "VERIFICADO":
            errores.append(f"Documento pendiente de verificacion: {tipo}")

    # Perfiles
    if not db.query(PerfilFinanciero).filter(PerfilFinanciero.id_cliente == id).first():
        errores.append("Falta perfil financiero")
    if not db.query(PerfilTransaccional).filter(PerfilTransaccional.id_cliente == id).first():
        errores.append("Falta perfil transaccional")

    # Observaciones abiertas
    obs_abiertas = db.query(Observacion).filter(
        Observacion.id_cliente == id,
        Observacion.estado == "ABIERTA"
    ).count()
    if obs_abiertas > 0:
        errores.append("Hay observaciones abiertas pendientes")

    # PJ requiere BF aprobado
    if cliente.tipo_cliente == "JURIDICA":
        bf_aprobado = db.query(BeneficiarioFinal).filter(
            BeneficiarioFinal.id_cliente == id,
            BeneficiarioFinal.estado_validacion == "APROBADO"
        ).first()
        if not bf_aprobado:
            errores.append("Faltan beneficiarios finales aprobados")

    # Riesgo ALTO
    if cliente.nivel_riesgo == "ALTO" and not confirmacion_alto:
        errores.append("Riesgo ALTO: requiere confirmacion manual adicional del Oficial")

    if errores:
        raise HTTPException(status_code=400, detail={"requisitos_faltantes": errores})

    cambiar_estado_cliente(db, cliente, "ACTIVO", usuario.correo)
    registrar_auditoria(db, usuario.correo, "ACTIVAR_CLIENTE", id, "EN_REVISION", "ACTIVO")

    return {"mensaje": "Cliente activado"}


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
