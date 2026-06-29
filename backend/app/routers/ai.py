from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.rbac import requiere_rol
from app.database import obtener_db
from app.models.ai_model_run import AIModelRun
from app.models.usuario import Usuario
from app.services.ai_gateway import (
    extraer_documento,
    obtener_extraccion_documento,
    resumen_expediente,
    semantic_search_context,
)

router = APIRouter(prefix="/ai", tags=["AI/OCR"])


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


@router.post("/clientes/{id}/buscar-contexto")
def buscar_contexto_cliente(
    id: str,
    query: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    return {"query": query, "results": semantic_search_context(db, id, query)}


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
