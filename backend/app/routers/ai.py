from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
import re
import tempfile
from app.core.rbac import requiere_rol
from app.database import obtener_db
from app.models.ai_model_run import AIModelRun
from app.models.usuario import Usuario
from app.services.auditoria_service import registrar_auditoria
from app.services.ai_gateway import (
    calcular_prioridad_cliente,
    extraer_documento,
    obtener_extraccion_documento,
    resumen_expediente,
    screening_cliente,
    semantic_search_context,
    sugerir_beneficiarios_finales,
    sugerir_observacion,
)

router = APIRouter(prefix="/ai", tags=["AI/OCR"])


class ContextSearchRequest(BaseModel):
    query: str


def _extract_text_from_upload(file_path: str, filename: str) -> tuple[str, list[str]]:
    errors = []
    text = ""
    ext = os.path.splitext(filename.lower())[1]
    try:
        if ext == ".pdf":
            try:
                import fitz  # type: ignore
                with fitz.open(file_path) as pdf:
                    text = "\n".join(page.get_text("text") for page in pdf)
            except Exception:
                try:
                    import pdfplumber  # type: ignore
                    with pdfplumber.open(file_path) as pdf:
                        text = "\n".join((page.extract_text() or "") for page in pdf.pages)
                except Exception as exc:
                    errors.append(f"pdf_ocr_error:{type(exc).__name__}")
        else:
            try:
                from PIL import Image  # type: ignore
                import pytesseract  # type: ignore
                text = pytesseract.image_to_string(Image.open(file_path), lang="spa+eng")
            except Exception as exc:
                errors.append(f"image_ocr_error:{type(exc).__name__}")
    except Exception as exc:
        errors.append(f"ocr_error:{type(exc).__name__}")
    if not text.strip():
        text = filename
        errors.append("sin_texto_extraido")
    return text[:12000], errors


def _first(patterns: list[str], text: str):
    for pattern in patterns:
        match = re.search(pattern, text, re.I | re.M)
        if match:
            return (match.group(1) if match.groups() else match.group(0)).strip(" :-\n\t")
    return None


def _prefill_payload(tipo: str, text: str, errors: list[str]):
    cedula = _first([r"\b(\d{1,2}-\d{2,4}-\d{2,6})\b", r"\b(PA\d{5,})\b"], text)
    ruc = _first([r"\b(\d{6,12}-\d{1,4}-\d{4})\b", r"RUC[:\s]+([A-Z0-9\-]+)"], text)
    email = _first([r"([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})"], text)
    phone = _first([r"\b(?:\+?507[-\s]?)?([2368]\d{3}[-\s]?\d{4})\b"], text)
    country = _first([r"Pais(?: de residencia| de constitucion)?[:\s]+([A-Za-zÁÉÍÓÚáéíóúñÑ ]{3,})", r"Nacionalidad[:\s]+([A-Za-zÁÉÍÓÚáéíóúñÑ ]{3,})"], text)
    amount = _first([r"(?:B/\.|USD|\$)\s?(\d{2,3}(?:,\d{3})+(?:\.\d{2})?|\d{4,})"], text)
    name = _first([r"Nombre(?: completo)?[:\s]+([A-Za-zÁÉÍÓÚáéíóúñÑ ]{5,})", r"Razon social[:\s]+([A-Za-zÁÉÍÓÚáéíóúñÑ0-9 .,]{5,})"], text)
    fields = {}
    if tipo == "natural":
        if name:
            parts = name.split()
            fields["nombres"] = " ".join(parts[:2])
            fields["apellidos"] = " ".join(parts[2:]) if len(parts) > 2 else ""
        if cedula:
            fields["numero_documento"] = cedula
            fields["tipo_documento"] = "CEDULA" if "-" in cedula else "PASAPORTE"
        if country:
            fields["nacionalidad"] = country
            fields["pais_residencia"] = country
        if email:
            fields["correo"] = email
        if phone:
            fields["telefono"] = re.search(r"([2368]\d{3}[-\s]?\d{4})", phone).group(1) if re.search(r"([2368]\d{3}[-\s]?\d{4})", phone) else phone
        if amount:
            fields["monto_estimado"] = amount.replace(",", "")
    else:
        if name:
            fields["razon_social"] = name
        if ruc:
            fields["ruc"] = ruc
        if country:
            fields["pais_constitucion"] = country
        if email:
            fields["correo"] = email
        if phone:
            fields["telefono"] = re.search(r"([2368]\d{3}[-\s]?\d{4})", phone).group(1) if re.search(r"([2368]\d{3}[-\s]?\d{4})", phone) else phone
        if amount:
            fields["monto_estimado"] = amount.replace(",", "")
    confidence = 0.72 if len(fields) >= 3 and not errors else 0.45 if fields else 0.25
    return {
        "tipo": tipo,
        "fields": fields,
        "confidence": confidence,
        "requires_human_confirmation": True,
        "evidence": [{"source": "uploaded_document", "excerpt": text[:400]}],
        "errors": errors,
        "nota_guardrail": "Datos detectados por OCR. El empleado debe revisarlos antes de usarlos.",
    }


@router.post("/prellenar/{tipo}")
async def prellenar_desde_documento(
    tipo: str,
    archivo: UploadFile = File(...),
    tipo_documento_declarado: str = Form(""),
    usuario: Usuario = Depends(requiere_rol("registrar_cliente"))
):
    if tipo not in {"natural", "juridica"}:
        raise HTTPException(status_code=400, detail="Tipo debe ser natural o juridica")
    suffix = os.path.splitext(archivo.filename or "documento")[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await archivo.read())
        temp_path = tmp.name
    try:
        text, errors = _extract_text_from_upload(temp_path, archivo.filename or "documento")
        payload = _prefill_payload(tipo, text, errors)
        payload["tipo_documento_declarado"] = tipo_documento_declarado
        return payload
    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass


@router.post("/documentos/{doc_id}/extraer")
def extraer_documento_ai(
    doc_id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    resultado = extraer_documento(db, doc_id, usuario.correo)
    if resultado.get("error"):
        raise HTTPException(status_code=404, detail=resultado["error"])
    return resultado


@router.get("/documentos/{doc_id}/extraccion")
def obtener_extraccion_ai(
    doc_id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    resultado = obtener_extraccion_documento(db, doc_id)
    if not resultado:
        raise HTTPException(status_code=404, detail="Extraccion IA no encontrada")
    return resultado


@router.post("/clientes/{id}/resumen")
def generar_resumen_cliente(
    id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    resultado = resumen_expediente(db, id, usuario.correo)
    if not resultado:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return resultado


@router.post("/clientes/{id}/resumen-operativo")
def generar_resumen_operativo_cliente(
    id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    resultado = resumen_expediente(db, id, usuario.correo)
    if not resultado:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return resultado


@router.post("/clientes/{id}/observacion-sugerida")
def generar_observacion_sugerida(
    id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    resultado = sugerir_observacion(db, id, usuario.correo)
    if not resultado:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return resultado


@router.post("/clientes/{id}/beneficiarios-sugeridos")
def generar_beneficiarios_sugeridos(
    id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    resultado = sugerir_beneficiarios_finales(db, id, usuario.correo)
    if not resultado:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return resultado


@router.post("/clientes/{id}/screening")
def ejecutar_screening_cliente(
    id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    resultado = screening_cliente(db, id, usuario.correo)
    if not resultado:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return resultado


@router.post("/clientes/{id}/prioridad")
def calcular_prioridad(
    id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    resultado = calcular_prioridad_cliente(db, id, usuario.correo)
    if not resultado:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return resultado


@router.post("/clientes/{id}/buscar-contexto")
def buscar_contexto_cliente(
    id: str,
    datos: ContextSearchRequest,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    query = datos.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="La busqueda no puede estar vacia")
    results = semantic_search_context(db, id, query)
    registrar_auditoria(
        db,
        usuario.correo,
        "AI_CONTEXT_SEARCH",
        id,
        None,
        "EJECUTADA",
        detalle={"query": query, "resultados": len(results)},
        origen="sistema",
        severidad="info",
        correlation_id=id,
        version_regla="semantic-context-v1",
    )
    return {"query": query, "results": results}


@router.get("/model-runs")
def listar_model_runs(
    cliente_id: str = "",
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("ver_auditoria"))
):
    query = db.query(AIModelRun)
    if cliente_id:
        query = query.filter(AIModelRun.id_cliente == cliente_id)
    runs = query.order_by(AIModelRun.created_at.desc()).limit(100).all()
    return [
        {
            "id_run": str(run.id_run),
            "id_cliente": str(run.id_cliente) if run.id_cliente else None,
            "id_documento": str(run.id_documento) if run.id_documento else None,
            "provider": run.provider,
            "model": run.model,
            "prompt_version": run.prompt_version,
            "input_hash": run.input_hash,
            "output_schema_version": run.output_schema_version,
            "confidence": float(run.confidence or 0),
            "status": run.status,
            "purpose": run.purpose,
            "response_summary": run.response_summary,
            "errors": run.errors or [],
            "created_at": run.created_at.isoformat() if run.created_at else None,
        }
        for run in runs
    ]
