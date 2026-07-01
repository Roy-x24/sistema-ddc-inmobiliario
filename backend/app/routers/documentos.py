from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
import hashlib
import os
import uuid as uuid_lib
from app.database import obtener_db
from app.models.documento import Documento
from app.models.cliente import Cliente
from app.schemas.documento import DocumentoResponse
from app.core.rbac import obtener_usuario_actual, requiere_rol
from app.models.usuario import Usuario
from app.services.auditoria_service import registrar_auditoria
from app.services.ai_gateway import extraer_documento
from app.services.documento_validation_service import evaluar_documento, obtener_validaciones_documento
from app.services.estado_service import DOCUMENTOS_NO_REPETIBLES, ESTADOS_DOCUMENTO_VALIDOS, intentar_activacion_automatica, verificar_documentos_para_revision
from app.schemas.documento import DocumentoValidacionResponse
from typing import List

router = APIRouter(prefix="/clientes", tags=["Documentos"])

UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _media_type_documento(doc: Documento) -> str:
    formato = (doc.formato or "").upper()
    if formato == "PDF":
        return "application/pdf"
    if formato in ["JPG", "JPEG"]:
        return "image/jpeg"
    if formato == "PNG":
        return "image/png"
    return "application/octet-stream"


def _leer_archivo_documento(archivo: UploadFile):
    extension = archivo.filename.split(".")[-1].upper()
    if extension not in ["PDF", "JPG", "JPEG", "PNG"]:
        raise HTTPException(status_code=400, detail="Formato no permitido. Usar PDF, JPG o PNG.")
    if extension == "JPEG":
        extension = "JPG"

    contenido = archivo.file.read()
    tamano = len(contenido)
    if tamano > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo excede 10 MB")

    hash_sha256 = hashlib.sha256(contenido).hexdigest()
    nombre_unico = f"{uuid_lib.uuid4()}.{extension.lower()}"
    ruta = os.path.join(UPLOAD_DIR, nombre_unico)
    with open(ruta, "wb") as f:
        f.write(contenido)
    return extension, tamano, hash_sha256, ruta


def _crear_documento(db: Session, id_cliente: str, tipo_documento: str, archivo: UploadFile) -> Documento:
    extension, tamano, hash_sha256, ruta = _leer_archivo_documento(archivo)
    doc = Documento(
        id_cliente=id_cliente,
        tipo_documento=tipo_documento,
        nombre_archivo=archivo.filename,
        ruta_archivo=ruta,
        hash_sha256=hash_sha256,
        tamano_bytes=tamano,
        formato=extension
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def _evaluar_y_sincronizar_documento(db: Session, doc: Documento, usuario_sistema: str = "sistema"):
    evaluar_documento(db, doc, usuario_sistema)
    db.refresh(doc)
    extraer_documento(db, str(doc.id_documento), usuario_sistema)
    db.refresh(doc)
    verificar_documentos_para_revision(db, str(doc.id_cliente), usuario_sistema)
    decision = intentar_activacion_automatica(db, str(doc.id_cliente), usuario_sistema)
    return decision


@router.post("/{id}/documentos")
def adjuntar_documento(
    id: str,
    tipo_documento: str = Form(...),
    archivo: UploadFile = File(...),
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("adjuntar_documentos"))
):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == id, Cliente.eliminado == False).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    tipo_documento = tipo_documento.upper()
    if tipo_documento in DOCUMENTOS_NO_REPETIBLES:
        existente_cubierto = db.query(Documento).filter(
            Documento.id_cliente == id,
            Documento.tipo_documento == tipo_documento,
            Documento.estado.in_(ESTADOS_DOCUMENTO_VALIDOS)
        ).first()
        if existente_cubierto:
            raise HTTPException(
                status_code=409,
                detail="Este requisito documental ya esta cubierto. Usa un flujo de reemplazo auditado para cambiarlo."
            )

    doc = _crear_documento(db, id, tipo_documento, archivo)

    registrar_auditoria(db, usuario.correo, "ADJUNTAR_DOCUMENTO", id, None, doc.tipo_documento)
    decision = _evaluar_y_sincronizar_documento(db, doc, "sistema")
    return {"id_documento": str(doc.id_documento), "estado": doc.estado, "decision_automatica": decision}


@router.post("/documentos/{doc_id}/reemplazar")
def reemplazar_documento(
    doc_id: str,
    motivo: str = Form(...),
    archivo: UploadFile = File(...),
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("adjuntar_documentos"))
):
    doc_anterior = db.query(Documento).filter(Documento.id_documento == doc_id).first()
    if not doc_anterior:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    if doc_anterior.tipo_documento not in DOCUMENTOS_NO_REPETIBLES:
        raise HTTPException(status_code=400, detail="Solo los requisitos no repetibles usan reemplazo auditado")
    if not motivo or not motivo.strip():
        raise HTTPException(status_code=400, detail="El motivo de reemplazo es obligatorio")

    cliente = db.query(Cliente).filter(Cliente.id_cliente == doc_anterior.id_cliente, Cliente.eliminado == False).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    estado_anterior = doc_anterior.estado
    doc_anterior.estado = "REEMPLAZADO"
    doc_anterior.motivo_rechazo = f"Reemplazado: {motivo.strip()}"
    doc_anterior.usuario_verificador = usuario.correo
    doc_anterior.fecha_verificacion = func.now()
    db.commit()

    doc_nuevo = _crear_documento(db, str(doc_anterior.id_cliente), doc_anterior.tipo_documento, archivo)
    registrar_auditoria(
        db,
        usuario.correo,
        "REEMPLAZAR_DOCUMENTO",
        str(doc_anterior.id_cliente),
        f"{doc_anterior.tipo_documento}:{estado_anterior}",
        f"{doc_nuevo.tipo_documento}:PENDIENTE_VERIFICACION",
        detalle={
            "documento_anterior": str(doc_anterior.id_documento),
            "documento_nuevo": str(doc_nuevo.id_documento),
            "motivo": motivo.strip(),
        },
        origen="usuario",
        severidad="warning",
    )
    decision = _evaluar_y_sincronizar_documento(db, doc_nuevo, "sistema")
    return {
        "id_documento": str(doc_nuevo.id_documento),
        "documento_reemplazado": str(doc_anterior.id_documento),
        "estado": doc_nuevo.estado,
        "decision_automatica": decision,
    }


@router.get("/{id}/documentos", response_model=List[DocumentoResponse])
def listar_documentos(
    id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    docs = db.query(Documento).filter(Documento.id_cliente == id).all()
    return docs


@router.get("/documentos/{doc_id}/descargar")
def descargar_documento(
    doc_id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    doc = db.query(Documento).filter(Documento.id_documento == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    registrar_auditoria(db, usuario.correo, "DESCARGAR_DOCUMENTO", str(doc.id_cliente))
    return FileResponse(path=doc.ruta_archivo, filename=doc.nombre_archivo, media_type="application/octet-stream")


@router.get("/documentos/{doc_id}/ver")
def ver_documento(
    doc_id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    doc = db.query(Documento).filter(Documento.id_documento == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    if not os.path.exists(doc.ruta_archivo):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    registrar_auditoria(db, usuario.correo, "VISUALIZAR_DOCUMENTO", str(doc.id_cliente))
    return FileResponse(
        path=doc.ruta_archivo,
        media_type=_media_type_documento(doc),
        headers={"Content-Disposition": f'inline; filename="{doc.nombre_archivo}"'}
    )


@router.get("/documentos/{doc_id}/validaciones", response_model=List[DocumentoValidacionResponse])
def validaciones_documento(
    doc_id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    return obtener_validaciones_documento(db, doc_id)


@router.patch("/documentos/{doc_id}/verificar")
def verificar_documento(
    doc_id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("verificar_documentos"))
):
    doc = db.query(Documento).filter(Documento.id_documento == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    estado_anterior = doc.estado
    doc.estado = "VERIFICADO_MANUAL"
    doc.confianza_validacion = "MANUAL"
    doc.resumen_validacion = "Documento verificado manualmente por Oficial"
    doc.fecha_verificacion = func.now()
    doc.usuario_verificador = usuario.correo
    db.commit()

    registrar_auditoria(db, usuario.correo, "VERIFICAR_DOCUMENTO", str(doc.id_cliente), estado_anterior, "VERIFICADO_MANUAL")
    verificar_documentos_para_revision(db, str(doc.id_cliente), usuario.correo)
    decision = intentar_activacion_automatica(db, str(doc.id_cliente), "sistema")

    return {"mensaje": "Documento verificado", "decision_automatica": decision}


@router.patch("/documentos/{doc_id}/rechazar")
def rechazar_documento(
    doc_id: str,
    motivo: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("rechazar_documentos"))
):
    doc = db.query(Documento).filter(Documento.id_documento == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    if not motivo or not motivo.strip():
        raise HTTPException(status_code=400, detail="El motivo de rechazo es obligatorio")

    estado_anterior = doc.estado
    doc.estado = "RECHAZADO"
    doc.motivo_rechazo = motivo
    doc.usuario_verificador = usuario.correo
    db.commit()

    registrar_auditoria(db, usuario.correo, "RECHAZAR_DOCUMENTO", str(doc.id_cliente), estado_anterior, "RECHAZADO")
    return {"mensaje": "Documento rechazado"}
