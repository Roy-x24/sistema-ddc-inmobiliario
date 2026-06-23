from sqlalchemy import Column, String, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from app.database import Base


class DocumentoValidacion(Base):
    __tablename__ = "documento_validaciones"

    id_validacion = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_documento = Column(UUID(as_uuid=True), nullable=False)
    id_cliente = Column(UUID(as_uuid=True), nullable=False)
    regla = Column(String, nullable=False)
    resultado = Column(String, nullable=False)
    confianza = Column(String, nullable=False)
    mensaje = Column(String, nullable=False)
    datos_extraidos = Column(JSONB, nullable=True)
    ejecutado_por = Column(String, nullable=False, default="sistema")
    version_regla = Column(String, nullable=False, default="documental-v1")
    fecha = Column(TIMESTAMP, server_default=text("NOW()"))
