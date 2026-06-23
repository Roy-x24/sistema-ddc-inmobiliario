from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import csv
import io
from fastapi.responses import StreamingResponse
from app.database import obtener_db
from app.models.auditoria import Auditoria
from app.models.auditoria_admin import AuditoriaAdmin
from app.schemas.auditoria import AuditoriaResponse
from app.core.rbac import obtener_usuario_actual, requiere_rol
from app.models.usuario import Usuario
from app.services.auditoria_admin_service import registrar_auditoria_admin

router = APIRouter(tags=["Auditoria"])


@router.get("/clientes/{id}/auditoria", response_model=List[AuditoriaResponse])
def auditoria_por_cliente(
    id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("ver_auditoria"))
):
    registros = db.query(Auditoria).filter(Auditoria.cliente_id == id).order_by(Auditoria.fecha.desc()).all()
    return registros


@router.get("/auditoria", response_model=List[AuditoriaResponse])
def auditoria_global(
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("ver_auditoria"))
):
    registros = db.query(Auditoria).order_by(Auditoria.fecha.desc()).limit(200).all()
    return registros


@router.get("/auditoria/exportar-csv")
def exportar_csv_expediente(
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("exportar_csv_expediente"))
):
    registros = db.query(Auditoria).order_by(Auditoria.fecha.desc()).limit(5000).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id_auditoria", "usuario", "accion", "cliente_id", "valor_anterior",
        "valor_nuevo", "origen", "severidad", "correlation_id",
        "version_regla", "detalle", "fecha"
    ])
    for r in registros:
        writer.writerow([
            str(r.id_auditoria),
            r.usuario,
            r.accion,
            str(r.cliente_id) if r.cliente_id else "",
            r.valor_anterior or "",
            r.valor_nuevo or "",
            r.origen or "",
            r.severidad or "",
            r.correlation_id or "",
            r.version_regla or "",
            str(r.detalle) if r.detalle else "",
            str(r.fecha)
        ])
    output.seek(0)
    registrar_auditoria_admin(db, usuario.correo, "EXPORTAR_CSV_EXPEDIENTE")
    return StreamingResponse(io.BytesIO(output.getvalue().encode()), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=auditoria_expediente.csv"})


@router.get("/auditoria-admin")
def auditoria_admin(
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("exportar_csv_admin"))
):
    registros = db.query(AuditoriaAdmin).order_by(AuditoriaAdmin.fecha.desc()).limit(200).all()
    return registros


@router.get("/auditoria-admin/exportar-csv")
def exportar_csv_admin(
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("exportar_csv_admin"))
):
    registros = db.query(AuditoriaAdmin).order_by(AuditoriaAdmin.fecha.desc()).limit(5000).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "usuario", "accion", "detalle", "fecha"])
    for r in registros:
        writer.writerow([str(r.id), r.usuario, r.accion, str(r.detalle) if r.detalle else "", str(r.fecha)])
    output.seek(0)
    registrar_auditoria_admin(db, usuario.correo, "EXPORTAR_CSV_ADMIN")
    return StreamingResponse(io.BytesIO(output.getvalue().encode()), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=auditoria_admin.csv"})
