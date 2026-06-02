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
    monto_total_propiedad: float
    metodo_pago_predominante: str
    tipo_operacion: str
    banco_origen_fondos: Optional[str] = None
    tiene_financiamiento: bool = False
    banco_financiamiento: Optional[str] = None
    monto_financiamiento: Optional[float] = None


class PerfilTransaccionalResponse(BaseModel):
    id_perfil: str
    monto_total_propiedad: float
    metodo_pago_predominante: str
    tipo_operacion: str
    banco_origen_fondos: Optional[str]
    tiene_financiamiento: bool
    banco_financiamiento: Optional[str]
    monto_financiamiento: Optional[float]
    fecha_registro: str

    class Config:
        from_attributes = True
