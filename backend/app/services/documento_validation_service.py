from dataclasses import dataclass
from sqlalchemy.orm import Session
from app.models.beneficiario_final import BeneficiarioFinal
from app.models.cliente import Cliente
from app.models.documento import Documento
from app.models.documento_validacion import DocumentoValidacion
from app.models.persona_juridica import PersonaJuridica
from app.models.persona_natural import PersonaNatural
from app.services.auditoria_service import registrar_auditoria
from app.services.estado_service import obtener_tipos_obligatorios

VERSION_REGLA_DOCUMENTAL = "documental-v1"


@dataclass
class ResultadoRegla:
    regla: str
    resultado: str
    confianza: str
    mensaje: str
    datos_extraidos: dict


def _datos_cliente(db: Session, cliente: Cliente) -> dict:
    if cliente.tipo_cliente == "NATURAL":
        pn = db.query(PersonaNatural).filter(PersonaNatural.id == cliente.id_cliente).first()
        if not pn:
            return {}
        return {
            "nombre": f"{pn.nombres} {pn.apellidos}",
            "identificacion": pn.numero_documento,
            "pais": pn.pais_residencia,
            "monto_estimado": float(pn.monto_estimado or 0),
        }

    pj = db.query(PersonaJuridica).filter(PersonaJuridica.id == cliente.id_cliente).first()
    if not pj:
        return {}
    bf = db.query(BeneficiarioFinal).filter(BeneficiarioFinal.id_cliente == cliente.id_cliente).first()
    return {
        "nombre": pj.razon_social,
        "identificacion": pj.ruc,
        "pais": pj.pais_constitucion,
        "monto_estimado": float(pj.monto_estimado or 0),
        "beneficiario_final": bf.nombre_completo if bf else None,
    }


def _simular_extraccion(db: Session, cliente: Cliente, documento: Documento) -> dict:
    datos = _datos_cliente(db, cliente)
    return {
        "tipo_detectado": documento.tipo_documento,
        "nombre_detectado": datos.get("nombre"),
        "identificacion_detectada": datos.get("identificacion"),
        "pais_detectado": datos.get("pais"),
        "monto_detectado": datos.get("monto_estimado"),
        "archivo": documento.nombre_archivo,
        "simulado": True,
    }


def _resultado(regla, resultado, confianza, mensaje, datos):
    return ResultadoRegla(regla, resultado, confianza, mensaje, datos)


def evaluar_documento(db: Session, documento: Documento, ejecutado_por: str = "sistema") -> list[DocumentoValidacion]:
    cliente = db.query(Cliente).filter(Cliente.id_cliente == documento.id_cliente, Cliente.eliminado == False).first()
    if not cliente:
        return []

    datos = _simular_extraccion(db, cliente, documento)
    obligatorios = obtener_tipos_obligatorios(cliente.tipo_cliente)
    duplicados = db.query(Documento).filter(
        Documento.hash_sha256 == documento.hash_sha256,
        Documento.id_documento != documento.id_documento
    ).count()

    reglas = [
        _resultado(
            "FORMATO_PERMITIDO",
            "APROBADO" if documento.formato in {"PDF", "JPG", "PNG"} else "RECHAZADO",
            "ALTA",
            "Formato permitido" if documento.formato in {"PDF", "JPG", "PNG"} else "Formato no permitido",
            datos,
        ),
        _resultado(
            "TAMANO_MAXIMO",
            "APROBADO" if (documento.tamano_bytes or 0) <= 10 * 1024 * 1024 else "RECHAZADO",
            "ALTA",
            "Tamano dentro del limite" if (documento.tamano_bytes or 0) <= 10 * 1024 * 1024 else "Archivo excede 10 MB",
            datos,
        ),
        _resultado(
            "HASH_DUPLICADO",
            "OBSERVADO" if duplicados else "APROBADO",
            "ALTA",
            "Hash repetido en otro expediente" if duplicados else "No se detectaron duplicados por hash",
            datos,
        ),
        _resultado(
            "TIPO_DOCUMENTAL_ESPERADO",
            "APROBADO" if datos["tipo_detectado"] == documento.tipo_documento else "OBSERVADO",
            "MEDIA",
            "Tipo documental coincide con la clasificacion" if datos["tipo_detectado"] == documento.tipo_documento else "Tipo documental no coincide",
            datos,
        ),
        _resultado(
            "DOCUMENTO_OBLIGATORIO",
            "APROBADO",
            "MEDIA",
            "Documento obligatorio para este tipo de cliente" if documento.tipo_documento in obligatorios else "Documento opcional registrado para soporte del expediente",
            datos,
        ),
        _resultado(
            "COINCIDENCIA_IDENTIDAD_SIMULADA",
            "APROBADO" if datos.get("identificacion_detectada") else "OBSERVADO",
            "MEDIA",
            "La extraccion simulada coincide con los datos del expediente" if datos.get("identificacion_detectada") else "No se pudo simular coincidencia de identidad",
            datos,
        ),
    ]

    db.query(DocumentoValidacion).filter(DocumentoValidacion.id_documento == documento.id_documento).delete()
    registros = []
    for r in reglas:
        registro = DocumentoValidacion(
            id_documento=documento.id_documento,
            id_cliente=documento.id_cliente,
            regla=r.regla,
            resultado=r.resultado,
            confianza=r.confianza,
            mensaje=r.mensaje,
            datos_extraidos=r.datos_extraidos,
            ejecutado_por=ejecutado_por,
            version_regla=VERSION_REGLA_DOCUMENTAL,
        )
        db.add(registro)
        registros.append(registro)
        registrar_auditoria(
            db,
            ejecutado_por,
            "REGLA_DOCUMENTAL_EJECUTADA",
            str(documento.id_cliente),
            None,
            r.resultado,
            detalle={"documento_id": str(documento.id_documento), "regla": r.regla, "mensaje": r.mensaje, "confianza": r.confianza},
            origen="sistema" if ejecutado_por == "sistema" else "humano",
            severidad="warning" if r.resultado == "OBSERVADO" else "error" if r.resultado == "RECHAZADO" else "info",
            correlation_id=str(documento.id_documento),
            version_regla=VERSION_REGLA_DOCUMENTAL,
        )

    resultados = {r.resultado for r in reglas}
    if "RECHAZADO" in resultados:
        documento.estado = "RECHAZADO"
        documento.motivo_rechazo = "Rechazado por motor documental"
        accion = "DOCUMENTO_OBSERVADO_AUTOMATICO"
        resumen = "Documento rechazado por regla documental"
        severidad = "error"
    elif "OBSERVADO" in resultados:
        documento.estado = "OBSERVADO"
        accion = "DOCUMENTO_OBSERVADO_AUTOMATICO"
        resumen = "Documento observado por motor documental"
        severidad = "warning"
    else:
        documento.estado = "VALIDADO_AUTOMATICO"
        accion = "DOCUMENTO_VALIDADO_AUTOMATICO"
        resumen = "Documento validado automaticamente"
        severidad = "info"

    documento.confianza_validacion = "ALTA" if resultados == {"APROBADO"} else "MEDIA"
    documento.resumen_validacion = resumen
    documento.usuario_verificador = ejecutado_por
    db.commit()

    registrar_auditoria(
        db,
        ejecutado_por,
        accion,
        str(documento.id_cliente),
        "PENDIENTE_VERIFICACION",
        documento.estado,
        detalle={"documento_id": str(documento.id_documento), "resumen": resumen, "resultados": sorted(resultados)},
        origen="sistema" if ejecutado_por == "sistema" else "humano",
        severidad=severidad,
        correlation_id=str(documento.id_documento),
        version_regla=VERSION_REGLA_DOCUMENTAL,
    )
    return registros


def obtener_validaciones_documento(db: Session, documento_id: str):
    return db.query(DocumentoValidacion).filter(
        DocumentoValidacion.id_documento == documento_id
    ).order_by(DocumentoValidacion.fecha.desc()).all()
