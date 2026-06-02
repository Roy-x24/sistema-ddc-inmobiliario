import os
import uuid as uuid_lib
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import obtener_db
from app.models.documento import Documento
from app.models.cliente import Cliente
from app.schemas.documento import DocumentoResponse
from app.routers.auth import obtener_usuario_actual
from app.models.usuario import Usuario
from app.services.auditoria_service import registrar_auditoria
from app.services.estado_service import verificar_documentos_para_revision
from typing import List

router = APIRouter(prefix="/clientes", tags=["Documentos"])

UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def verificar_rol_empleado(usuario: Usuario):
    if usuario.rol not in ("empleado", "administrador"):
        raise HTTPException(status_code=403, detail="Solo empleados pueden realizar esta acción")


def verificar_rol_oficial(usuario: Usuario):
    if usuario.rol not in ("oficial_cumplimiento", "administrador"):
        raise HTTPException(status_code=403, detail="Solo el Oficial de Cumplimiento puede realizar esta acción")


@router.post("/{id}/documentos")
def adjuntar_documento(
    id: str,
    tipo_documento: str = Form(...),
    archivo: UploadFile = File(...),
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(obtener_usuario_actual)
):
    verificar_rol_empleado(usuario)

    cliente = db.query(Cliente).filter(Cliente.id_cliente == id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    extension = archivo.filename.split(".")[-1].upper()
    if extension not in ["PDF", "JPG", "JPEG", "PNG"]:
        raise HTTPException(status_code=400, detail="Formato no permitido. Usar PDF, JPG o PNG.")

    archivo.file.seek(0, os.SEEK_END)
    tamano = archivo.file.tell()
    archivo.file.seek(0)
    if tamano > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo excede 10 MB")

    nombre_unico = f"{uuid_lib.uuid4()}.{extension.lower()}"
    ruta = os.path.join(UPLOAD_DIR, nombre_unico)
    with open(ruta, "wb") as f:
        f.write(archivo.file.read())

    doc = Documento(
        id_cliente=id,
        tipo_documento=tipo_documento,
        nombre_archivo=archivo.filename,
        ruta_archivo=ruta,
        tamano_bytes=tamano,
        formato=extension
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    registrar_auditoria(db, usuario.correo, "ADJUNTAR_DOCUMENTO", id, None, doc.tipo_documento)

    return {"id_documento": str(doc.id_documento), "estado": doc.estado}


@router.get("/{id}/documentos", response_model=List[DocumentoResponse])
def listar_documentos(id: str, db: Session = Depends(obtener_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    docs = db.query(Documento).filter(Documento.id_cliente == id).all()
    return docs


@router.patch("/documentos/{doc_id}/verificar")
def verificar_documento(doc_id: str, db: Session = Depends(obtener_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    verificar_rol_oficial(usuario)

    doc = db.query(Documento).filter(Documento.id_documento == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    estado_anterior = doc.estado
    doc.estado = "VERIFICADO"
    doc.fecha_verificacion = func.now()
    doc.usuario_verificador = usuario.correo
    db.commit()

    registrar_auditoria(db, usuario.correo, "VERIFICAR_DOCUMENTO", str(doc.id_cliente), estado_anterior, "VERIFICADO")
    verificar_documentos_para_revision(db, str(doc.id_cliente), usuario.correo)

    return {"mensaje": "Documento verificado"}


@router.patch("/documentos/{doc_id}/rechazar")
def rechazar_documento(doc_id: str, motivo: str, db: Session = Depends(obtener_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    verificar_rol_oficial(usuario)

    doc = db.query(Documento).filter(Documento.id_documento == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    estado_anterior = doc.estado
    doc.estado = "RECHAZADO"
    doc.motivo_rechazo = motivo
    doc.usuario_verificador = usuario.correo
    db.commit()

    registrar_auditoria(db, usuario.correo, "RECHAZAR_DOCUMENTO", str(doc.id_cliente), estado_anterior, "RECHAZADO")

    return {"mensaje": "Documento rechazado"}
