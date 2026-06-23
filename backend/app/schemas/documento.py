from pydantic import BaseModel, field_validator
from typing import Optional, Any
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
    confianza_validacion: Optional[str] = None
    resumen_validacion: Optional[str] = None
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


class DocumentoValidacionResponse(BaseModel):
    id_validacion: str
    id_documento: str
    id_cliente: str
    regla: str
    resultado: str
    confianza: str
    mensaje: str
    datos_extraidos: Optional[dict[str, Any]] = None
    ejecutado_por: str
    version_regla: str
    fecha: str

    @field_validator('id_validacion', 'id_documento', 'id_cliente', mode='before')
    @classmethod
    def convertir_uuid_validacion(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    @field_validator('fecha', mode='before')
    @classmethod
    def convertir_datetime_validacion(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v

    class Config:
        from_attributes = True
