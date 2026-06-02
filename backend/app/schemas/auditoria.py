from pydantic import BaseModel
from typing import Optional


class AuditoriaResponse(BaseModel):
    id_auditoria: str
    usuario: str
    accion: str
    cliente_id: Optional[str]
    valor_anterior: Optional[str]
    valor_nuevo: Optional[str]
    fecha: str

    class Config:
        from_attributes = True
