from sqlalchemy import Column, String, Date
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class PersonaNatural(Base):
    __tablename__ = "personas_naturales"

    id = Column(UUID(as_uuid=True), primary_key=True)
    nombres = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    tipo_documento = Column(String, nullable=False)
    numero_documento = Column(String, unique=True, nullable=False)
    fecha_nacimiento = Column(Date, nullable=False)
    nacionalidad = Column(String, nullable=False)
    pais_residencia = Column(String, nullable=False)
    direccion = Column(String, nullable=False)
    telefono = Column(String, nullable=False)
    correo = Column(String, nullable=False)
    ocupacion = Column(String, nullable=False)
