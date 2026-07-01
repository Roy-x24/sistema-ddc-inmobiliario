from app.models.auditoria import Auditoria
from app.models.usuario import Usuario
from app.services.dashboard_service import dashboard_empleado, dashboard_oficial


def _notif(id_notificacion, titulo, mensaje, prioridad="MEDIA", destino="/dashboard", tipo="operativa", entidad_id=None):
    return {
        "id": id_notificacion,
        "titulo": titulo,
        "mensaje": mensaje,
        "prioridad": prioridad,
        "tipo": tipo,
        "destino": destino,
        "entidad_id": entidad_id,
    }


def notificaciones_empleado(db, usuario: Usuario):
    data = dashboard_empleado(db, usuario.correo)
    avisos = []

    for item in data.get("items", []):
        cliente_id = item["id_cliente"]
        nombre = item.get("nombre") or "Expediente"
        if item.get("observaciones_por_responder", 0) > 0:
            avisos.append(_notif(
                f"obs-{cliente_id}",
                "Observacion pendiente de respuesta",
                f"{nombre} tiene observaciones abiertas que requieren respuesta del empleado.",
                "ALTA",
                f"/observaciones/{cliente_id}",
                "observacion",
                cliente_id,
            ))
        elif item.get("documentos_faltantes"):
            faltantes = ", ".join(item["documentos_faltantes"][:2])
            avisos.append(_notif(
                f"docs-{cliente_id}",
                "Documentos obligatorios faltantes",
                f"{nombre} necesita cargar: {faltantes}.",
                "MEDIA",
                f"/documentos/{cliente_id}",
                "documentos",
                cliente_id,
            ))
        elif item.get("blocking_count", 0) > 0:
            avisos.append(_notif(
                f"bloqueos-{cliente_id}",
                "Expediente incompleto",
                f"{nombre} aun tiene {item['blocking_count']} bloqueo(s) antes de revision.",
                "MEDIA",
                item.get("destino") or f"/expediente/{cliente_id}",
                "checklist",
                cliente_id,
            ))

    return sorted(avisos, key=lambda item: {"ALTA": 0, "MEDIA": 1, "BAJA": 2}.get(item["prioridad"], 1))[:50]


def notificaciones_oficial(db):
    data = dashboard_oficial(db)
    avisos = []

    if data.get("alto_riesgo", 0):
        avisos.append(_notif(
            "alto-riesgo",
            "Casos de alto riesgo por revisar",
            f"{data['alto_riesgo']} expediente(s) requieren criterio reforzado del Oficial.",
            "ALTA",
            "/cumplimiento",
            "riesgo",
        ))
    if data.get("observados", 0):
        avisos.append(_notif(
            "observados",
            "Excepciones documentales u observaciones",
            f"{data['observados']} expediente(s) tienen observaciones o documentos observados/rechazados.",
            "ALTA",
            "/cumplimiento",
            "observacion",
        ))
    if data.get("pendientes_bf", 0):
        avisos.append(_notif(
            "bf-pendientes",
            "Beneficiarios finales pendientes",
            f"{data['pendientes_bf']} beneficiario(s) final(es) esperan validacion.",
            "MEDIA",
            "/beneficiarios",
            "beneficiarios",
        ))
    if data.get("screening_alertas", 0):
        avisos.append(_notif(
            "screening-alertas",
            "Coincidencias PEP/sanciones",
            f"{data['screening_alertas']} coincidencia(s) requieren revision manual.",
            "ALTA",
            "/cumplimiento",
            "screening",
        ))

    for item in data.get("prioridad", [])[:8]:
        cliente_id = item["id_cliente"]
        avisos.append(_notif(
            f"cola-{cliente_id}",
            item.get("accion_sugerida") or "Revisar expediente",
            f"{item.get('nombre')} esta en cola {str(item.get('cola', '')).replace('_', ' ')}: {item.get('motivo_principal')}",
            "ALTA" if item.get("cola") in ("ALTO_RIESGO", "OBSERVADOS_DOCUMENTOS") else "MEDIA",
            f"/expediente/{cliente_id}",
            "cola",
            cliente_id,
        ))

    return avisos[:50]


def notificaciones_auditor(db):
    eventos = db.query(Auditoria).order_by(Auditoria.fecha.desc()).limit(12).all()
    return [
        _notif(
            f"audit-{item.id_auditoria}",
            "Evento auditable reciente",
            f"{item.usuario} ejecuto {item.accion.replace('_', ' ')}.",
            "BAJA",
            "/auditoria",
            "auditoria",
            str(item.cliente_id) if item.cliente_id else None,
        )
        for item in eventos
    ]


def obtener_notificaciones(db, usuario: Usuario):
    if usuario.rol == "empleado":
        return notificaciones_empleado(db, usuario)
    if usuario.rol in ("oficial_cumplimiento", "admin"):
        return notificaciones_oficial(db)
    if usuario.rol == "auditor":
        return notificaciones_auditor(db)
    return []
