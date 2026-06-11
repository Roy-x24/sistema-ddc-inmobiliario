from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class RiesgoResponse(BaseModel):
    id_clasificacion: UUID
    nivel_riesgo: str
    justificacion: str
    factores_aplicados: Optional[Dict[str, Any]]
    fecha_calculo: datetime
    es_automatica: bool

    class Config:
        from_attributes = True
