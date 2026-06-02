from sqlalchemy import Column, String, Numeric, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class PerfilFinanciero(Base):
    __tablename__ = "perfiles_financieros"

    id_perfil = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_cliente = Column(UUID(as_uuid=True), unique=True, nullable=False)
    fuente_ingresos = Column(String, nullable=False)
    rango_ingresos = Column(String, nullable=False)
    origen_fondos = Column(String, nullable=False)
    patrimonio_declarado = Column(Numeric, nullable=True)
    fecha_registro = Column(TIMESTAMP, server_default=text("NOW()"))
