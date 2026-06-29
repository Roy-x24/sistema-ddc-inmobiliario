from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import requests
from app.database import obtener_db
from app.models.version_matriz_riesgo import VersionMatrizRiesgo
from app.models.factor_riesgo import FactorRiesgo
from app.models.cliente import Cliente
from app.core.rbac import obtener_usuario_actual, requiere_rol
from app.core.config import settings
from app.models.usuario import Usuario
from app.services.auditoria_admin_service import registrar_auditoria_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


DEFAULT_AI_CONFIG = {
    "ai_mode": settings.AI_MODE,
    "ocr_provider": settings.OCR_PROVIDER,
    "llm_provider": settings.LLM_PROVIDER,
    "embeddings_provider": settings.EMBEDDINGS_PROVIDER,
    "ai_strict_mode": settings.AI_STRICT_MODE,
    "ai_min_confidence": settings.AI_MIN_CONFIDENCE,
    "groq_model": settings.GROQ_MODEL,
    "groq_vision_model": settings.GROQ_VISION_MODEL,
    "google_model": settings.GOOGLE_MODEL,
    "google_embedding_model": settings.GOOGLE_EMBEDDING_MODEL,
    "ollama_base_url": settings.OLLAMA_BASE_URL,
    "ollama_llm_model": settings.OLLAMA_LLM_MODEL,
    "ollama_embedding_model": settings.OLLAMA_EMBEDDING_MODEL,
    "auto_validate_low_risk_documents": True,
    "critical_difference_threshold": 0.82,
    "screening_enabled": True,
}


def _get_runtime_config(db: Session):
    row = db.execute(text("SELECT value FROM ai_runtime_settings WHERE key = 'active'")).mappings().first()
    config = dict(DEFAULT_AI_CONFIG)
    if row and row["value"]:
        config.update(row["value"])
    return config


@router.get("/ia/config")
def ver_config_ia(
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_matriz"))
):
    config = _get_runtime_config(db)
    return {
        "config": config,
        "secrets": {
            "groq_api_key_set": bool(settings.GROQ_API_KEY),
            "google_api_key_set": bool(settings.GOOGLE_API_KEY),
        },
        "effective_from": "db_override_con_defaults_env",
    }


@router.patch("/ia/config")
def guardar_config_ia(
    datos: dict,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_matriz"))
):
    allowed = set(DEFAULT_AI_CONFIG.keys())
    clean = {k: v for k, v in datos.items() if k in allowed}
    config = _get_runtime_config(db)
    config.update(clean)
    db.execute(
        text("""
            INSERT INTO ai_runtime_settings(key, value, descripcion, actualizado_por, actualizado_en)
            VALUES ('active', CAST(:value AS JSONB), 'Configuracion IA activa', :usuario, NOW())
            ON CONFLICT (key) DO UPDATE SET
                value = EXCLUDED.value,
                actualizado_por = EXCLUDED.actualizado_por,
                actualizado_en = NOW()
        """),
        {"value": __import__("json").dumps(config), "usuario": usuario.correo},
    )
    db.commit()
    registrar_auditoria_admin(db, usuario.correo, "EDITAR_CONFIG_IA", {"cambios": clean})
    return {"mensaje": "Configuracion IA guardada", "config": config}


@router.post("/ia/probar")
def probar_proveedor_ia(
    datos: dict,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_matriz"))
):
    proveedor = datos.get("proveedor", "ollama")
    config = _get_runtime_config(db)
    try:
        if proveedor == "ollama":
            res = requests.get(f"{str(config.get('ollama_base_url')).rstrip('/')}/api/tags", timeout=5)
            res.raise_for_status()
            modelos = [m.get("name") for m in res.json().get("models", [])]
            return {
                "ok": True,
                "proveedor": "ollama",
                "url": config.get("ollama_base_url"),
                "modelo_llm": config.get("ollama_llm_model"),
                "modelo_embeddings": config.get("ollama_embedding_model"),
                "modelos": modelos,
            }
        if proveedor == "groq":
            if not settings.GROQ_API_KEY:
                return {"ok": False, "proveedor": "groq", "error": "groq_api_key_faltante"}
            res = requests.get(
                "https://api.groq.com/openai/v1/models",
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                timeout=8,
            )
            res.raise_for_status()
            return {
                "ok": True,
                "proveedor": "groq",
                "modelo_configurado": config.get("groq_model"),
                "vision_configurado": config.get("groq_vision_model"),
                "modelos": [m.get("id") for m in res.json().get("data", [])[:8]],
            }
        if proveedor == "google":
            if not settings.GOOGLE_API_KEY:
                return {"ok": False, "proveedor": "google", "error": "google_api_key_faltante"}
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={settings.GOOGLE_API_KEY}"
            res = requests.get(url, timeout=8)
            res.raise_for_status()
            return {
                "ok": True,
                "proveedor": "google",
                "modelo_configurado": config.get("google_model"),
                "embedding_configurado": config.get("google_embedding_model"),
                "modelos": [m.get("name") for m in res.json().get("models", [])[:8]],
            }
    except Exception as exc:
        return {"ok": False, "proveedor": proveedor, "error": type(exc).__name__}
    return {"ok": False, "proveedor": proveedor, "error": "proveedor_no_soportado"}


@router.get("/screening/lista")
def listar_watchlist(
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_matriz"))
):
    rows = db.execute(text("""
        SELECT id_watchlist, nombre, documento, tipo, pais, fuente, activo, creado_en
        FROM screening_watchlist
        ORDER BY creado_en DESC
        LIMIT 500
    """)).mappings().all()
    return [dict(row) | {"id_watchlist": str(row["id_watchlist"]), "creado_en": row["creado_en"].isoformat() if row["creado_en"] else None} for row in rows]


@router.post("/screening/lista")
def crear_watchlist(
    datos: dict,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_matriz"))
):
    nombre = (datos.get("nombre") or "").strip()
    if not nombre:
        raise HTTPException(status_code=400, detail="Nombre requerido")
    db.execute(
        text("""
            INSERT INTO screening_watchlist(nombre, documento, tipo, pais, fuente, activo, metadata_json, creado_por)
            VALUES (:nombre, :documento, :tipo, :pais, 'manual', true, CAST(:metadata AS JSONB), :usuario)
        """),
        {
            "nombre": nombre,
            "documento": datos.get("documento"),
            "tipo": datos.get("tipo") or "PEP",
            "pais": datos.get("pais"),
            "metadata": __import__("json").dumps(datos.get("metadata") or {}),
            "usuario": usuario.correo,
        },
    )
    db.commit()
    registrar_auditoria_admin(db, usuario.correo, "CREAR_WATCHLIST", {"nombre": nombre, "tipo": datos.get("tipo") or "PEP"})
    return {"mensaje": "Entrada agregada"}


@router.patch("/screening/lista/{watchlist_id}")
def actualizar_watchlist(
    watchlist_id: str,
    datos: dict,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_matriz"))
):
    db.execute(
        text("""
            UPDATE screening_watchlist
            SET activo = COALESCE(:activo, activo)
            WHERE id_watchlist = :id
        """),
        {"id": watchlist_id, "activo": datos.get("activo")},
    )
    db.commit()
    registrar_auditoria_admin(db, usuario.correo, "EDITAR_WATCHLIST", {"id": watchlist_id, "cambios": datos})
    return {"mensaje": "Entrada actualizada"}


@router.get("/matriz")
def ver_matriz_activa(
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_matriz"))
):
    version = db.query(VersionMatrizRiesgo).filter(VersionMatrizRiesgo.esta_activa == True).first()
    if not version:
        raise HTTPException(status_code=404, detail="No hay matriz activa")
    factores = db.query(FactorRiesgo).filter(FactorRiesgo.version_id == version.id).all()
    return {
        "version": {"id": str(version.id), "version_numero": version.version_numero, "descripcion": version.descripcion},
        "factores": [
            {"id": str(f.id), "nombre_factor": f.nombre_factor, "descripcion": f.descripcion, "peso": f.peso, "tipo": f.tipo, "activo": f.activo}
            for f in factores
        ]
    }


@router.get("/matriz/versiones")
def listar_versiones(
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_matriz"))
):
    versiones = db.query(VersionMatrizRiesgo).order_by(VersionMatrizRiesgo.version_numero.desc()).all()
    return versiones


@router.post("/matriz")
def crear_version_borrador(
    datos: dict,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_matriz"))
):
    ultima = db.query(VersionMatrizRiesgo).order_by(VersionMatrizRiesgo.version_numero.desc()).first()
    nuevo_numero = (ultima.version_numero + 1) if ultima else 1

    version = VersionMatrizRiesgo(
        version_numero=nuevo_numero,
        descripcion=datos.get("descripcion", ""),
        esta_activa=False,
        publicada_por=usuario.correo
    )
    db.add(version)
    db.commit()
    db.refresh(version)

    # Copiar factores de la version activa anterior
    if ultima:
        factores = db.query(FactorRiesgo).filter(FactorRiesgo.version_id == ultima.id).all()
        for f in factores:
            nf = FactorRiesgo(
                version_id=version.id,
                nombre_factor=f.nombre_factor,
                descripcion=f.descripcion,
                peso=f.peso,
                tipo=f.tipo,
                activo=f.activo
            )
            db.add(nf)
        db.commit()

    return {"id": str(version.id), "version_numero": version.version_numero}


@router.patch("/matriz/{version_id}/publicar")
def publicar_version(
    version_id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_matriz"))
):
    version = db.query(VersionMatrizRiesgo).filter(VersionMatrizRiesgo.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version no encontrada")

    # Desactivar la anterior
    db.query(VersionMatrizRiesgo).filter(VersionMatrizRiesgo.esta_activa == True).update({"esta_activa": False})

    version.esta_activa = True
    version.publicada_por = usuario.correo
    db.commit()

    # Marcar expedientes para reevaluacion
    db.query(Cliente).filter(
        Cliente.estado.in_(["EN_REVISION", "ACTIVO"])
    ).update({"requiere_reevaluacion": True})
    db.commit()

    registrar_auditoria_admin(db, usuario.correo, "PUBLICAR_MATRIZ", {"version_id": str(version_id)})
    return {"mensaje": "Version publicada"}


@router.patch("/factores/{factor_id}")
def editar_factor(
    factor_id: str,
    datos: dict,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_matriz"))
):
    factor = db.query(FactorRiesgo).filter(FactorRiesgo.id == factor_id).first()
    if not factor:
        raise HTTPException(status_code=404, detail="Factor no encontrado")

    if "peso" in datos:
        factor.peso = datos["peso"]
    if "activo" in datos:
        factor.activo = datos["activo"]
    db.commit()

    registrar_auditoria_admin(db, usuario.correo, "EDITAR_FACTOR", {"factor_id": str(factor_id), "cambios": datos})
    return {"mensaje": "Factor actualizado"}
