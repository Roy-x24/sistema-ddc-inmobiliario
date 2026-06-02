from pydantic import BaseModel
from typing import Optional


class ObservacionCreate(BaseModel):
    descripcion: str


class ObservacionResponse(BaseModel):
    id: str
    id_cliente: str
    descripcion: str
    respuesta: Optional[str]
    estado: str
    creada_por: str
    respondida_por: Optional[str]
    fecha_creacion: str
    fecha_respuesta: Optional[str]
    fecha_cierre: Optional[str]

    class Config:
        from_attributes = True
