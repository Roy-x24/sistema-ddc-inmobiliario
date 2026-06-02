from sqlalchemy.orm import Session
from app.models.cliente import Cliente
from app.models.documento import Documento
from app.models.observacion import Observacion
from app.services.auditoria_service import registrar_auditoria

ESTADOS_VALIDOS = {
    "PENDIENTE", "PENDIENTE_BF", "EN_REVISION", "OBSERVADO",
    "ACTIVO", "BLOQUEADO", "RECHAZADO"
}

TRANSICIONES_PERMITIDAS = {
    "PENDIENTE_BF": {"PENDIENTE"},
    "PENDIENTE": {"EN_REVISION", "RECHAZADO"},
    "EN_REVISION": {"ACTIVO", "RECHAZADO", "OBSERVADO", "BLOQUEADO"},
    "OBSERVADO": {"EN_REVISION"},
    "ACTIVO": {"BLOQUEADO"},
    "BLOQUEADO": {"ACTIVO"},
    "RECHAZADO": set()
}


def puede_transicionar(estado_actual: str, estado_nuevo: str) -> bool:
    return estado_nuevo in TRANSICIONES_PERMITIDAS.get(estado_actual, set())


def cambiar_estado_cliente(db: Session, cliente: Cliente, nuevo_estado: str, usuario: str):
    if not puede_transicionar(cliente.estado, nuevo_estado):
        raise ValueError(f"Transicion no permitida de {cliente.estado} a {nuevo_estado}")

    estado_anterior = cliente.estado
    cliente.estado = nuevo_estado
    db.commit()
    db.refresh(cliente)

    registrar_auditoria(
        db=db,
        usuario=usuario,
        accion="CAMBIAR_ESTADO",
        cliente_id=str(cliente.id_cliente),
        valor_anterior=estado_anterior,
        valor_nuevo=nuevo_estado
    )

    return cliente


def verificar_documentos_para_revision(db: Session, cliente_id: str, usuario_sistema: str = "sistema"):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == cliente_id).first()
    if not cliente:
        return

    if cliente.estado not in ("PENDIENTE", "PENDIENTE_BF"):
        return

    documentos = db.query(Documento).filter(Documento.id_cliente == cliente_id).all()
    if not documentos:
        return

    tipos_obligatorios = obtener_tipos_obligatorios(cliente.tipo_cliente)
    documentos_por_tipo = {d.tipo_documento: d for d in documentos}

    for tipo in tipos_obligatorios:
        if tipo not in documentos_por_tipo:
            return
        if documentos_por_tipo[tipo].estado != "VERIFICADO":
            return

    # Si es PJ y esta en PENDIENTE_BF, no puede avanzar hasta BF aprobado
    if cliente.estado == "PENDIENTE_BF":
        return

    cambiar_estado_cliente(db, cliente, "EN_REVISION", usuario_sistema)


def obtener_tipos_obligatorios(tipo_cliente: str):
    if tipo_cliente == "NATURAL":
        return ["DOCUMENTO_IDENTIDAD", "COMPROBANTE_INGRESOS", "COMPROBANTE_RESIDENCIA"]
    return ["AVISO_OPERACION", "CERTIFICADO_EXISTENCIA", "IDENTIFICACION_REPRESENTANTE", "IDENTIFICACION_BENEFICIARIOS"]


def verificar_bf_para_pendiente(db: Session, cliente_id: str, usuario_sistema: str = "sistema"):
    from app.models.beneficiario_final import BeneficiarioFinal
    cliente = db.query(Cliente).filter(Cliente.id_cliente == cliente_id).first()
    if not cliente or cliente.estado != "PENDIENTE_BF":
        return

    bf_aprobado = db.query(BeneficiarioFinal).filter(
        BeneficiarioFinal.id_cliente == cliente_id,
        BeneficiarioFinal.estado_validacion == "APROBADO"
    ).first()

    if bf_aprobado:
        cambiar_estado_cliente(db, cliente, "PENDIENTE", usuario_sistema)


def verificar_observaciones_para_revision(db: Session, cliente_id: str, usuario_sistema: str = "sistema"):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == cliente_id).first()
    if not cliente or cliente.estado != "OBSERVADO":
        return

    abiertas = db.query(Observacion).filter(
        Observacion.id_cliente == cliente_id,
        Observacion.estado == "ABIERTA"
    ).count()

    if abiertas == 0:
        cambiar_estado_cliente(db, cliente, "EN_REVISION", usuario_sistema)
