from pydantic import BaseModel
from typing import Optional


class PerfilFinancieroCreate(BaseModel):
    fuente_ingresos: str
    rango_ingresos: str
    origen_fondos: str
    patrimonio_declarado: Optional[float] = None


class PerfilFinancieroResponse(BaseModel):
    id_perfil: str
    fuente_ingresos: str
    rango_ingresos: str
    origen_fondos: str
    patrimonio_declarado: Optional[float]
    fecha_registro: str

    class Config:
        from_attributes = True


class PerfilTransaccionalCreate(BaseModel):
    proposito_compra: str
    monto_estimado: float
    tipo_transaccion: str
    tiene_financiamiento: bool = False
    banco_financiamiento: Optional[str] = None
    monto_financiamiento: Optional[float] = None


class PerfilTransaccionalResponse(BaseModel):
    id_perfil: str
    proposito_compra: str
    monto_estimado: float
    tipo_transaccion: str
    tiene_financiamiento: bool
    banco_financiamiento: Optional[str]
    monto_financiamiento: Optional[float]
    fecha_registro: str

    class Config:
        from_attributes = True
