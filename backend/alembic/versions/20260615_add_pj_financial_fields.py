"""add financial fields to legal entities

Revision ID: 20260615_add_pj_financial_fields
Revises:
Create Date: 2026-06-15
"""

from alembic import op
import sqlalchemy as sa


revision = "20260615_add_pj_financial_fields"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("personas_juridicas", sa.Column("fuente_ingresos", sa.String(), nullable=False, server_default="no_registrado"))
    op.add_column("personas_juridicas", sa.Column("rango_ingresos", sa.String(), nullable=False, server_default="no_registrado"))
    op.add_column("personas_juridicas", sa.Column("origen_fondos", sa.String(), nullable=False, server_default="no_registrado"))
    op.add_column("personas_juridicas", sa.Column("monto_estimado", sa.Numeric(), nullable=False, server_default="0"))
    op.alter_column("personas_juridicas", "fuente_ingresos", server_default=None)
    op.alter_column("personas_juridicas", "rango_ingresos", server_default=None)
    op.alter_column("personas_juridicas", "origen_fondos", server_default=None)
    op.alter_column("personas_juridicas", "monto_estimado", server_default=None)


def downgrade():
    op.drop_column("personas_juridicas", "monto_estimado")
    op.drop_column("personas_juridicas", "origen_fondos")
    op.drop_column("personas_juridicas", "rango_ingresos")
    op.drop_column("personas_juridicas", "fuente_ingresos")
