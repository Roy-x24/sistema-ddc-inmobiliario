from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    correo: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class UsuarioResponse(BaseModel):
    correo: str
    nombre: str
    rol: str

    class Config:
        from_attributes = True
