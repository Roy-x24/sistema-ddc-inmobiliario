from sqlalchemy import Column, String, Numeric, Boolean, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class PerfilTransaccional(Base):
    __tablename__ = "perfiles_transaccionales"

    id_perfil = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_cliente = Column(UUID(as_uuid=True), unique=True, nullable=False)
    proposito_compra = Column(String, nullable=False)
    monto_estimado = Column(Numeric, nullable=False)
    tipo_transaccion = Column(String, nullable=False)
    tiene_financiamiento = Column(Boolean, default=False)
    banco_financiamiento = Column(String, nullable=True)
    monto_financiamiento = Column(Numeric, nullable=True)
    fecha_registro = Column(TIMESTAMP, server_default=text("NOW()"))
