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
    ]
    with engine.begin() as conn:
        for sentencia in sentencias:
            conn.execute(text(sentencia))
