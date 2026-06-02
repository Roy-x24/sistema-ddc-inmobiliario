from sqlalchemy import Column, String, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class FactorRiesgo(Base):
    __tablename__ = "factores_riesgo"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version_id = Column(UUID(as_uuid=True), nullable=False)
    nombre_factor = Column(String, nullable=False)
    descripcion = Column(String, nullable=True)
    peso = Column(Integer, nullable=False)
    tipo = Column(String, nullable=False)
    activo = Column(Boolean, default=True)
