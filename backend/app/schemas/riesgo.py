from pydantic import BaseModel
from typing import Optional, Dict, Any


class RiesgoResponse(BaseModel):
    id_clasificacion: str
    nivel_riesgo: str
    justificacion: str
    factores_aplicados: Optional[Dict[str, Any]]
    fecha_calculo: str
    es_automatica: bool

    class Config:
        from_attributes = True
