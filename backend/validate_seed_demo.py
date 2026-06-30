import os
import sys
from sqlalchemy import create_engine, text


DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ddc_user:ddc_pass@localhost:5432/ddc_db")
engine = create_engine(DATABASE_URL)


CHECKS = [
    (
        "activos_sin_documentos_obligatorios_validos",
        """
        WITH obligatorios AS (
            SELECT id_cliente, unnest(
                CASE
                    WHEN tipo_cliente = 'NATURAL'
                        THEN ARRAY['DOCUMENTO_IDENTIDAD','COMPROBANTE_INGRESOS','COMPROBANTE_RESIDENCIA']
                    ELSE ARRAY['AVISO_OPERACION','CERTIFICADO_EXISTENCIA','IDENTIFICACION_REPRESENTANTE','IDENTIFICACION_BENEFICIARIOS']
                END
            ) AS tipo_documento
            FROM clientes
            WHERE eliminado = false AND estado = 'ACTIVO'
        )
        SELECT c.id_cliente, c.tipo_cliente, c.estado, o.tipo_documento, d.estado AS estado_documento
        FROM clientes c
        JOIN obligatorios o ON o.id_cliente = c.id_cliente
        LEFT JOIN documentos d ON d.id_cliente = o.id_cliente AND d.tipo_documento = o.tipo_documento
        WHERE c.estado = 'ACTIVO'
          AND COALESCE(d.estado, 'FALTANTE') NOT IN ('VERIFICADO', 'VALIDADO_AUTOMATICO', 'VERIFICADO_MANUAL')
        """,
    ),
    (
        "activos_con_observaciones_abiertas",
        """
        SELECT c.id_cliente, c.estado, COUNT(o.id) AS abiertas
        FROM clientes c
        JOIN observaciones o ON o.id_cliente = c.id_cliente AND o.estado = 'ABIERTA'
        WHERE c.eliminado = false AND c.estado = 'ACTIVO'
        GROUP BY c.id_cliente, c.estado
        """,
    ),
    (
        "juridicas_activas_con_bf_relevante_no_aprobado",
        """
        SELECT c.id_cliente, c.estado, bf.nombre_completo, bf.estado_validacion
        FROM clientes c
        JOIN beneficiarios_finales bf ON bf.id_cliente = c.id_cliente
        WHERE c.eliminado = false
          AND c.tipo_cliente = 'JURIDICA'
          AND c.estado = 'ACTIVO'
          AND bf.es_relevante = true
          AND bf.estado_validacion <> 'APROBADO'
        """,
    ),
    (
        "pendiente_bf_sin_bf_relevante_pendiente",
        """
        SELECT c.id_cliente, c.estado
        FROM clientes c
        WHERE c.eliminado = false
          AND c.tipo_cliente = 'JURIDICA'
          AND c.estado = 'PENDIENTE_BF'
          AND NOT EXISTS (
              SELECT 1
              FROM beneficiarios_finales bf
              WHERE bf.id_cliente = c.id_cliente
                AND bf.es_relevante = true
                AND bf.estado_validacion = 'PENDIENTE'
          )
        """,
    ),
    (
        "en_revision_con_bloqueos_basicos",
        """
        WITH obligatorios AS (
            SELECT id_cliente, unnest(
                CASE
                    WHEN tipo_cliente = 'NATURAL'
                        THEN ARRAY['DOCUMENTO_IDENTIDAD','COMPROBANTE_INGRESOS','COMPROBANTE_RESIDENCIA']
                    ELSE ARRAY['AVISO_OPERACION','CERTIFICADO_EXISTENCIA','IDENTIFICACION_REPRESENTANTE','IDENTIFICACION_BENEFICIARIOS']
                END
            ) AS tipo_documento
            FROM clientes
            WHERE eliminado = false AND estado = 'EN_REVISION'
        )
        SELECT c.id_cliente, c.tipo_cliente, c.estado, o.tipo_documento, d.estado AS estado_documento
        FROM clientes c
        JOIN obligatorios o ON o.id_cliente = c.id_cliente
        LEFT JOIN documentos d ON d.id_cliente = o.id_cliente AND d.tipo_documento = o.tipo_documento
        WHERE c.estado = 'EN_REVISION'
          AND COALESCE(d.estado, 'FALTANTE') NOT IN ('VERIFICADO', 'VALIDADO_AUTOMATICO', 'VERIFICADO_MANUAL')
        UNION ALL
        SELECT c.id_cliente, c.tipo_cliente, c.estado, 'OBSERVACION_ABIERTA', 'ABIERTA'
        FROM clientes c
        JOIN observaciones obs ON obs.id_cliente = c.id_cliente AND obs.estado = 'ABIERTA'
        WHERE c.estado = 'EN_REVISION'
        """,
    ),
    (
        "observados_sin_excepcion_visible",
        """
        SELECT c.id_cliente, c.estado
        FROM clientes c
        WHERE c.eliminado = false
          AND c.estado = 'OBSERVADO'
          AND NOT EXISTS (
              SELECT 1 FROM observaciones o
              WHERE o.id_cliente = c.id_cliente AND o.estado = 'ABIERTA'
          )
          AND NOT EXISTS (
              SELECT 1 FROM documentos d
              WHERE d.id_cliente = c.id_cliente AND d.estado IN ('OBSERVADO', 'RECHAZADO')
          )
        """,
    ),
]


def main() -> int:
    failures = []
    with engine.connect() as conn:
        for name, query in CHECKS:
            rows = [dict(row) for row in conn.execute(text(query)).mappings().all()]
            if rows:
                failures.append((name, rows))

    if failures:
        print("Seed demo incoherente:")
        for name, rows in failures:
            print(f"\n[{name}] {len(rows)} hallazgo(s)")
            for row in rows[:10]:
                print(row)
        return 1

    print("Seed demo coherente: no se encontraron estados bloqueantes contradictorios.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
