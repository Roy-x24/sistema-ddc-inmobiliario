from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import obtener_db
from app.models.usuario import Usuario
from app.core.security import decodificar_token_jwt

security = HTTPBearer()

ROLES_PERMITIDOS = {
    "registrar_cliente": ["empleado"],
    "consultar_clientes": ["empleado", "oficial_cumplimiento", "auditor"],
    "adjuntar_documentos": ["empleado"],
    "verificar_documentos": ["oficial_cumplimiento"],
    "rechazar_documentos": ["oficial_cumplimiento"],
    "registrar_bf": ["empleado"],
    "validar_bf": ["oficial_cumplimiento"],
    "rechazar_bf": ["oficial_cumplimiento"],
    "registrar_perfil_financiero": ["empleado"],
    "registrar_perfil_transaccional": ["empleado"],
    "ver_riesgo": ["oficial_cumplimiento", "auditor"],
    "activar_cliente": ["oficial_cumplimiento"],
    "rechazar_cliente": ["oficial_cumplimiento"],
    "bloquear_cliente": ["oficial_cumplimiento"],
    "desbloquear_cliente": ["oficial_cumplimiento"],
    "crear_observacion": ["oficial_cumplimiento"],
    "responder_observacion": ["empleado"],
    "cerrar_observacion": ["oficial_cumplimiento"],
    "ver_auditoria": ["oficial_cumplimiento", "auditor"],
    "exportar_csv_expediente": ["auditor"],
    "exportar_csv_admin": ["admin"],
    "gestionar_matriz": ["admin"],
    "crear_usuarios": ["admin"],
}


def obtener_usuario_actual(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(obtener_db)
):
    token = credentials.credentials
    payload = decodificar_token_jwt(token)
    correo = payload.get("sub")
    if not correo:
        raise HTTPException(status_code=401, detail="Token invalido")
    usuario = db.query(Usuario).filter(Usuario.correo == correo, Usuario.eliminado == False).first()
    if not usuario or not usuario.activo:
        raise HTTPException(status_code=401, detail="Usuario no encontrado o inactivo")
    return usuario


def requiere_rol(accion: str):
    def _verificar_rol(usuario: Usuario = Depends(obtener_usuario_actual)):
        roles = ROLES_PERMITIDOS.get(accion, [])
        if usuario.rol not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acceso denegado"
            )
        return usuario
    return _verificar_rol
