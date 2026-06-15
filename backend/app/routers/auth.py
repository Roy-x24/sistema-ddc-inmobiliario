from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import obtener_db
from app.models.usuario import Usuario
from app.models.refresh_token import RefreshToken
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, UsuarioResponse, UsuarioCreate, UsuarioListItem, UsuarioUpdate, UsuarioUpdateRol
from app.core.security import (
    verificar_password, crear_token_jwt, decodificar_token_jwt,
    generar_refresh_token, hash_refresh_token, hash_password
)
from app.core.config import settings
from app.core.rbac import security, obtener_usuario_actual, requiere_rol
from app.services.auditoria_admin_service import registrar_auditoria_admin
import uuid as uuid_lib

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
def refresh_token(datos: RefreshRequest, db: Session = Depends(obtener_db)):
    refresh_hash = hash_refresh_token(datos.refresh_token)
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
def logout(datos: RefreshRequest, db: Session = Depends(obtener_db)):
    refresh_hash = hash_refresh_token(datos.refresh_token)
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


# ─── Gestion de usuarios (admin) ───

@router.get("/usuarios", response_model=list[UsuarioListItem])
def listar_usuarios(
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_usuarios"))
):
    usuarios = db.query(Usuario).filter(Usuario.eliminado == False).order_by(Usuario.nombre).all()
    return [
        UsuarioListItem(
            id=str(u.id),
            nombre=u.nombre,
            correo=u.correo,
            rol=u.rol,
            activo=u.activo
        )
        for u in usuarios
    ]


@router.post("/usuarios", response_model=UsuarioListItem)
def crear_usuario(
    datos: UsuarioCreate,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_usuarios"))
):
    existe = db.query(Usuario).filter(Usuario.correo == datos.correo).first()
    if existe:
        raise HTTPException(status_code=400, detail="El correo ya esta registrado")

    roles_validos = ["empleado", "oficial_cumplimiento", "auditor", "admin"]
    if datos.rol not in roles_validos:
        raise HTTPException(status_code=400, detail=f"Rol invalido. Use: {', '.join(roles_validos)}")

    nuevo = Usuario(
        id=uuid_lib.uuid4(),
        nombre=datos.nombre,
        correo=datos.correo,
        password_hash=hash_password(datos.password),
        rol=datos.rol,
        activo=True,
        eliminado=False
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    registrar_auditoria_admin(db, usuario.correo, "CREAR_USUARIO", {"correo": datos.correo, "rol": datos.rol})
    return UsuarioListItem(
        id=str(nuevo.id),
        nombre=nuevo.nombre,
        correo=nuevo.correo,
        rol=nuevo.rol,
        activo=nuevo.activo
    )


@router.patch("/usuarios/{user_id}/rol", response_model=UsuarioListItem)
def cambiar_rol_usuario(
    user_id: str,
    datos: UsuarioUpdateRol,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_usuarios"))
):
    target = db.query(Usuario).filter(Usuario.id == user_id, Usuario.eliminado == False).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    roles_validos = ["empleado", "oficial_cumplimiento", "auditor", "admin"]
    if datos.rol not in roles_validos:
        raise HTTPException(status_code=400, detail=f"Rol invalido. Use: {', '.join(roles_validos)}")

    target.rol = datos.rol
    db.commit()
    db.refresh(target)

    registrar_auditoria_admin(db, usuario.correo, "CAMBIAR_ROL", {"correo": target.correo, "rol": datos.rol})
    return UsuarioListItem(
        id=str(target.id),
        nombre=target.nombre,
        correo=target.correo,
        rol=target.rol,
        activo=target.activo
    )


@router.patch("/usuarios/{user_id}", response_model=UsuarioListItem)
def actualizar_usuario(
    user_id: str,
    datos: UsuarioUpdate,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_usuarios"))
):
    target = db.query(Usuario).filter(Usuario.id == user_id, Usuario.eliminado == False).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    cambios = {}

    if datos.nombre is not None:
        target.nombre = datos.nombre
        cambios["nombre"] = datos.nombre

    if datos.correo is not None and datos.correo != target.correo:
        existe = db.query(Usuario).filter(Usuario.correo == datos.correo, Usuario.id != target.id).first()
        if existe:
            raise HTTPException(status_code=400, detail="El correo ya esta registrado")
        target.correo = datos.correo
        cambios["correo"] = datos.correo

    if datos.password:
        target.password_hash = hash_password(datos.password)
        cambios["password"] = "actualizada"

    if datos.activo is not None:
        if str(target.id) == str(usuario.id) and datos.activo is False:
            raise HTTPException(status_code=400, detail="No puede desactivar su propio usuario")
        target.activo = datos.activo
        cambios["activo"] = datos.activo

    db.commit()
    db.refresh(target)

    if cambios:
        registrar_auditoria_admin(db, usuario.correo, "ACTUALIZAR_USUARIO", {"correo": target.correo, "cambios": cambios})

    return UsuarioListItem(
        id=str(target.id),
        nombre=target.nombre,
        correo=target.correo,
        rol=target.rol,
        activo=target.activo
    )


@router.delete("/usuarios/{user_id}")
def eliminar_usuario(
    user_id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("gestionar_usuarios"))
):
    target = db.query(Usuario).filter(Usuario.id == user_id, Usuario.eliminado == False).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if str(target.id) == str(usuario.id):
        raise HTTPException(status_code=400, detail="No puede eliminar su propio usuario")

    target.eliminado = True
    target.activo = False
    db.commit()

    registrar_auditoria_admin(db, usuario.correo, "ELIMINAR_USUARIO", {"correo": target.correo})
    return {"mensaje": "Usuario eliminado"}
