from sqlalchemy.orm import Session
from app.models.beneficiario_final import BeneficiarioFinal
from app.models.cliente import Cliente
from app.models.documento import Documento
from app.models.observacion import Observacion
from app.models.perfil_financiero import PerfilFinanciero
from app.models.perfil_transaccional import PerfilTransaccional
from app.services.estado_service import ESTADOS_DOCUMENTO_VALIDOS, obtener_tipos_obligatorios
from sqlalchemy import text


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
        "action_route": None,
        "owner": "sistema",
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
            "action_route": f"/beneficiarios/{cliente.id_cliente}",
            "owner": "empleado/oficial",
        }

    observaciones_abiertas = db.query(Observacion).filter(
        Observacion.id_cliente == cliente.id_cliente,
        Observacion.estado == "ABIERTA"
    ).count()

    screening_count = 0
    try:
        screening_count = db.execute(
            text("SELECT COUNT(*) FROM screening_results WHERE id_cliente = :id"),
            {"id": str(cliente.id_cliente)}
        ).scalar() or 0
    except Exception:
        screening_count = 0

    items = [
        {
            "key": "datos_cliente",
            "label": "Datos cliente",
            "status": "COMPLETO",
            "blocking": False,
            "message": "Datos base registrados",
            "action": None,
            "action_route": None,
            "owner": "empleado",
        },
        {
            "key": "perfiles",
            "label": "Perfiles",
            "status": "COMPLETO" if perfil_financiero and perfil_transaccional else "PENDIENTE",
            "blocking": not (perfil_financiero and perfil_transaccional),
            "message": f"{int(perfil_financiero) + int(perfil_transaccional)}/2 perfiles registrados",
            "action": "Completar perfiles",
            "action_route": f"/perfiles/{cliente.id_cliente}",
            "owner": "empleado",
        },
        {
            "key": "documentos_obligatorios",
            "label": "Documentos obligatorios",
            "status": "COMPLETO" if docs_ok else "PENDIENTE",
            "blocking": not docs_ok,
            "message": "Todos los documentos obligatorios estan verificados" if docs_ok else f"Faltantes: {len(documentos_faltantes)}; pendientes: {len(documentos_pendientes)}",
            "action": "Revisar documentos",
            "action_route": f"/documentos/{cliente.id_cliente}",
            "owner": "empleado",
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
            "action_route": f"/observaciones/{cliente.id_cliente}",
            "owner": "empleado/oficial",
        },
        {
            "key": "riesgo",
            "label": "Riesgo vigente",
            "status": "COMPLETO" if cliente.nivel_riesgo else "PENDIENTE",
            "blocking": not bool(cliente.nivel_riesgo),
            "message": f"Riesgo calculado: {cliente.nivel_riesgo}" if cliente.nivel_riesgo else "Falta calcular o registrar el nivel de riesgo",
            "action": "Calcular riesgo",
            "action_route": f"/riesgo/{cliente.id_cliente}",
            "owner": "oficial",
        },
        {
            "key": "screening",
            "label": "PEP/sanciones",
            "status": "COMPLETO" if screening_count > 0 else "PENDIENTE",
            "blocking": False,
            "message": f"{screening_count} resultado(s) de screening registrados" if screening_count > 0 else "Sin screening registrado; no bloquea demo, pero debe revisarse antes de produccion",
            "action": "Ejecutar screening",
            "action_route": f"/expediente/{cliente.id_cliente}",
            "owner": "oficial/sistema",
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
        "action_route": "/cumplimiento" if listo else None,
        "owner": "sistema",
    })
    items.append({
        "key": "activacion",
        "label": "Activacion",
        "status": "COMPLETO" if cliente.estado == "ACTIVO" else ("BLOQUEADO" if bloqueos else "PENDIENTE"),
        "blocking": False,
        "message": "Cliente activo" if cliente.estado == "ACTIVO" else ("Bloqueada por requisitos pendientes" if bloqueos else "Puede pasar a decision de activacion"),
        "action": "Ir a activacion" if not bloqueos else None,
        "action_route": f"/activacion/{cliente.id_cliente}" if not bloqueos else None,
        "owner": "oficial/sistema",
    })

    return {
        "id_cliente": str(cliente.id_cliente),
        "estado": cliente.estado,
        "nivel_riesgo": cliente.nivel_riesgo,
        "ready_for_officer": listo,
        "blocking_count": len(bloqueos),
        "items": items,
    }
