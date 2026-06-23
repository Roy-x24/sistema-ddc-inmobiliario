from sqlalchemy.orm import Session
from app.models.cliente import Cliente
from app.models.documento import Documento
from app.models.observacion import Observacion
from app.models.perfil_financiero import PerfilFinanciero
from app.models.perfil_transaccional import PerfilTransaccional
from app.models.auditoria import Auditoria
from app.services.auditoria_service import registrar_auditoria

NIVELES_AUTO_ACTIVACION = {"BAJO"}
ESTADOS_DOCUMENTO_VALIDOS = {"VERIFICADO", "VALIDADO_AUTOMATICO", "VERIFICADO_MANUAL"}

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
        if documentos_por_tipo[tipo].estado not in ESTADOS_DOCUMENTO_VALIDOS:
            return

    # Si es PJ y esta en PENDIENTE_BF, no puede avanzar hasta BF aprobado
    if cliente.estado == "PENDIENTE_BF":
        return

    cambiar_estado_cliente(db, cliente, "EN_REVISION", usuario_sistema)


def evaluar_requisitos_activacion(
    db: Session,
    cliente_id: str,
    requerir_confirmacion_alto: bool = True
):
    from app.models.beneficiario_final import BeneficiarioFinal

    cliente = db.query(Cliente).filter(
        Cliente.id_cliente == cliente_id,
        Cliente.eliminado == False
    ).first()
    if not cliente:
        return None, ["Cliente no encontrado"]

    errores = []

    if cliente.estado != "EN_REVISION":
        errores.append(
            f"Estado actual: '{cliente.estado}'. El expediente debe estar en 'EN_REVISION' para activarse."
        )

    tipos_obligatorios = obtener_tipos_obligatorios(cliente.tipo_cliente)
    documentos = db.query(Documento).filter(Documento.id_cliente == cliente_id).all()
    documentos_por_tipo = {d.tipo_documento: d for d in documentos}

    for tipo in tipos_obligatorios:
        if tipo not in documentos_por_tipo:
            errores.append(f"Documento obligatorio faltante: {tipo}")
        elif documentos_por_tipo[tipo].estado not in ESTADOS_DOCUMENTO_VALIDOS:
            errores.append(f"Documento pendiente de verificacion: {tipo}")

    if not db.query(PerfilFinanciero).filter(PerfilFinanciero.id_cliente == cliente_id).first():
        errores.append("Falta perfil financiero")
    if not db.query(PerfilTransaccional).filter(PerfilTransaccional.id_cliente == cliente_id).first():
        errores.append("Falta perfil transaccional")

    observaciones_abiertas = db.query(Observacion).filter(
        Observacion.id_cliente == cliente_id,
        Observacion.estado == "ABIERTA"
    ).count()
    if observaciones_abiertas > 0:
        errores.append("Hay observaciones abiertas pendientes")

    if cliente.tipo_cliente == "JURIDICA":
        bf_aprobado = db.query(BeneficiarioFinal).filter(
            BeneficiarioFinal.id_cliente == cliente_id,
            BeneficiarioFinal.estado_validacion == "APROBADO"
        ).first()
        if not bf_aprobado:
            errores.append("Faltan beneficiarios finales aprobados")

    if not cliente.nivel_riesgo:
        errores.append("Falta clasificacion de riesgo calculada")
    elif cliente.nivel_riesgo == "ALTO" and requerir_confirmacion_alto:
        errores.append("Riesgo ALTO: requiere confirmacion manual adicional del Oficial")

    return cliente, errores


def intentar_activacion_automatica(db: Session, cliente_id: str, usuario_sistema: str = "sistema"):
    cliente = db.query(Cliente).filter(
        Cliente.id_cliente == cliente_id,
        Cliente.eliminado == False
    ).first()
    if not cliente:
        return {"accion": "sin_accion", "motivo": "cliente_no_encontrado"}

    if cliente.estado == "PENDIENTE":
        verificar_documentos_para_revision(db, cliente_id, usuario_sistema)
        db.refresh(cliente)

    if cliente.estado != "EN_REVISION":
        return {"accion": "sin_accion", "motivo": f"estado_{cliente.estado}"}

    cliente, errores = evaluar_requisitos_activacion(
        db,
        cliente_id,
        requerir_confirmacion_alto=False
    )
    if errores:
        return {"accion": "sin_accion", "motivo": "requisitos_pendientes", "errores": errores}

    if cliente.nivel_riesgo in NIVELES_AUTO_ACTIVACION:
        registrar_auditoria(
            db,
            usuario_sistema,
            "ACTIVACION_AUTOMATICA_EVALUADA",
            cliente_id,
            "EN_REVISION",
            "APROBADA",
            detalle={"nivel_riesgo": cliente.nivel_riesgo, "motor": "cumplimiento-v1"},
            origen="sistema",
            version_regla="cumplimiento-v1"
        )
        cambiar_estado_cliente(db, cliente, "ACTIVO", usuario_sistema)
        registrar_auditoria(
            db,
            usuario_sistema,
            "ACTIVAR_CLIENTE_AUTOMATICO",
            cliente_id,
            "EN_REVISION",
            f"ACTIVO por riesgo {cliente.nivel_riesgo}",
            detalle={"nivel_riesgo": cliente.nivel_riesgo, "criterio": "riesgo_bajo_sin_excepciones"},
            origen="sistema",
            version_regla="cumplimiento-v1"
        )
        registrar_auditoria(
            db,
            usuario_sistema,
            "ACTIVACION_AUTOMATICA_APROBADA",
            cliente_id,
            "EN_REVISION",
            "ACTIVO",
            detalle={"nivel_riesgo": cliente.nivel_riesgo},
            origen="sistema",
            version_regla="cumplimiento-v1"
        )
        return {"accion": "activado", "nivel_riesgo": cliente.nivel_riesgo}

    escalacion_existente = db.query(Auditoria).filter(
        Auditoria.cliente_id == cliente_id,
        Auditoria.accion == "ESCALAR_CLIENTE_CUMPLIMIENTO",
        Auditoria.valor_anterior == cliente.nivel_riesgo
    ).first()
    if not escalacion_existente:
        registrar_auditoria(
            db,
            usuario_sistema,
            "ESCALAR_CLIENTE_CUMPLIMIENTO",
            cliente_id,
            cliente.nivel_riesgo,
            "Requiere revision del Oficial",
            detalle={"nivel_riesgo": cliente.nivel_riesgo, "motivo": "riesgo_no_autoactivable"},
            origen="sistema",
            severidad="warning",
            version_regla="cumplimiento-v1"
        )
        registrar_auditoria(
            db,
            usuario_sistema,
            "ESCALAMIENTO_AUTOMATICO_OFICIAL",
            cliente_id,
            cliente.nivel_riesgo,
            "Requiere revision del Oficial",
            detalle={"nivel_riesgo": cliente.nivel_riesgo},
            origen="sistema",
            severidad="warning",
            version_regla="cumplimiento-v1"
        )
    return {"accion": "escalado", "nivel_riesgo": cliente.nivel_riesgo}


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
