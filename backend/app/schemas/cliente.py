from pydantic import BaseModel, Field
from datetime import date
from typing import List, Optional


class PersonaNaturalCreate(BaseModel):
    nombres: str
    apellidos: str
    tipo_documento: str
    numero_documento: str
    fecha_nacimiento: date
    nacionalidad: str
    pais_residencia: str
    direccion: str
    telefono: str
    correo: str
    ocupacion: str
    es_pep: bool = False
    fuente_ingresos: str
    rango_ingresos: str
    proposito_transaccion: str
    origen_fondos: str
    monto_estimado: float


class RepresentanteLegalCreate(BaseModel):
    nombre_completo: str
    numero_identificacion: str
    cargo: str
    poderes_otorgados: str


class BeneficiarioFinalCreate(BaseModel):
    nombre_completo: str
    numero_documento: str
    nacionalidad: str
    porcentaje_participacion: float
    tipo_control: Optional[str] = None
    es_pep: bool = False


class PersonaJuridicaCreate(BaseModel):
    razon_social: str
    ruc: str
    tipo_pj: str
    pais_constitucion: str
    actividad_economica: str
    domicilio_legal: str
    telefono: str
    correo: str
    proposito_adquisicion: str
    representante_legal: RepresentanteLegalCreate
    beneficiarios_finales: List[BeneficiarioFinalCreate]
    es_pep: bool = False
    fuente_ingresos: str
    rango_ingresos: str
    origen_fondos: str
    monto_estimado: float


class ClienteListItem(BaseModel):
    id_cliente: str
    tipo_cliente: str
    estado: str
    nivel_riesgo: Optional[str]
    fecha_registro: str
    registrado_por: str
    nombre: Optional[str] = None
    identificacion: Optional[str] = None

    class Config:
        from_attributes = True
