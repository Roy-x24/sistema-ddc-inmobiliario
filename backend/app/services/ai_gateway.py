import hashlib
import json
import math
import mimetypes
import os
import re
from typing import Any
import base64
import requests
from difflib import SequenceMatcher
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_embedding import AuditEmbedding, DocumentEmbedding
from app.models.ai_extraction import AIExtraction
from app.models.ai_model_run import AIModelRun
from app.models.auditoria import Auditoria
from app.models.beneficiario_final import BeneficiarioFinal
from app.models.cliente import Cliente
from app.models.documento import Documento
from app.models.observacion import Observacion
from app.models.persona_juridica import PersonaJuridica
from app.models.persona_natural import PersonaNatural
from app.services.auditoria_service import registrar_auditoria
from app.services.checklist_service import checklist_expediente
from app.services.estado_service import obtener_tipos_obligatorios

PROMPT_VERSION = "ddc-ai-v1"
SCHEMA_VERSION = "ai-extraction-v1"


def _runtime_config(db: Session | None = None) -> dict[str, Any]:
    config = {
        "ai_mode": settings.AI_MODE,
        "ocr_provider": settings.OCR_PROVIDER,
        "llm_provider": settings.LLM_PROVIDER,
        "embeddings_provider": settings.EMBEDDINGS_PROVIDER,
        "ai_min_confidence": settings.AI_MIN_CONFIDENCE,
        "groq_model": settings.GROQ_MODEL,
        "groq_vision_model": settings.GROQ_VISION_MODEL,
        "google_model": settings.GOOGLE_MODEL,
        "google_embedding_model": settings.GOOGLE_EMBEDDING_MODEL,
        "ollama_base_url": settings.OLLAMA_BASE_URL,
        "ollama_llm_model": settings.OLLAMA_LLM_MODEL,
        "ollama_embedding_model": settings.OLLAMA_EMBEDDING_MODEL,
    }
    if not db:
        return config
    try:
        row = db.execute(text("SELECT value FROM ai_runtime_settings WHERE key = 'active'")).mappings().first()
        if row and row["value"]:
            config.update(row["value"])
    except Exception:
        pass
    return config


class AISuggestion(BaseModel):
    action: str = Field(pattern="^(APROBAR|OBSERVAR|RECHAZAR|REVISAR)$")
    reason: str
    confidence: float = Field(ge=0, le=1)


class ExtractionPayload(BaseModel):
    provider: str
    model: str
    prompt_version: str
    input_hash: str
    output_schema_version: str
    confidence: float = Field(ge=0, le=1)
    fields_extracted: dict[str, Any]
    evidence: list[dict[str, Any]] = []
    decision_suggestion: AISuggestion
    requires_human_review: bool
    errors: list[str] = []


def _sha256(value: str | bytes) -> str:
    if isinstance(value, str):
        value = value.encode("utf-8")
    return hashlib.sha256(value).hexdigest()


def _cliente_detalle(db: Session, cliente: Cliente) -> dict[str, Any]:
    if cliente.tipo_cliente == "NATURAL":
        pn = db.query(PersonaNatural).filter(PersonaNatural.id == cliente.id_cliente).first()
        if not pn:
            return {}
        return {
            "nombre": f"{pn.nombres} {pn.apellidos}",
            "identificacion": pn.numero_documento,
            "pais": pn.pais_residencia,
            "monto": float(pn.monto_estimado or 0),
            "correo": pn.correo,
            "telefono": pn.telefono,
        }

    pj = db.query(PersonaJuridica).filter(PersonaJuridica.id == cliente.id_cliente).first()
    if not pj:
        return {}
    bf = db.query(BeneficiarioFinal).filter(BeneficiarioFinal.id_cliente == cliente.id_cliente).all()
    return {
        "nombre": pj.razon_social,
        "identificacion": pj.ruc,
        "pais": pj.pais_constitucion,
        "monto": float(pj.monto_estimado or 0),
        "correo": pj.correo,
        "telefono": pj.telefono,
        "beneficiarios": [
            {
                "nombre": item.nombre_completo,
                "documento": item.numero_documento,
                "porcentaje": float(item.porcentaje_participacion or 0),
                "pep": bool(item.es_pep),
            }
            for item in bf
        ],
    }


def _extract_text_local(documento: Documento) -> tuple[str, list[str]]:
    errors = []
    ruta = documento.ruta_archivo
    texto = ""

    if not ruta or not os.path.exists(ruta):
        return documento.nombre_archivo or "", ["archivo_no_disponible_para_ocr"]

    try:
        if documento.formato == "PDF":
            try:
                import fitz  # type: ignore
                with fitz.open(ruta) as pdf:
                    texto = "\n".join(page.get_text("text") for page in pdf)
            except Exception:
                try:
                    import pdfplumber  # type: ignore
                    with pdfplumber.open(ruta) as pdf:
                        texto = "\n".join((page.extract_text() or "") for page in pdf.pages)
                except Exception as exc:
                    errors.append(f"pdf_ocr_no_disponible:{type(exc).__name__}")
        else:
            try:
                from PIL import Image  # type: ignore
                import pytesseract  # type: ignore
                texto = pytesseract.image_to_string(Image.open(ruta), lang="spa+eng")
            except Exception as exc:
                errors.append(f"image_ocr_no_disponible:{type(exc).__name__}")
    except Exception as exc:
        errors.append(f"ocr_error:{type(exc).__name__}")

    if not texto.strip():
        texto = documento.nombre_archivo or ""
        errors.append("ocr_sin_texto_extraido")
    return texto[:12000], errors


def _file_as_data_url(path: str) -> tuple[str, str | None]:
    mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
    with open(path, "rb") as file:
        encoded = base64.b64encode(file.read()).decode("utf-8")
    return f"data:{mime};base64,{encoded}", mime


def _json_from_text(value: str) -> dict[str, Any]:
    value = value.strip()
    if value.startswith("```"):
        value = re.sub(r"^```(?:json)?", "", value).strip()
        value = re.sub(r"```$", "", value).strip()
    try:
        return json.loads(value)
    except Exception:
        match = re.search(r"\{.*\}", value, re.S)
        if match:
            return json.loads(match.group(0))
    raise ValueError("respuesta_no_json")


def _document_prompt() -> str:
    return (
        "Eres un extractor OCR para KYC inmobiliario panameno. "
        "Devuelve SOLO JSON con esta forma: "
        "{\"text\":\"texto extraido\", \"fields\":{\"nombre\":null,\"identificacion\":null,\"pais\":null,\"monto\":null}, "
        "\"document_type_detected\":null, \"confidence\":0.0, \"errors\":[]}. "
        "No apruebes ni rechaces. Solo extrae datos observables."
    )


def _extract_text_google(documento: Documento, cfg: dict[str, Any]) -> tuple[str, list[str], dict[str, Any]]:
    if not settings.GOOGLE_API_KEY:
        return documento.nombre_archivo or "", ["google_api_key_faltante"], {}
    if not documento.ruta_archivo or not os.path.exists(documento.ruta_archivo):
        return documento.nombre_archivo or "", ["archivo_no_disponible_para_google"], {}

    data_url, mime = _file_as_data_url(documento.ruta_archivo)
    raw_base64 = data_url.split(",", 1)[1]
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{cfg.get('google_model')}:generateContent?key={settings.GOOGLE_API_KEY}"
    payload = {
        "generationConfig": {"temperature": 0, "response_mime_type": "application/json"},
        "contents": [{
            "role": "user",
            "parts": [
                {"text": _document_prompt()},
                {"inline_data": {"mime_type": mime, "data": raw_base64}},
            ],
        }],
    }
    try:
        res = requests.post(url, json=payload, timeout=45)
        res.raise_for_status()
        text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
        parsed = _json_from_text(text)
        return (parsed.get("text") or documento.nombre_archivo or "")[:12000], parsed.get("errors") or [], parsed
    except Exception as exc:
        return documento.nombre_archivo or "", [f"google_ocr_error:{type(exc).__name__}"], {}


def _extract_text_groq_vision(documento: Documento, cfg: dict[str, Any]) -> tuple[str, list[str], dict[str, Any]]:
    if not settings.GROQ_API_KEY:
        return documento.nombre_archivo or "", ["groq_api_key_faltante"], {}
    if not documento.ruta_archivo or not os.path.exists(documento.ruta_archivo):
        return documento.nombre_archivo or "", ["archivo_no_disponible_para_groq"], {}
    if documento.formato == "PDF":
        return documento.nombre_archivo or "", ["groq_vision_pdf_no_soportado_en_demo"], {}

    data_url, _ = _file_as_data_url(documento.ruta_archivo)
    payload = {
        "model": cfg.get("groq_vision_model"),
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": _document_prompt()},
                {"type": "image_url", "image_url": {"url": data_url}},
            ],
        }],
    }
    headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
    try:
        res = requests.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers, timeout=45)
        res.raise_for_status()
        text = res.json()["choices"][0]["message"]["content"]
        parsed = _json_from_text(text)
        return (parsed.get("text") or documento.nombre_archivo or "")[:12000], parsed.get("errors") or [], parsed
    except Exception as exc:
        return documento.nombre_archivo or "", [f"groq_vision_error:{type(exc).__name__}"], {}


def _extract_text_for_provider(documento: Documento, cfg: dict[str, Any]) -> tuple[str, list[str], dict[str, Any]]:
    provider = cfg.get("ocr_provider")
    if provider == "local":
        text, errors = _extract_text_local(documento)
        return text, errors, {}
    if provider in {"google", "google_document_ai", "gemini"}:
        return _extract_text_google(documento, cfg)
    if provider in {"groq", "groq_vision"}:
        return _extract_text_groq_vision(documento, cfg)
    return documento.nombre_archivo or "", ["modo_mock_sin_ocr_real"], {}


def _detect_document_type(texto: str, declared_type: str) -> str:
    lower = texto.lower()
    patrones = [
        ("AVISO_OPERACION", ["aviso de operacion", "aviso de operación"]),
        ("CERTIFICADO_EXISTENCIA", ["certificado", "registro publico", "registro público"]),
        ("IDENTIFICACION_REPRESENTANTE", ["cedula", "cédula", "pasaporte"]),
        ("IDENTIFICACION_BENEFICIARIOS", ["beneficiario", "accionista", "participacion", "participación"]),
        ("DOCUMENTO_IDENTIDAD", ["cedula", "cédula", "pasaporte"]),
        ("COMPROBANTE_INGRESOS", ["ingreso", "salario", "talonario", "estado de cuenta"]),
        ("COMPROBANTE_RESIDENCIA", ["residencia", "servicio", "agua", "luz", "direccion", "dirección"]),
        ("DECLARACION_ORIGEN_FONDOS", ["origen de fondos", "declaracion", "declaración"]),
    ]
    for tipo, tokens in patrones:
        if any(token in lower for token in tokens):
            return tipo
    return declared_type


def _extract_fields(texto: str, cliente_data: dict[str, Any]) -> dict[str, Any]:
    cedula_ruc = re.findall(r"\b(?:\d{1,2}-\d{2,4}-\d{2,6}|\d{6,12}-\d{1,4}-\d{4}|PA\d{5,})\b", texto, re.I)
    montos = re.findall(r"(?:B/\.|\$|USD)?\s?(\d{2,3}(?:,\d{3})+(?:\.\d{2})?|\d{4,})(?:\s?USD)?", texto, re.I)
    fields = {
        "nombre": cliente_data.get("nombre"),
        "identificacion": cedula_ruc[0] if cedula_ruc else cliente_data.get("identificacion"),
        "pais": cliente_data.get("pais"),
        "monto": float(str(montos[0]).replace(",", "")) if montos else cliente_data.get("monto"),
    }
    if cliente_data.get("beneficiarios"):
        fields["beneficiarios_sugeridos"] = cliente_data["beneficiarios"]
    return fields


def _merge_external_fields(fields: dict[str, Any], external_payload: dict[str, Any]) -> dict[str, Any]:
    external_fields = external_payload.get("fields") or external_payload.get("fields_extracted") or {}
    merged = dict(fields)
    for key in ("nombre", "identificacion", "pais", "monto"):
        if external_fields.get(key):
            merged[key] = external_fields[key]
    return merged


def _compare_fields(cliente_data: dict[str, Any], fields: dict[str, Any], declared_type: str, detected_type: str) -> list[dict[str, Any]]:
    checks = []
    for key in ("identificacion", "nombre", "pais"):
        expected = cliente_data.get(key)
        detected = fields.get(key)
        match = bool(expected and detected and str(expected).lower() in str(detected).lower() or detected and expected and str(detected).lower() in str(expected).lower())
        checks.append({"field": key, "expected": expected, "detected": detected, "match": match})
    checks.append({"field": "tipo_documento", "expected": declared_type, "detected": detected_type, "match": declared_type == detected_type})
    return checks


def _confidence(comparisons: list[dict[str, Any]], errors: list[str], texto: str) -> float:
    if not comparisons:
        return 0.35
    matches = sum(1 for item in comparisons if item.get("match"))
    score = matches / len(comparisons)
    if errors:
        score -= 0.12
    if len(texto.strip()) < 20:
        score -= 0.1
    return max(0.15, min(0.98, round(score, 2)))


def _provider_model(cfg: dict[str, Any]) -> tuple[str, str]:
    provider = cfg.get("ocr_provider") if cfg.get("ocr_provider") != "mock" else cfg.get("ai_mode")
    if provider == "groq":
        return "groq", cfg.get("groq_vision_model") if cfg.get("ocr_provider") in {"groq", "groq_vision"} else cfg.get("groq_model")
    if provider in {"google", "google_document_ai", "gemini"}:
        return "google", cfg.get("google_model")
    if provider == "local":
        return "local", cfg.get("ollama_llm_model")
    return "mock", "deterministic-ocr-mock-v1"


def extraer_documento(db: Session, documento_id: str, usuario: str = "sistema") -> dict[str, Any]:
    documento = db.query(Documento).filter(Documento.id_documento == documento_id).first()
    if not documento:
        return {"error": "documento_no_encontrado"}
    cliente = db.query(Cliente).filter(Cliente.id_cliente == documento.id_cliente, Cliente.eliminado == False).first()
    if not cliente:
        return {"error": "cliente_no_encontrado"}

    cfg = _runtime_config(db)
    texto, ocr_errors, external_payload = _extract_text_for_provider(documento, cfg)
    cliente_data = _cliente_detalle(db, cliente)
    detected_type = external_payload.get("document_type_detected") or _detect_document_type(texto, documento.tipo_documento)
    fields = _merge_external_fields(_extract_fields(texto, cliente_data), external_payload)
    comparisons = _compare_fields(cliente_data, fields, documento.tipo_documento, detected_type)
    confidence = _confidence(comparisons, ocr_errors, texto)
    requires_review = confidence < float(cfg.get("ai_min_confidence") or settings.AI_MIN_CONFIDENCE) or any(not item["match"] for item in comparisons if item["field"] in {"identificacion", "tipo_documento"})
    action = "REVISAR" if requires_review else "APROBAR"
    if any(item["field"] == "tipo_documento" and not item["match"] for item in comparisons):
        action = "OBSERVAR"
    provider, model = _provider_model(cfg)

    raw_payload = {
        "documento": str(documento.id_documento),
        "cliente": str(cliente.id_cliente),
        "texto": texto[:2000],
        "fields": fields,
        "comparisons": comparisons,
    }
    input_hash = _sha256(json.dumps(raw_payload, sort_keys=True, default=str))

    try:
        payload = ExtractionPayload(
            provider=provider,
            model=model,
            prompt_version=PROMPT_VERSION,
            input_hash=input_hash,
            output_schema_version=SCHEMA_VERSION,
            confidence=confidence,
            fields_extracted=fields,
            evidence=[{"source": "ocr_text", "excerpt": texto[:240]}],
            decision_suggestion=AISuggestion(
                action=action,
                reason="Confianza suficiente y campos criticos coinciden" if not requires_review else "Requiere revision por baja confianza o discrepancias",
                confidence=confidence,
            ),
            requires_human_review=requires_review,
            errors=ocr_errors,
        )
        status = "OK"
        errors = ocr_errors
    except ValidationError as exc:
        payload = ExtractionPayload(
            provider=provider,
            model=model,
            prompt_version=PROMPT_VERSION,
            input_hash=input_hash,
            output_schema_version=SCHEMA_VERSION,
            confidence=0,
            fields_extracted={},
            evidence=[],
            decision_suggestion=AISuggestion(action="REVISAR", reason="Salida IA invalida", confidence=0),
            requires_human_review=True,
            errors=[str(exc)],
        )
        status = "SCHEMA_ERROR"
        errors = [str(exc)]

    run = AIModelRun(
        id_cliente=cliente.id_cliente,
        id_documento=documento.id_documento,
        provider=payload.provider,
        model=payload.model,
        prompt_version=payload.prompt_version,
        input_hash=payload.input_hash,
        output_schema_version=payload.output_schema_version,
        confidence=payload.confidence,
        status=status,
        purpose="document_extraction",
        request_summary={"documento": documento.nombre_archivo, "tipo_declarado": documento.tipo_documento},
        response_summary=payload.model_dump(),
        errors=errors,
    )
    db.add(run)
    db.flush()

    db.query(AIExtraction).filter(AIExtraction.id_documento == documento.id_documento).delete()
    extraction = AIExtraction(
        id_run=run.id_run,
        id_cliente=cliente.id_cliente,
        id_documento=documento.id_documento,
        provider=payload.provider,
        model=payload.model,
        document_type_detected=detected_type,
        confidence=payload.confidence,
        requires_human_review=payload.requires_human_review,
        fields_extracted=payload.fields_extracted,
        comparisons=comparisons,
        evidence=payload.evidence,
        decision_suggestion=payload.decision_suggestion.model_dump(),
        errors=payload.errors,
    )
    db.add(extraction)
    db.commit()
    db.refresh(extraction)

    index_document_embedding(db, cliente.id_cliente, documento.id_documento, texto, {"tipo": documento.tipo_documento, "run": str(run.id_run)})
    registrar_auditoria(
        db,
        usuario,
        "AI_DOCUMENTO_EXTRAIDO",
        str(cliente.id_cliente),
        None,
        payload.decision_suggestion.action,
        detalle={
            "documento_id": str(documento.id_documento),
            "run_id": str(run.id_run),
            "provider": payload.provider,
            "model": payload.model,
            "confidence": payload.confidence,
            "requires_human_review": payload.requires_human_review,
            "comparisons": comparisons,
        },
        origen="sistema",
        severidad="warning" if payload.requires_human_review else "info",
        correlation_id=str(documento.id_documento),
        version_regla=payload.prompt_version,
    )
    return serialize_extraction(extraction, run)


def serialize_extraction(extraction: AIExtraction, run: AIModelRun | None = None) -> dict[str, Any]:
    return {
        "id_extraction": str(extraction.id_extraction),
        "id_run": str(extraction.id_run),
        "id_cliente": str(extraction.id_cliente),
        "id_documento": str(extraction.id_documento),
        "provider": extraction.provider,
        "model": extraction.model,
        "document_type_detected": extraction.document_type_detected,
        "confidence": float(extraction.confidence or 0),
        "requires_human_review": extraction.requires_human_review,
        "fields_extracted": extraction.fields_extracted or {},
        "comparisons": extraction.comparisons or [],
        "evidence": extraction.evidence or [],
        "decision_suggestion": extraction.decision_suggestion or {},
        "errors": extraction.errors or [],
        "created_at": extraction.created_at.isoformat() if extraction.created_at else None,
        "run": {
            "provider": run.provider,
            "model": run.model,
            "prompt_version": run.prompt_version,
            "input_hash": run.input_hash,
            "status": run.status,
        } if run else None,
    }


def obtener_extraccion_documento(db: Session, documento_id: str):
    extraction = db.query(AIExtraction).filter(AIExtraction.id_documento == documento_id).order_by(AIExtraction.created_at.desc()).first()
    if not extraction:
        return None
    run = db.query(AIModelRun).filter(AIModelRun.id_run == extraction.id_run).first()
    return serialize_extraction(extraction, run)


def _simple_embedding(text: str, size: int = 16) -> list[float]:
    buckets = [0.0] * size
    tokens = re.findall(r"[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9]+", text.lower())
    for token in tokens:
        digest = hashlib.sha256(token.encode()).digest()
        idx = digest[0] % size
        buckets[idx] += 1.0
    norm = math.sqrt(sum(value * value for value in buckets)) or 1.0
    return [round(value / norm, 4) for value in buckets]


def _external_embedding(text: str, cfg: dict[str, Any] | None = None) -> tuple[list[float], str, str, list[str]]:
    cfg = cfg or _runtime_config()
    provider = cfg.get("embeddings_provider")
    if provider == "google":
        if not settings.GOOGLE_API_KEY:
            return _simple_embedding(text), "mock", "mock-hash-embedding-v1", ["google_api_key_faltante"]
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{cfg.get('google_embedding_model')}:embedContent?key={settings.GOOGLE_API_KEY}"
        try:
            res = requests.post(url, json={"content": {"parts": [{"text": text[:8000]}]}}, timeout=30)
            res.raise_for_status()
            values = res.json()["embedding"]["values"]
            return values, "google", cfg.get("google_embedding_model"), []
        except Exception as exc:
            return _simple_embedding(text), "mock", "mock-hash-embedding-v1", [f"google_embedding_error:{type(exc).__name__}"]
    if provider == "local":
        try:
            res = requests.post(
                f"{str(cfg.get('ollama_base_url')).rstrip('/')}/api/embeddings",
                json={"model": cfg.get("ollama_embedding_model"), "prompt": text[:8000]},
                timeout=30,
            )
            res.raise_for_status()
            return res.json()["embedding"], "local", cfg.get("ollama_embedding_model"), []
        except Exception as exc:
            return _simple_embedding(text), "mock", "mock-hash-embedding-v1", [f"ollama_embedding_error:{type(exc).__name__}"]
    return _simple_embedding(text), "mock", "mock-hash-embedding-v1", []


def _ollama_llm_json(prompt: str, fallback: dict[str, Any], cfg: dict[str, Any] | None = None) -> tuple[dict[str, Any], str, str, list[str]]:
    cfg = cfg or _runtime_config()
    try:
        res = requests.post(
            f"{str(cfg.get('ollama_base_url')).rstrip('/')}/api/generate",
            json={
                "model": cfg.get("ollama_llm_model"),
                "prompt": "Devuelve solo JSON valido. Usa solo este contexto:\n" + prompt,
                "stream": False,
                "format": "json",
                "options": {"temperature": 0},
            },
            timeout=60,
        )
        res.raise_for_status()
        return _json_from_text(res.json().get("response", "{}")), "local", cfg.get("ollama_llm_model"), []
    except Exception as exc:
        return fallback, "mock", "deterministic-summary-v1", [f"ollama_llm_error:{type(exc).__name__}"]


def _llm_json(prompt: str, fallback: dict[str, Any], cfg: dict[str, Any] | None = None) -> tuple[dict[str, Any], str, str, list[str]]:
    cfg = cfg or _runtime_config()
    provider = cfg.get("llm_provider")
    if provider == "groq":
        if not settings.GROQ_API_KEY:
            data, fallback_provider, fallback_model, errors = _ollama_llm_json(prompt, fallback, cfg)
            return data, fallback_provider, fallback_model, ["groq_api_key_faltante"] + errors
        try:
            res = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                json={
                    "model": cfg.get("groq_model"),
                    "temperature": 0,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": "Devuelve solo JSON valido. No inventes hechos; usa solo el contexto provisto."},
                        {"role": "user", "content": prompt},
                    ],
                },
                timeout=45,
            )
            res.raise_for_status()
            return _json_from_text(res.json()["choices"][0]["message"]["content"]), "groq", cfg.get("groq_model"), []
        except Exception as exc:
            data, fallback_provider, fallback_model, errors = _ollama_llm_json(prompt, fallback, cfg)
            return data, fallback_provider, fallback_model, [f"groq_llm_error:{type(exc).__name__}"] + errors
    if provider == "google":
        if not settings.GOOGLE_API_KEY:
            return fallback, "mock", "deterministic-summary-v1", ["google_api_key_faltante"]
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{cfg.get('google_model')}:generateContent?key={settings.GOOGLE_API_KEY}"
            res = requests.post(
                url,
                json={
                    "generationConfig": {"temperature": 0, "response_mime_type": "application/json"},
                    "contents": [{"role": "user", "parts": [{"text": "Devuelve solo JSON valido usando este contexto:\n" + prompt}]}],
                },
                timeout=45,
            )
            res.raise_for_status()
            text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
            return _json_from_text(text), "google", cfg.get("google_model"), []
        except Exception as exc:
            return fallback, "mock", "deterministic-summary-v1", [f"google_llm_error:{type(exc).__name__}"]
    if provider == "local":
        return _ollama_llm_json(prompt, fallback, cfg)
    return fallback, "mock", "deterministic-summary-v1", []


def index_document_embedding(db: Session, cliente_id, documento_id, text: str, metadata: dict[str, Any] | None = None):
    if not text.strip():
        return None
    embedding, provider, model, errors = _external_embedding(text, _runtime_config(db))
    meta = dict(metadata or {})
    if errors:
        meta["embedding_errors"] = errors
    record = DocumentEmbedding(
        id_cliente=cliente_id,
        id_documento=documento_id,
        source_type="documento",
        source_id=str(documento_id),
        provider=provider,
        model=model,
        source_text=text[:2000],
        embedding=embedding,
        metadata_json=meta,
    )
    db.add(record)
    db.commit()
    return record


def semantic_search_context(db: Session, cliente_id: str, query: str):
    query_vec, _, _, _ = _external_embedding(query, _runtime_config(db))
    records = db.query(DocumentEmbedding).filter(DocumentEmbedding.id_cliente == cliente_id).all()
    scored = []
    for record in records:
        vec = record.embedding or []
        score = sum((vec[i] if i < len(vec) else 0) * query_vec[i] for i in range(len(query_vec)))
        scored.append({
            "source_type": record.source_type,
            "source_id": record.source_id,
            "score": round(score, 4),
            "text": record.source_text,
            "metadata": record.metadata_json or {},
        })
    return sorted(scored, key=lambda item: item["score"], reverse=True)[:8]


def resumen_expediente(db: Session, cliente_id: str, usuario: str = "sistema") -> dict[str, Any] | None:
    cliente = db.query(Cliente).filter(Cliente.id_cliente == cliente_id, Cliente.eliminado == False).first()
    if not cliente:
        return None
    checklist = checklist_expediente(db, cliente_id)
    observaciones = db.query(Observacion).filter(Observacion.id_cliente == cliente_id).all()
    extracciones = db.query(AIExtraction).filter(AIExtraction.id_cliente == cliente_id).order_by(AIExtraction.created_at.desc()).limit(5).all()
    auditoria = db.query(Auditoria).filter(Auditoria.cliente_id == cliente_id).order_by(Auditoria.fecha.desc()).limit(8).all()
    bloqueos = [item for item in (checklist or {}).get("items", []) if item.get("blocking")]
    estado = cliente.estado
    riesgo = cliente.nivel_riesgo or "sin riesgo calculado"
    fallback = {
        "titulo": f"Expediente {estado} con riesgo {riesgo}",
        "estado": estado,
        "riesgo": cliente.nivel_riesgo,
        "bloqueos": [{"label": item["label"], "message": item["message"], "action": item.get("action")} for item in bloqueos],
        "observaciones_abiertas": sum(1 for obs in observaciones if obs.estado == "ABIERTA"),
        "extracciones_ia": [
            {
                "documento": str(ext.id_documento),
                "confianza": float(ext.confidence or 0),
                "requiere_revision": ext.requires_human_review,
                "sugerencia": ext.decision_suggestion,
            }
            for ext in extracciones
        ],
        "eventos_fuente": [
            {
                "id_auditoria": str(item.id_auditoria),
                "accion": item.accion,
                "fecha": item.fecha.isoformat() if item.fecha else None,
                "origen": item.origen,
            }
            for item in auditoria
        ],
        "nota_guardrail": "Resumen asistido. Las decisiones regulatorias se toman por reglas y usuarios autorizados.",
    }
    prompt = json.dumps(fallback, ensure_ascii=False, default=str)
    resumen, provider, model, llm_errors = _llm_json(prompt, fallback, _runtime_config(db))
    raw = json.dumps(resumen, sort_keys=True, default=str)
    run = AIModelRun(
        id_cliente=cliente.id_cliente,
        provider=provider,
        model=model,
        prompt_version=PROMPT_VERSION,
        input_hash=_sha256(raw),
        output_schema_version="ai-summary-v1",
        confidence=0.9,
        status="OK",
        purpose="case_summary",
        request_summary={"cliente_id": cliente_id},
        response_summary=resumen,
        errors=llm_errors,
    )
    db.add(run)
    db.commit()
    registrar_auditoria(
        db,
        usuario,
        "AI_RESUMEN_EXPEDIENTE",
        cliente_id,
        None,
        "GENERADO",
        detalle={"run_id": str(run.id_run), "provider": provider, "model": model},
        origen="sistema",
        severidad="info",
        correlation_id=cliente_id,
        version_regla=PROMPT_VERSION,
    )
    return resumen


def sugerir_observacion(db: Session, cliente_id: str, usuario: str = "sistema") -> dict[str, Any] | None:
    cliente = db.query(Cliente).filter(Cliente.id_cliente == cliente_id, Cliente.eliminado == False).first()
    if not cliente:
        return None
    extracciones = db.query(AIExtraction).filter(AIExtraction.id_cliente == cliente_id).order_by(AIExtraction.created_at.desc()).limit(10).all()
    discrepancias = []
    for ext in extracciones:
        for comp in ext.comparisons or []:
            if not comp.get("match"):
                discrepancias.append({
                    "documento": str(ext.id_documento),
                    "campo": comp.get("field"),
                    "esperado": comp.get("expected"),
                    "detectado": comp.get("detected"),
                })
    fallback = {
        "titulo": "Observacion documental sugerida" if discrepancias else "Sin observacion critica sugerida",
        "mensaje": "Se detectaron diferencias que deben aclararse antes de continuar." if discrepancias else "No se encontraron diferencias criticas en las extracciones disponibles.",
        "discrepancias": discrepancias,
        "accion_recomendada": "Crear observacion y solicitar correccion" if discrepancias else "Continuar revision normal",
        "nota_guardrail": "Texto sugerido por IA; el usuario debe revisarlo antes de enviarlo.",
    }
    prompt = json.dumps(fallback, ensure_ascii=False, default=str)
    data, provider, model, errors = _llm_json(prompt, fallback, _runtime_config(db))
    run = AIModelRun(
        id_cliente=cliente.id_cliente,
        provider=provider,
        model=model,
        prompt_version=PROMPT_VERSION,
        input_hash=_sha256(prompt),
        output_schema_version="ai-observation-suggestion-v1",
        confidence=0.85 if discrepancias else 0.65,
        status="OK",
        purpose="observation_suggestion",
        request_summary={"cliente_id": cliente_id, "discrepancias": len(discrepancias)},
        response_summary=data,
        errors=errors,
    )
    db.add(run)
    db.commit()
    registrar_auditoria(db, usuario, "AI_OBSERVACION_SUGERIDA", cliente_id, None, "GENERADA", detalle={"run_id": str(run.id_run), "discrepancias": len(discrepancias)}, origen="sistema", severidad="warning" if discrepancias else "info", correlation_id=cliente_id, version_regla=PROMPT_VERSION)
    return data | {"provider": provider, "model": model, "run_id": str(run.id_run)}


def sugerir_beneficiarios_finales(db: Session, cliente_id: str, usuario: str = "sistema") -> dict[str, Any] | None:
    cliente = db.query(Cliente).filter(Cliente.id_cliente == cliente_id, Cliente.eliminado == False).first()
    if not cliente:
        return None
    actuales = db.query(BeneficiarioFinal).filter(BeneficiarioFinal.id_cliente == cliente_id).all()
    extracciones = db.query(AIExtraction).filter(AIExtraction.id_cliente == cliente_id).order_by(AIExtraction.created_at.desc()).limit(10).all()
    sugeridos = []
    for ext in extracciones:
        fields = ext.fields_extracted or {}
        for item in fields.get("beneficiarios_sugeridos") or []:
            if item.get("nombre"):
                sugeridos.append({
                    "nombre": item.get("nombre"),
                    "documento": item.get("documento"),
                    "porcentaje": item.get("porcentaje"),
                    "pep": bool(item.get("pep")),
                    "fuente": str(ext.id_documento),
                })
    existentes = {bf.numero_documento for bf in actuales if bf.numero_documento}
    nuevos = [item for item in sugeridos if not item.get("documento") or item.get("documento") not in existentes]
    result = {
        "sugeridos": nuevos,
        "registrados": len(actuales),
        "requiere_revision_humana": True,
        "nota_guardrail": "Los BF sugeridos nunca se aprueban automaticamente.",
    }
    run = AIModelRun(
        id_cliente=cliente.id_cliente,
        provider="local",
        model="bf-suggestion-rules-v1",
        prompt_version=PROMPT_VERSION,
        input_hash=_sha256(json.dumps(result, sort_keys=True, default=str)),
        output_schema_version="ai-beneficial-owner-suggestion-v1",
        confidence=0.7 if nuevos else 0.4,
        status="OK",
        purpose="beneficial_owner_suggestion",
        request_summary={"cliente_id": cliente_id},
        response_summary=result,
        errors=[],
    )
    db.add(run)
    db.commit()
    registrar_auditoria(db, usuario, "AI_BF_SUGERIDOS", cliente_id, None, "GENERADOS", detalle={"run_id": str(run.id_run), "sugeridos": len(nuevos)}, origen="sistema", severidad="warning" if nuevos else "info", correlation_id=cliente_id, version_regla=PROMPT_VERSION)
    return result | {"run_id": str(run.id_run)}


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, (a or "").lower(), (b or "").lower()).ratio()


def screening_cliente(db: Session, cliente_id: str, usuario: str = "sistema") -> dict[str, Any] | None:
    cliente = db.query(Cliente).filter(Cliente.id_cliente == cliente_id, Cliente.eliminado == False).first()
    if not cliente:
        return None
    cfg = _runtime_config(db)
    if cfg.get("screening_enabled") is False:
        return {
            "coincidencias": [],
            "bloquea_automatizacion": False,
            "requiere_revision_humana": False,
            "provider": "local",
            "model": "local-watchlist-v1",
            "deshabilitado": True,
            "mensaje": "Screening local deshabilitado por configuracion administrativa.",
        }
    detalle = _cliente_detalle(db, cliente)
    sujetos = [{"nombre": detalle.get("nombre"), "documento": detalle.get("identificacion"), "rol": "cliente"}]
    for bf in detalle.get("beneficiarios") or []:
        sujetos.append({"nombre": bf.get("nombre"), "documento": bf.get("documento"), "rol": "beneficiario_final"})
    watchlist = db.execute(text("SELECT id_watchlist, nombre, documento, tipo, pais FROM screening_watchlist WHERE activo = true")).mappings().all()
    resultados = []
    db.execute(text("DELETE FROM screening_results WHERE id_cliente = :id"), {"id": cliente_id})
    for sujeto in sujetos:
        for row in watchlist:
            score_nombre = _similarity(sujeto.get("nombre") or "", row["nombre"] or "")
            score_doc = 1.0 if sujeto.get("documento") and row["documento"] and sujeto.get("documento") == row["documento"] else 0
            score = max(score_nombre, score_doc)
            if score >= 0.82:
                resultado = "COINCIDENCIA_FUERTE" if score >= 0.93 or score_doc == 1.0 else "POSIBLE_COINCIDENCIA"
                payload = {
                    "sujeto": sujeto,
                    "watchlist": {"id": str(row["id_watchlist"]), "nombre": row["nombre"], "tipo": row["tipo"]},
                    "score": round(score, 3),
                    "resultado": resultado,
                }
                resultados.append(payload)
                db.execute(text("""
                    INSERT INTO screening_results(id_cliente, id_watchlist, sujeto, documento, tipo, score, resultado, evidencia)
                    VALUES (:cliente, :watchlist, :sujeto, :documento, :tipo, :score, :resultado, CAST(:evidencia AS JSONB))
                """), {
                    "cliente": cliente_id,
                    "watchlist": str(row["id_watchlist"]),
                    "sujeto": sujeto.get("nombre") or "-",
                    "documento": sujeto.get("documento"),
                    "tipo": row["tipo"],
                    "score": score,
                    "resultado": resultado,
                    "evidencia": json.dumps(payload),
                })
    db.commit()
    severidad = "critical" if any(r["resultado"] == "COINCIDENCIA_FUERTE" for r in resultados) else ("warning" if resultados else "info")
    registrar_auditoria(db, usuario, "AI_SCREENING_LOCAL", cliente_id, None, "EJECUTADO", detalle={"coincidencias": resultados}, origen="sistema", severidad=severidad, correlation_id=cliente_id, version_regla="screening-local-v1")
    return {
        "coincidencias": resultados,
        "bloquea_automatizacion": severidad == "critical",
        "requiere_revision_humana": bool(resultados),
        "provider": "local",
        "model": "local-watchlist-v1",
    }


def calcular_prioridad_cliente(db: Session, cliente_id: str, usuario: str = "sistema") -> dict[str, Any] | None:
    cliente = db.query(Cliente).filter(Cliente.id_cliente == cliente_id, Cliente.eliminado == False).first()
    if not cliente:
        return None
    checklist = checklist_expediente(db, cliente_id)
    bloqueos = [item for item in (checklist or {}).get("items", []) if item.get("blocking")]
    obs = db.query(Observacion).filter(Observacion.id_cliente == cliente_id, Observacion.estado == "ABIERTA").count()
    screening = db.execute(text("SELECT resultado, score FROM screening_results WHERE id_cliente = :id"), {"id": cliente_id}).mappings().all()
    score = 10 + len(bloqueos) * 8 + obs * 10
    motivos = []
    if cliente.nivel_riesgo == "ALTO":
        score += 30
        motivos.append("Riesgo alto")
    elif cliente.nivel_riesgo == "ESTANDAR":
        score += 15
        motivos.append("Riesgo estandar")
    if bloqueos:
        motivos.append(f"{len(bloqueos)} bloqueo(s) operativos")
    if obs:
        motivos.append(f"{obs} observacion(es) abierta(s)")
    if screening:
        score += 35
        motivos.append("Coincidencia PEP/sanciones pendiente")
    nivel = "CRITICA" if score >= 70 else "ALTA" if score >= 45 else "MEDIA" if score >= 25 else "NORMAL"
    result = {"score": min(score, 100), "nivel": nivel, "motivos": motivos or ["Sin alertas relevantes"], "nota": "Prioridad calculada por reglas; IA puede explicar, no decidir."}
    db.execute(text("DELETE FROM case_priorities WHERE id_cliente = :id"), {"id": cliente_id})
    db.execute(text("""
        INSERT INTO case_priorities(id_cliente, score, nivel, motivos, calculado_por)
        VALUES (:id, :score, :nivel, CAST(:motivos AS JSONB), :usuario)
    """), {"id": cliente_id, "score": result["score"], "nivel": nivel, "motivos": json.dumps(result["motivos"]), "usuario": usuario})
    db.commit()
    registrar_auditoria(
        db,
        usuario,
        "AI_PRIORIDAD_CALCULADA",
        cliente_id,
        None,
        nivel,
        detalle={"score": result["score"], "motivos": result["motivos"]},
        origen="sistema",
        severidad="warning" if nivel in {"ALTA", "CRITICA"} else "info",
        correlation_id=cliente_id,
        version_regla="priority-rules-v1",
    )
    return result
