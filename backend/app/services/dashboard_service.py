from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.auditoria import Auditoria
from app.models.beneficiario_final import BeneficiarioFinal
from app.models.cliente import Cliente
from app.models.documento import Documento
from app.models.observacion import Observacion
from app.models.persona_juridica import PersonaJuridica
from app.models.persona_natural import PersonaNatural
from app.services.checklist_service import checklist_expediente
from app.services.cumplimiento_service import bandeja_cumplimiento, resumen_cumplimiento


def _cliente_item(db: Session, cliente: Cliente):
    nombre = "-"
    identificacion = "-"
    if cliente.tipo_cliente == "NATURAL":
        pn = db.query(PersonaNatural).filter(PersonaNatural.id == cliente.id_cliente).first()
        if pn:
            nombre = f"{pn.nombres} {pn.apellidos}"
            identificacion = pn.numero_documento
    else:
        pj = db.query(PersonaJuridica).filter(PersonaJuridica.id == cliente.id_cliente).first()
        if pj:
            nombre = pj.razon_social
            identificacion = pj.ruc
    return {
        "id_cliente": str(cliente.id_cliente),
        "tipo_cliente": cliente.tipo_cliente,
        "estado": cliente.estado,
        "nivel_riesgo": cliente.nivel_riesgo,
        "fecha_registro": str(cliente.fecha_registro),
        "registrado_por": cliente.registrado_por,
        "nombre": nombre,
        "identificacion": identificacion,
    }


def dashboard_empleado(db: Session, usuario_correo: str):
    clientes = db.query(Cliente).filter(
        Cliente.eliminado == False,
        Cliente.registrado_por == usuario_correo
    ).order_by(Cliente.fecha_registro.desc()).all()

    items = []
    for cliente in clientes:
        checklist = checklist_expediente(db, str(cliente.id_cliente))
        bloqueos = [item for item in checklist["items"] if item.get("blocking")] if checklist else []
        obs_responder = db.query(Observacion).filter(
            Observacion.id_cliente == cliente.id_cliente,
            Observacion.estado == "ABIERTA",
            Observacion.respuesta == None
        ).count()
        docs_faltantes = next(
            (item.get("details", {}).get("faltantes", []) for item in checklist["items"] if item["key"] == "documentos_obligatorios"),
            []
        ) if checklist else []

        accion = "Ver expediente"
        destino = f"/expediente/{cliente.id_cliente}"
        if obs_responder:
            accion = "Responder observacion"
            destino = f"/observaciones/{cliente.id_cliente}"
        elif docs_faltantes:
            accion = "Subir documentos"
            destino = f"/documentos/{cliente.id_cliente}"
        elif checklist and cliente.tipo_cliente == "JURIDICA" and any(item["key"] == "beneficiarios_finales" and item["blocking"] for item in checklist["items"]):
            accion = "Completar BF"
            destino = f"/beneficiarios/{cliente.id_cliente}"
        elif checklist and any(item["key"] == "perfiles" and item["blocking"] for item in checklist["items"]):
            accion = "Completar perfiles"
            destino = f"/perfiles/{cliente.id_cliente}"

        item_base = _cliente_item(db, cliente)
        items.append({
            **item_base,
            "blocking_count": len(bloqueos),
            "observaciones_por_responder": obs_responder,
            "documentos_faltantes": docs_faltantes,
            "accion_sugerida": accion,
            "destino": destino,
            "checklist": checklist,
        })

    return {
        "total": len(clientes),
        "incompletos": sum(1 for item in items if item["blocking_count"] > 0),
        "observaciones_por_responder": sum(item["observaciones_por_responder"] for item in items),
        "documentos_faltantes": sum(len(item["documentos_faltantes"]) for item in items),
        "pendientes_bf": sum(1 for item in items if any(row["key"] == "beneficiarios_finales" and row["blocking"] for row in item["checklist"]["items"])),
        "items": items[:30],
    }


def dashboard_oficial(db: Session):
    resumen = resumen_cumplimiento(db)
    bandeja = bandeja_cumplimiento(db)
    auditoria_ia = db.query(Auditoria).filter(
        Auditoria.origen == "sistema",
        Auditoria.accion.ilike("AI_%")
    ).order_by(Auditoria.fecha.desc()).limit(8).all()
    rechazos = db.query(Auditoria).filter(Auditoria.accion.ilike("%RECHAZAR%")).order_by(Auditoria.fecha.desc()).limit(8).all()
    activaciones_auto = db.query(Auditoria).filter(Auditoria.accion == "ACTIVAR_CLIENTE_AUTOMATICO").count()
    pendientes_bf = db.query(BeneficiarioFinal).filter(BeneficiarioFinal.estado_validacion == "PENDIENTE").count()
    docs_observados = db.query(Documento).filter(Documento.estado.in_(["OBSERVADO", "RECHAZADO"])).count()
    screening_alertas = db.execute(text("SELECT COUNT(*) FROM screening_results WHERE resultado IN ('COINCIDENCIA_FUERTE', 'POSIBLE_COINCIDENCIA')")).scalar() or 0
    prioridades_criticas = db.execute(text("SELECT COUNT(*) FROM case_priorities WHERE nivel IN ('CRITICA', 'ALTA')")).scalar() or 0
    return {
        "resumen_cumplimiento": resumen,
        "alto_riesgo": resumen.get("ALTO_RIESGO", 0),
        "observados": resumen.get("OBSERVADOS_DOCUMENTOS", 0),
        "revision_manual": resumen.get("REVISION_OFICIAL", 0),
        "pendientes_bf": pendientes_bf,
        "documentos_observados": docs_observados,
        "activaciones_automaticas": activaciones_auto,
        "screening_alertas": screening_alertas,
        "prioridades_criticas": prioridades_criticas,
        "prioridad": bandeja[:20],
        "rechazos_recientes": [
            {
                "id_auditoria": str(item.id_auditoria),
                "cliente_id": str(item.cliente_id) if item.cliente_id else None,
                "accion": item.accion,
                "valor_nuevo": item.valor_nuevo,
                "fecha": item.fecha.isoformat() if item.fecha else None,
            }
            for item in rechazos
        ],
        "auditoria_ia": [
            {
                "id_auditoria": str(item.id_auditoria),
                "cliente_id": str(item.cliente_id) if item.cliente_id else None,
                "accion": item.accion,
                "severidad": item.severidad,
                "detalle": item.detalle,
                "fecha": item.fecha.isoformat() if item.fecha else None,
            }
            for item in auditoria_ia
        ],
    }
