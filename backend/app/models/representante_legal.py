from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class RepresentanteLegal(Base):
    __tablename__ = "representantes_legales"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_cliente = Column(UUID(as_uuid=True), nullable=False)
    nombre_completo = Column(String, nullable=False)
    numero_identificacion = Column(String, nullable=False)
    cargo = Column(String, nullable=False)
    poderes_otorgados = Column(String, nullable=False)
