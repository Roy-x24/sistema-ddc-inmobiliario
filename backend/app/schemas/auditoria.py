from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from uuid import UUID


class AuditoriaResponse(BaseModel):
    id_auditoria: UUID
    usuario: str
    accion: str
    cliente_id: Optional[UUID]
    valor_anterior: Optional[str]
    valor_nuevo: Optional[str]
    detalle: Optional[dict[str, Any]] = None
    origen: str = "humano"
    severidad: str = "info"
    correlation_id: Optional[str] = None
    version_regla: Optional[str] = None
    fecha: datetime

    class Config:
        from_attributes = True
