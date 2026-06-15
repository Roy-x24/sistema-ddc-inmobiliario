from sqlalchemy import Column, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class PersonaJuridica(Base):
    __tablename__ = "personas_juridicas"

    id = Column(UUID(as_uuid=True), primary_key=True)
    razon_social = Column(String, nullable=False)
    ruc = Column(String, unique=True, nullable=False)
    tipo_pj = Column(String, nullable=False)
    pais_constitucion = Column(String, nullable=False)
    actividad_economica = Column(String, nullable=False)
    domicilio_legal = Column(String, nullable=False)
    telefono = Column(String, nullable=False)
    correo = Column(String, nullable=False)
    proposito_adquisicion = Column(String, nullable=False)
    fuente_ingresos = Column(String, nullable=False)
    rango_ingresos = Column(String, nullable=False)
    origen_fondos = Column(String, nullable=False)
    monto_estimado = Column(Numeric, nullable=False)
