from sqlalchemy import Column, String, Boolean, Numeric
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
