from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import obtener_db
from app.models.usuario import Usuario
from app.models.refresh_token import RefreshToken
from app.schemas.auth import LoginRequest, TokenResponse, UsuarioResponse
from app.core.security import (
    verificar_password, crear_token_jwt, decodificar_token_jwt,
    generar_refresh_token, hash_refresh_token
)
from app.core.config import settings
from app.core.rbac import security, obtener_usuario_actual
from app.services.auditoria_admin_service import registrar_auditoria_admin

router = APIRouter(prefix="/auth", tags=["Autenticacion"])


@router.post("/login", response_model=TokenResponse)
def login(datos: LoginRequest, db: Session = Depends(obtener_db)):
    usuario = db.query(Usuario).filter(Usuario.correo == datos.correo, Usuario.eliminado == False).first()
    if not usuario or not verificar_password(datos.password, usuario.password_hash):
        registrar_auditoria_admin(db, datos.correo, "LOGIN_FALLIDO", {"razon": "credenciales_invalidas"})
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    # Revocar tokens previos
    db.query(RefreshToken).filter(
        RefreshToken.usuario_id == usuario.id,
        RefreshToken.revocado == False
    ).update({"revocado": True})
    db.commit()

    access_token = crear_token_jwt({"sub": usuario.correo, "rol": usuario.rol})
    refresh_raw = generar_refresh_token()
    refresh_hash = hash_refresh_token(refresh_raw)

    rt = RefreshToken(
        usuario_id=usuario.id,
        token_hash=refresh_hash,
        fecha_expiracion=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(rt)
    db.commit()

    registrar_auditoria_admin(db, usuario.correo, "LOGIN_EXITOSO")
    return {"access_token": access_token, "refresh_token": refresh_raw, "token_type": "bearer"}


@router.post("/refresh")
def refresh_token(refresh_token: str, db: Session = Depends(obtener_db)):
    refresh_hash = hash_refresh_token(refresh_token)
    rt = db.query(RefreshToken).filter(
        RefreshToken.token_hash == refresh_hash,
        RefreshToken.revocado == False
    ).first()

    if not rt or rt.fecha_expiracion < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Refresh token invalido o expirado")

    usuario = db.query(Usuario).filter(Usuario.id == rt.usuario_id, Usuario.activo == True, Usuario.eliminado == False).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    access_token = crear_token_jwt({"sub": usuario.correo, "rol": usuario.rol})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
def logout(refresh_token: str, db: Session = Depends(obtener_db)):
    refresh_hash = hash_refresh_token(refresh_token)
    rt = db.query(RefreshToken).filter(RefreshToken.token_hash == refresh_hash).first()
    if rt:
        rt.revocado = True
        db.commit()
        usuario = db.query(Usuario).filter(Usuario.id == rt.usuario_id).first()
        if usuario:
            registrar_auditoria_admin(db, usuario.correo, "LOGOUT")
    return {"mensaje": "Sesion cerrada"}


@router.get("/me", response_model=UsuarioResponse)
def me(usuario: Usuario = Depends(obtener_usuario_actual)):
    return usuario
