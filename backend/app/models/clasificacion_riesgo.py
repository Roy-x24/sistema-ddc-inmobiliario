from sqlalchemy import Column, String, TIMESTAMP, text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from app.database import Base


class ClasificacionRiesgo(Base):
    __tablename__ = "clasificaciones_riesgo"

    id_clasificacion = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_cliente = Column(UUID(as_uuid=True), nullable=False)
    version_matriz_id = Column(UUID(as_uuid=True), nullable=True)
    nivel_riesgo = Column(String, nullable=False)
    puntaje_bruto = Column(Integer, nullable=True)
    puntaje_final = Column(Integer, nullable=True)
    justificacion = Column(String, nullable=False)
    factores_aplicados = Column(JSONB, nullable=True)
    fecha_calculo = Column(TIMESTAMP, server_default=text("NOW()"))
    es_automatica = Column(Boolean, default=True)
    recalculado_por = Column(String, nullable=True)
