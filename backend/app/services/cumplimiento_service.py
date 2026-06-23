from sqlalchemy.orm import Session
from app.models.cliente import Cliente
from app.models.documento import Documento
from app.models.observacion import Observacion
from app.models.perfil_financiero import PerfilFinanciero
from app.models.perfil_transaccional import PerfilTransaccional
from app.models.persona_natural import PersonaNatural
from app.models.persona_juridica import PersonaJuridica
from app.services.estado_service import ESTADOS_DOCUMENTO_VALIDOS, evaluar_requisitos_activacion, obtener_tipos_obligatorios, intentar_activacion_automatica


def _nombre_cliente(db: Session, cliente: Cliente):
    if cliente.tipo_cliente == "NATURAL":
        pn = db.query(PersonaNatural).filter(PersonaNatural.id == cliente.id_cliente).first()
        return (f"{pn.nombres} {pn.apellidos}", pn.numero_documento) if pn else ("-", "-")
    pj = db.query(PersonaJuridica).filter(PersonaJuridica.id == cliente.id_cliente).first()
    return (pj.razon_social, pj.ruc) if pj else ("-", "-")


def _metricas_documentos(db: Session, cliente: Cliente):
    docs = db.query(Documento).filter(Documento.id_cliente == cliente.id_cliente).all()
    obligatorios = obtener_tipos_obligatorios(cliente.tipo_cliente)
    por_tipo = {d.tipo_documento: d for d in docs}
    faltantes = [tipo for tipo in obligatorios if tipo not in por_tipo]
    observados = [d for d in docs if d.estado == "OBSERVADO"]
    rechazados = [d for d in docs if d.estado == "RECHAZADO"]
    verificados = [tipo for tipo in obligatorios if tipo in por_tipo and por_tipo[tipo].estado in ESTADOS_DOCUMENTO_VALIDOS]
    completitud = int((len(verificados) / len(obligatorios)) * 100) if obligatorios else 100
    return {
        "total": len(docs),
        "obligatorios": len(obligatorios),
        "verificados": len(verificados),
        "faltantes": faltantes,
        "observados": len(observados),
        "rechazados": len(rechazados),
        "completitud": completitud,
    }


def decision_expediente(db: Session, cliente_id: str):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == cliente_id, Cliente.eliminado == False).first()
    if not cliente:
        return None

    nombre, identificacion = _nombre_cliente(db, cliente)
    docs = _metricas_documentos(db, cliente)
    _, errores = evaluar_requisitos_activacion(db, str(cliente.id_cliente), requerir_confirmacion_alto=True)
    obs_abiertas = db.query(Observacion).filter(Observacion.id_cliente == cliente.id_cliente, Observacion.estado == "ABIERTA").count()
    tiene_pf = db.query(PerfilFinanciero).filter(PerfilFinanciero.id_cliente == cliente.id_cliente).first() is not None
    tiene_pt = db.query(PerfilTransaccional).filter(PerfilTransaccional.id_cliente == cliente.id_cliente).first() is not None

    cola = "PENDIENTES_INFORMACION"
    accion = "Completar expediente"
    motivo = "Faltan documentos o perfiles"
    if docs["rechazados"] or docs["observados"] or obs_abiertas:
        cola = "OBSERVADOS_DOCUMENTOS"
        accion = "Revisar observaciones"
        motivo = "Existen documentos observados/rechazados u observaciones abiertas"
    elif cliente.nivel_riesgo == "ALTO":
        cola = "ALTO_RIESGO"
        accion = "Decision manual del Oficial"
        motivo = "Riesgo alto requiere confirmacion manual"
    elif cliente.estado == "EN_REVISION" and cliente.nivel_riesgo == "BAJO" and not errores:
        cola = "LISTOS_AUTOACTIVACION"
        accion = "Autoactivar"
        motivo = "Expediente bajo riesgo sin excepciones"
    elif cliente.estado == "EN_REVISION" and cliente.nivel_riesgo == "ESTANDAR":
        cola = "REVISION_OFICIAL"
        accion = "Aprobar o rechazar manualmente"
        motivo = "Riesgo estandar requiere criterio del Oficial"
    elif cliente.estado in ("ACTIVO", "BLOQUEADO", "RECHAZADO"):
        cola = "CERRADOS"
        accion = "Sin accion"
        motivo = f"Expediente en estado {cliente.estado}"

    return {
        "id_cliente": str(cliente.id_cliente),
        "nombre": nombre,
        "identificacion": identificacion,
        "tipo_cliente": cliente.tipo_cliente,
        "estado": cliente.estado,
        "nivel_riesgo": cliente.nivel_riesgo,
        "cola": cola,
        "accion_sugerida": accion,
        "motivo_principal": motivo,
        "completitud_documental": docs["completitud"],
        "documentos": docs,
        "perfil_financiero": tiene_pf,
        "perfil_transaccional": tiene_pt,
        "errores_activacion": errores,
    }


def bandeja_cumplimiento(db: Session, tipo: str = "", cola: str = ""):
    query = db.query(Cliente).filter(Cliente.eliminado == False)
    if tipo:
        query = query.filter(Cliente.tipo_cliente == tipo.upper())
    items = [decision_expediente(db, str(c.id_cliente)) for c in query.order_by(Cliente.fecha_registro.desc()).all()]
    items = [i for i in items if i and i["cola"] != "CERRADOS"]
    if cola:
        items = [i for i in items if i["cola"] == cola]
    return items


def resumen_cumplimiento(db: Session):
    items = bandeja_cumplimiento(db)
    resumen = {
        "LISTOS_AUTOACTIVACION": 0,
        "REVISION_OFICIAL": 0,
        "OBSERVADOS_DOCUMENTOS": 0,
        "ALTO_RIESGO": 0,
        "PENDIENTES_INFORMACION": 0,
        "total": len(items),
    }
    for item in items:
        resumen[item["cola"]] = resumen.get(item["cola"], 0) + 1
    return resumen


def evaluar_automatizacion(db: Session, cliente_id: str):
    return intentar_activacion_automatica(db, cliente_id, "sistema")
