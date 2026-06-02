from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
import uuid


class DocumentoCreate(BaseModel):
    tipo_documento: str
    nombre_archivo: str
    formato: str


class DocumentoResponse(BaseModel):
    id_documento: str
    tipo_documento: str
    nombre_archivo: str
    formato: str
    estado: str
    fecha_carga: str
    usuario_verificador: Optional[str] = None
    motivo_rechazo: Optional[str] = None

    @field_validator('id_documento', mode='before')
    @classmethod
    def convertir_uuid(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    @field_validator('fecha_carga', mode='before')
    @classmethod
    def convertir_datetime(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v

    class Config:
        from_attributes = True
