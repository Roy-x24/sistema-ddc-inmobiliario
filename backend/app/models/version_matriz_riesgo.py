from sqlalchemy import Column, String, Boolean, TIMESTAMP, text, Integer
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class VersionMatrizRiesgo(Base):
    __tablename__ = "versiones_matriz_riesgo"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version_numero = Column(Integer, nullable=False)
    descripcion = Column(String, nullable=True)
    esta_activa = Column(Boolean, default=False)
    publicada_por = Column(String, nullable=True)
    fecha_publicacion = Column(TIMESTAMP, server_default=text("NOW()"))
