from sqlalchemy import Column, String, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from app.database import Base


class Auditoria(Base):
    __tablename__ = "auditorias"

    id_auditoria = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario = Column(String, nullable=False)
    accion = Column(String, nullable=False)
    cliente_id = Column(UUID(as_uuid=True), nullable=True)
    valor_anterior = Column(String, nullable=True)
    valor_nuevo = Column(String, nullable=True)
    detalle = Column(JSONB, nullable=True)
    origen = Column(String, nullable=False, server_default=text("'humano'"))
    severidad = Column(String, nullable=False, server_default=text("'info'"))
    correlation_id = Column(String, nullable=True)
    version_regla = Column(String, nullable=True)
    fecha = Column(TIMESTAMP, server_default=text("NOW()"))
