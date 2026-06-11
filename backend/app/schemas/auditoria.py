from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class AuditoriaResponse(BaseModel):
    id_auditoria: UUID
    usuario: str
    accion: str
    cliente_id: Optional[UUID]
    valor_anterior: Optional[str]
    valor_nuevo: Optional[str]
    fecha: datetime

    class Config:
        from_attributes = True
