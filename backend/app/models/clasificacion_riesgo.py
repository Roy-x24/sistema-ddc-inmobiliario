from sqlalchemy import Column, String, TIMESTAMP, text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from app.database import Base


class ClasificacionRiesgo(Base):
    __tablename__ = "clasificaciones_riesgo"

    id_clasificacion = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_cliente = Column(UUID(as_uuid=True), nullable=False)
    nivel_riesgo = Column(String, nullable=False)
    justificacion = Column(String, nullable=False)
    factores_aplicados = Column(JSONB, nullable=True)
    fecha_calculo = Column(TIMESTAMP, server_default=text("NOW()"))
    es_automatica = Column(Boolean, default=True)
    recalculado_por = Column(String, nullable=True)
