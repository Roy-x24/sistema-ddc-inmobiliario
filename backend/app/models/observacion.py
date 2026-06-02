from sqlalchemy import Column, String, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class Observacion(Base):
    __tablename__ = "observaciones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_cliente = Column(UUID(as_uuid=True), nullable=False)
    descripcion = Column(String, nullable=False)
    respuesta = Column(String, nullable=True)
    estado = Column(String, nullable=False, default="ABIERTA")
    creada_por = Column(String, nullable=False)
    respondida_por = Column(String, nullable=True)
    fecha_creacion = Column(TIMESTAMP, server_default=text("NOW()"))
    fecha_respuesta = Column(TIMESTAMP, nullable=True)
    fecha_cierre = Column(TIMESTAMP, nullable=True)
