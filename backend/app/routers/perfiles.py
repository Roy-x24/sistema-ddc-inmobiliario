from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import obtener_db
from app.models.perfil_financiero import PerfilFinanciero
from app.models.perfil_transaccional import PerfilTransaccional
from app.models.cliente import Cliente
from app.schemas.perfil import PerfilFinancieroCreate, PerfilFinancieroResponse, PerfilTransaccionalCreate, PerfilTransaccionalResponse
from app.routers.auth import obtener_usuario_actual
from app.models.usuario import Usuario
from app.services.auditoria_service import registrar_auditoria
from app.services.riesgo_service import calcular_riesgo_cliente

router = APIRouter(prefix="/clientes", tags=["Perfiles"])


def verificar_rol_empleado(usuario: Usuario):
    if usuario.rol not in ("empleado", "administrador"):
        raise HTTPException(status_code=403, detail="Solo empleados pueden realizar esta acción")


@router.post("/{id}/perfil-financiero")
def registrar_perfil_financiero(id: str, datos: PerfilFinancieroCreate, db: Session = Depends(obtener_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    verificar_rol_empleado(usuario)

    existe = db.query(PerfilFinanciero).filter(PerfilFinanciero.id_cliente == id).first()
    if existe:
        raise HTTPException(status_code=400, detail="El perfil financiero ya existe")

    perfil = PerfilFinanciero(
        id_cliente=id,
        fuente_ingresos=datos.fuente_ingresos,
        rango_ingresos=datos.rango_ingresos,
        origen_fondos=datos.origen_fondos,
        patrimonio_declarado=datos.patrimonio_declarado
    )
    db.add(perfil)
    db.commit()
    db.refresh(perfil)

    registrar_auditoria(db, usuario.correo, "REGISTRAR_PERFIL_FINANCIERO", id)

    # Disparar cálculo de riesgo si perfil transaccional existe
    pt = db.query(PerfilTransaccional).filter(PerfilTransaccional.id_cliente == id).first()
    if pt:
        calcular_riesgo_cliente(db, id, usuario.correo)

    return perfil


@router.get("/{id}/perfil-financiero", response_model=PerfilFinancieroResponse)
def obtener_perfil_financiero(id: str, db: Session = Depends(obtener_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    perfil = db.query(PerfilFinanciero).filter(PerfilFinanciero.id_cliente == id).first()
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil financiero no encontrado")
    return perfil


@router.post("/{id}/perfil-transaccional")
def registrar_perfil_transaccional(id: str, datos: PerfilTransaccionalCreate, db: Session = Depends(obtener_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    verificar_rol_empleado(usuario)

    if datos.monto_estimado <= 0:
        raise HTTPException(status_code=400, detail="El monto estimado debe ser mayor a 0")

    existe = db.query(PerfilTransaccional).filter(PerfilTransaccional.id_cliente == id).first()
    if existe:
        raise HTTPException(status_code=400, detail="El perfil transaccional ya existe")

    perfil = PerfilTransaccional(
        id_cliente=id,
        proposito_compra=datos.proposito_compra,
        monto_estimado=datos.monto_estimado,
        tipo_transaccion=datos.tipo_transaccion,
        tiene_financiamiento=datos.tiene_financiamiento,
        banco_financiamiento=datos.banco_financiamiento,
        monto_financiamiento=datos.monto_financiamiento
    )
    db.add(perfil)
    db.commit()
    db.refresh(perfil)

    registrar_auditoria(db, usuario.correo, "REGISTRAR_PERFIL_TRANSACCIONAL", id)

    # Disparar cálculo de riesgo si perfil financiero existe
    pf = db.query(PerfilFinanciero).filter(PerfilFinanciero.id_cliente == id).first()
    if pf:
        calcular_riesgo_cliente(db, id, usuario.correo)

    return perfil


@router.get("/{id}/perfil-transaccional", response_model=PerfilTransaccionalResponse)
def obtener_perfil_transaccional(id: str, db: Session = Depends(obtener_db), usuario: Usuario = Depends(obtener_usuario_actual)):
    perfil = db.query(PerfilTransaccional).filter(PerfilTransaccional.id_cliente == id).first()
    if not perfil:
        raise HTTPException(status_code=404, detail="Perfil transaccional no encontrado")
    return perfil
