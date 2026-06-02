from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import obtener_db
from app.models.cliente import Cliente
from app.models.documento import Documento
from app.models.perfil_financiero import PerfilFinanciero
from app.models.perfil_transaccional import PerfilTransaccional
from app.models.beneficiario_final import BeneficiarioFinal
from app.routers.auth import obtener_usuario_actual
from app.models.usuario import Usuario
from app.services.estado_service import cambiar_estado_cliente, obtener_tipos_obligatorios
from app.services.auditoria_service import registrar_auditoria

router = APIRouter(prefix="/clientes", tags=["Activación"])


def verificar_rol_oficial(usuario: Usuario):
    if usuario.rol not in ("oficial_cumplimiento", "administrador"):
        raise HTTPException(status_code=403, detail="Solo el Oficial de Cumplimiento puede realizar esta acción")


@router.patch("/{id}/activar")
def activar_cliente(id: str, db: Session = Depends(obtener_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    verificar_rol_oficial(usuario)

    cliente = db.query(Cliente).filter(Cliente.id_cliente == id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    errores = []

    # 1. Estado debe ser EN_REVISION
    if cliente.estado != "EN_REVISION":
        errores.append(f"Estado actual: '{cliente.estado}'. El expediente debe estar en 'EN_REVISION' para activarse.")

    # 2. Documentos obligatorios segun tipo de cliente
    tipos_obligatorios = obtener_tipos_obligatorios(cliente.tipo_cliente)
    docs = db.query(Documento).filter(Documento.id_cliente == id).all()
    documentos_por_tipo = {d.tipo_documento: d for d in docs}

    for tipo in tipos_obligatorios:
        if tipo not in documentos_por_tipo:
            errores.append(f"Documento obligatorio faltante: {tipo}")
        elif documentos_por_tipo[tipo].estado != "VERIFICADO":
            errores.append(f"Documento pendiente de verificación: {tipo}")

    # 3. Perfiles requeridos
    if not db.query(PerfilFinanciero).filter(PerfilFinanciero.id_cliente == id).first():
        errores.append("Falta perfil financiero")
    if not db.query(PerfilTransaccional).filter(PerfilTransaccional.id_cliente == id).first():
        errores.append("Falta perfil transaccional")

    # 4. PJ requiere beneficiarios finales
    if cliente.tipo_cliente == "JURIDICA":
        if not db.query(BeneficiarioFinal).filter(BeneficiarioFinal.id_cliente == id).first():
            errores.append("Faltan beneficiarios finales")

    # 5. Riesgo ALTO requiere confirmacion manual (en MVP se permite desde este endpoint)
    if cliente.nivel_riesgo == "ALTO":
        errores.append("Riesgo ALTO: requiere confirmación manual adicional del Oficial")

    if errores:
        raise HTTPException(status_code=400, detail={"requisitos_faltantes": errores})

    cambiar_estado_cliente(db, cliente, "ACTIVO", usuario.correo)
    registrar_auditoria(db, usuario.correo, "ACTIVAR_CLIENTE", id, "EN_REVISION", "ACTIVO")

    return {"mensaje": "Cliente activado"}


@router.patch("/{id}/rechazar")
def rechazar_cliente(id: str, motivo: str, db: Session = Depends(obtener_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    verificar_rol_oficial(usuario)

    cliente = db.query(Cliente).filter(Cliente.id_cliente == id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if not motivo or not motivo.strip():
        raise HTTPException(status_code=400, detail="El motivo de rechazo es obligatorio")

    estado_anterior = cliente.estado
    cambiar_estado_cliente(db, cliente, "RECHAZADO", usuario.correo)
    registrar_auditoria(db, usuario.correo, "RECHAZAR_CLIENTE", id, estado_anterior, f"RECHAZADO: {motivo}")

    return {"mensaje": "Cliente rechazado"}
