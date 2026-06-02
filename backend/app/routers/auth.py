from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import obtener_db
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, TokenResponse, UsuarioResponse
from app.core.security import verificar_password, crear_token_jwt, decodificar_token_jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from passlib.context import CryptContext

router = APIRouter(prefix="/auth", tags=["Autenticación"])
security = HTTPBearer()


def obtener_usuario_actual(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(obtener_db)
):
    token = credentials.credentials
    payload = decodificar_token_jwt(token)
    correo = payload.get("sub")
    if not correo:
        raise HTTPException(status_code=401, detail="Token inválido")
    usuario = db.query(Usuario).filter(Usuario.correo == correo).first()
    if not usuario or not usuario.activo:
        raise HTTPException(status_code=401, detail="Usuario no encontrado o inactivo")
    return usuario


@router.post("/login", response_model=TokenResponse)
def login(datos: LoginRequest, db: Session = Depends(obtener_db)):
    usuario = db.query(Usuario).filter(Usuario.correo == datos.correo).first()
    if not usuario or not verificar_password(datos.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = crear_token_jwt({"sub": usuario.correo, "rol": usuario.rol})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UsuarioResponse)
def me(usuario: Usuario = Depends(obtener_usuario_actual)):
    return usuario


class UsuarioCreate(BaseModel):
    nombre: str
    correo: str
    password: str
    rol: str


@router.get("/usuarios", response_model=list[UsuarioResponse])
def listar_usuarios(db: Session = Depends(obtener_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    if usuario.rol != "administrador":
        raise HTTPException(status_code=403, detail="Acceso denegado")
    return db.query(Usuario).all()


@router.post("/usuarios", response_model=UsuarioResponse)
def crear_usuario(datos: UsuarioCreate, db: Session = Depends(obtener_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    if usuario.rol != "administrador":
        raise HTTPException(status_code=403, detail="Acceso denegado")

    existe = db.query(Usuario).filter(Usuario.correo == datos.correo).first()
    if existe:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    from app.core.security import pwd_context
    password_hash = pwd_context.hash(datos.password)

    nuevo = Usuario(
        nombre=datos.nombre,
        correo=datos.correo,
        password_hash=password_hash,
        rol=datos.rol
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo
