from sqlalchemy import Column, String, Boolean, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id_cliente = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tipo_cliente = Column(String, nullable=False)
    nivel_riesgo = Column(String, nullable=True)
    estado = Column(String, nullable=False, default="PENDIENTE")
    es_pep = Column(Boolean, default=False)
    requiere_reevaluacion = Column(Boolean, default=False)
    fecha_registro = Column(TIMESTAMP, server_default=text("NOW()"))
    fecha_actualizacion = Column(TIMESTAMP, server_default=text("NOW()"))
    eliminado = Column(Boolean, default=False)
    registrado_por = Column(String, nullable=False)
