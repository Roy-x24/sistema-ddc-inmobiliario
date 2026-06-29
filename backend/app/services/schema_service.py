from sqlalchemy import text
from app.database import engine


def asegurar_esquema_automatizacion():
    sentencias = [
        "ALTER TABLE auditorias ADD COLUMN IF NOT EXISTS detalle JSONB",
        "ALTER TABLE auditorias ADD COLUMN IF NOT EXISTS origen VARCHAR NOT NULL DEFAULT 'humano'",
        "ALTER TABLE auditorias ADD COLUMN IF NOT EXISTS severidad VARCHAR NOT NULL DEFAULT 'info'",
        "ALTER TABLE auditorias ADD COLUMN IF NOT EXISTS correlation_id VARCHAR",
        "ALTER TABLE auditorias ADD COLUMN IF NOT EXISTS version_regla VARCHAR",
        "ALTER TABLE documentos ADD COLUMN IF NOT EXISTS confianza_validacion VARCHAR",
        "ALTER TABLE documentos ADD COLUMN IF NOT EXISTS resumen_validacion VARCHAR",
        "ALTER TABLE documentos DROP CONSTRAINT IF EXISTS documentos_estado_check",
        """
        ALTER TABLE documentos ADD CONSTRAINT documentos_estado_check
        CHECK (estado IN (
            'PENDIENTE_VERIFICACION',
            'VALIDADO_AUTOMATICO',
            'VERIFICADO_MANUAL',
            'VERIFICADO',
            'OBSERVADO',
            'RECHAZADO'
        ))
        """,
        """
        CREATE TABLE IF NOT EXISTS documento_validaciones (
            id_validacion UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            id_documento UUID NOT NULL REFERENCES documentos(id_documento) ON DELETE CASCADE,
            id_cliente UUID NOT NULL REFERENCES clientes(id_cliente) ON DELETE CASCADE,
            regla VARCHAR NOT NULL,
            resultado VARCHAR NOT NULL CHECK (resultado IN ('APROBADO', 'OBSERVADO', 'RECHAZADO')),
            confianza VARCHAR NOT NULL,
            mensaje VARCHAR NOT NULL,
            datos_extraidos JSONB,
            ejecutado_por VARCHAR NOT NULL DEFAULT 'sistema',
            version_regla VARCHAR NOT NULL DEFAULT 'documental-v1',
            fecha TIMESTAMP DEFAULT NOW()
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS ai_model_runs (
            id_run UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            id_cliente UUID NULL REFERENCES clientes(id_cliente) ON DELETE SET NULL,
            id_documento UUID NULL REFERENCES documentos(id_documento) ON DELETE SET NULL,
            provider VARCHAR NOT NULL,
            model VARCHAR NOT NULL,
            prompt_version VARCHAR NOT NULL,
            input_hash VARCHAR NOT NULL,
            output_schema_version VARCHAR NOT NULL,
            confidence NUMERIC NOT NULL DEFAULT 0,
            status VARCHAR NOT NULL,
            purpose VARCHAR NOT NULL,
            request_summary JSONB,
            response_summary JSONB,
            errors JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS ai_extractions (
            id_extraction UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            id_run UUID NOT NULL REFERENCES ai_model_runs(id_run) ON DELETE CASCADE,
            id_cliente UUID NOT NULL REFERENCES clientes(id_cliente) ON DELETE CASCADE,
            id_documento UUID NOT NULL REFERENCES documentos(id_documento) ON DELETE CASCADE,
            provider VARCHAR NOT NULL,
            model VARCHAR NOT NULL,
            document_type_detected VARCHAR,
            confidence NUMERIC NOT NULL DEFAULT 0,
            requires_human_review BOOLEAN NOT NULL DEFAULT TRUE,
            fields_extracted JSONB NOT NULL DEFAULT '{}'::jsonb,
            comparisons JSONB,
            evidence JSONB,
            decision_suggestion JSONB NOT NULL DEFAULT '{}'::jsonb,
            errors JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS document_embeddings (
            id_embedding UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            id_cliente UUID NULL REFERENCES clientes(id_cliente) ON DELETE CASCADE,
            id_documento UUID NULL REFERENCES documentos(id_documento) ON DELETE CASCADE,
            source_type VARCHAR NOT NULL,
            source_id VARCHAR NOT NULL,
            provider VARCHAR NOT NULL,
            model VARCHAR NOT NULL,
            source_text TEXT NOT NULL,
            embedding JSONB NOT NULL,
            metadata_json JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS audit_embeddings (
            id_embedding UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            id_auditoria UUID NULL REFERENCES auditorias(id_auditoria) ON DELETE CASCADE,
            id_cliente UUID NULL REFERENCES clientes(id_cliente) ON DELETE CASCADE,
            provider VARCHAR NOT NULL,
            model VARCHAR NOT NULL,
            source_text TEXT NOT NULL,
            embedding JSONB NOT NULL,
            metadata_json JSONB,
            created_at TIMESTAMP DEFAULT NOW()
        )
        """,
        "CREATE INDEX IF NOT EXISTS idx_ai_model_runs_cliente ON ai_model_runs(id_cliente)",
        "CREATE INDEX IF NOT EXISTS idx_ai_model_runs_documento ON ai_model_runs(id_documento)",
        "CREATE INDEX IF NOT EXISTS idx_ai_extractions_documento ON ai_extractions(id_documento)",
        "CREATE INDEX IF NOT EXISTS idx_document_embeddings_cliente ON document_embeddings(id_cliente)",
    ]
    with engine.begin() as conn:
        for sentencia in sentencias:
            conn.execute(text(sentencia))
