from sqlalchemy import Column, String, Integer, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class Documento(Base):
    __tablename__ = "documentos"

    id_documento = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_cliente = Column(UUID(as_uuid=True), nullable=False)
    tipo_documento = Column(String, nullable=False)
    nombre_archivo = Column(String, nullable=False)
    ruta_archivo = Column(String, nullable=False)
    tamano_bytes = Column(Integer, nullable=True)
    formato = Column(String, nullable=False)
    estado = Column(String, nullable=False, default="PENDIENTE_VERIFICACION")
    fecha_carga = Column(TIMESTAMP, server_default=text("NOW()"))
    fecha_verificacion = Column(TIMESTAMP, nullable=True)
    usuario_verificador = Column(String, nullable=True)
    motivo_rechazo = Column(String, nullable=True)
