from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    correo: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UsuarioResponse(BaseModel):
    correo: str
    nombre: str
    rol: str

    class Config:
        from_attributes = True


class UsuarioCreate(BaseModel):
    nombre: str
    correo: str
    password: str
    rol: str


class UsuarioListItem(BaseModel):
    id: str
    nombre: str
    correo: str
    rol: str
    activo: bool

    class Config:
        from_attributes = True


class UsuarioUpdateRol(BaseModel):
    rol: str


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    correo: Optional[str] = None
    password: Optional[str] = None
    activo: Optional[bool] = None
