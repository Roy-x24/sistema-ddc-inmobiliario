from sqlalchemy import Column, String, Boolean, Numeric, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class BeneficiarioFinal(Base):
    __tablename__ = "beneficiarios_finales"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_cliente = Column(UUID(as_uuid=True), nullable=False)
    nombre_completo = Column(String, nullable=False)
    numero_documento = Column(String, nullable=False)
    nacionalidad = Column(String, nullable=False)
    porcentaje_participacion = Column(Numeric, nullable=False)
    tipo_control = Column(String, nullable=True)
    es_pep = Column(Boolean, default=False)
    es_relevante = Column(Boolean, default=False)
    estado_validacion = Column(String, nullable=False, default="PENDIENTE")
    validado_por = Column(String, nullable=True)
    motivo_rechazo = Column(String, nullable=True)
    fecha_validacion = Column(TIMESTAMP, nullable=True)
