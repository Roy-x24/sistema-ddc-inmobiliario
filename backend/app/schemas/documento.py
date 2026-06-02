from pydantic import BaseModel
from typing import Optional


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

    class Config:
        from_attributes = True
