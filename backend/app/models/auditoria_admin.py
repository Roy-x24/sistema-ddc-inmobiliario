from sqlalchemy import Column, String, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from app.database import Base


class AuditoriaAdmin(Base):
    __tablename__ = "auditorias_admin"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario = Column(String, nullable=False)
    accion = Column(String, nullable=False)
    detalle = Column(JSONB, nullable=True)
    fecha = Column(TIMESTAMP, server_default=text("NOW()"))
