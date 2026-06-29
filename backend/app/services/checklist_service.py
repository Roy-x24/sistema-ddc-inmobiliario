from sqlalchemy.orm import Session
from app.models.beneficiario_final import BeneficiarioFinal
from app.models.cliente import Cliente
from app.models.documento import Documento
from app.models.observacion import Observacion
from app.models.perfil_financiero import PerfilFinanciero
from app.models.perfil_transaccional import PerfilTransaccional
from app.services.estado_service import ESTADOS_DOCUMENTO_VALIDOS, obtener_tipos_obligatorios


def checklist_expediente(db: Session, cliente_id: str):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == cliente_id, Cliente.eliminado == False).first()
    if not cliente:
        return None

    obligatorios = obtener_tipos_obligatorios(cliente.tipo_cliente)
    docs = db.query(Documento).filter(Documento.id_cliente == cliente.id_cliente).all()
    docs_por_tipo = {doc.tipo_documento: doc for doc in docs}
    documentos_faltantes = [tipo for tipo in obligatorios if tipo not in docs_por_tipo]
    documentos_pendientes = [
        tipo for tipo in obligatorios
        if tipo in docs_por_tipo and docs_por_tipo[tipo].estado not in ESTADOS_DOCUMENTO_VALIDOS
    ]
    docs_ok = not documentos_faltantes and not documentos_pendientes

    perfil_financiero = db.query(PerfilFinanciero).filter(PerfilFinanciero.id_cliente == cliente.id_cliente).first() is not None
    perfil_transaccional = db.query(PerfilTransaccional).filter(PerfilTransaccional.id_cliente == cliente.id_cliente).first() is not None

    bf_item = {
        "key": "beneficiarios_finales",
        "label": "Beneficiarios finales",
        "status": "NO_APLICA",
        "blocking": False,
        "message": "No aplica para persona natural",
        "action": None,
    }
    if cliente.tipo_cliente == "JURIDICA":
        relevantes = db.query(BeneficiarioFinal).filter(
            BeneficiarioFinal.id_cliente == cliente.id_cliente,
            BeneficiarioFinal.es_relevante == True
        ).all()
        pendientes = [bf for bf in relevantes if bf.estado_validacion != "APROBADO"]
        bf_item = {
            "key": "beneficiarios_finales",
            "label": "Beneficiarios finales",
            "status": "COMPLETO" if relevantes and not pendientes else "BLOQUEADO",
            "blocking": bool(pendientes or not relevantes),
            "message": "BF relevantes aprobados" if relevantes and not pendientes else "Faltan BF relevantes aprobados",
            "action": "Validar BF",
        }

    observaciones_abiertas = db.query(Observacion).filter(
        Observacion.id_cliente == cliente.id_cliente,
        Observacion.estado == "ABIERTA"
    ).count()

    items = [
        {
            "key": "datos_cliente",
            "label": "Datos cliente",
            "status": "COMPLETO",
            "blocking": False,
            "message": "Datos base registrados",
            "action": None,
        },
        {
            "key": "perfiles",
            "label": "Perfiles",
            "status": "COMPLETO" if perfil_financiero and perfil_transaccional else "PENDIENTE",
            "blocking": not (perfil_financiero and perfil_transaccional),
            "message": f"{int(perfil_financiero) + int(perfil_transaccional)}/2 perfiles registrados",
            "action": "Completar perfiles",
        },
        {
            "key": "documentos_obligatorios",
            "label": "Documentos obligatorios",
            "status": "COMPLETO" if docs_ok else "PENDIENTE",
            "blocking": not docs_ok,
            "message": "Todos los documentos obligatorios estan verificados" if docs_ok else f"Faltantes: {len(documentos_faltantes)}; pendientes: {len(documentos_pendientes)}",
            "action": "Revisar documentos",
            "details": {"faltantes": documentos_faltantes, "pendientes": documentos_pendientes},
        },
        bf_item,
        {
            "key": "observaciones",
            "label": "Observaciones",
            "status": "COMPLETO" if observaciones_abiertas == 0 else "BLOQUEADO",
            "blocking": observaciones_abiertas > 0,
            "message": "Sin observaciones abiertas" if observaciones_abiertas == 0 else f"{observaciones_abiertas} observacion(es) abierta(s)",
            "action": "Responder/cerrar observaciones",
        },
    ]

    bloqueos = [item for item in items if item["blocking"]]
    listo = not bloqueos and cliente.estado in ("PENDIENTE", "EN_REVISION")
    items.append({
        "key": "listo_para_oficial",
        "label": "Listo para Oficial",
        "status": "COMPLETO" if listo else "PENDIENTE",
        "blocking": False,
        "message": "Expediente listo para evaluacion de cumplimiento" if listo else "Aun hay requisitos o bloqueos por resolver",
        "action": "Ir a cumplimiento" if listo else None,
    })

    return {
        "id_cliente": str(cliente.id_cliente),
        "estado": cliente.estado,
        "nivel_riesgo": cliente.nivel_riesgo,
        "ready_for_officer": listo,
        "blocking_count": len(bloqueos),
        "items": items,
    }
