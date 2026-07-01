from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List
from app.database import obtener_db
from app.models.cliente import Cliente
from app.models.persona_natural import PersonaNatural
from app.models.persona_juridica import PersonaJuridica
from app.models.representante_legal import RepresentanteLegal
from app.models.beneficiario_final import BeneficiarioFinal
from app.models.observacion import Observacion
from app.models.documento import Documento
from app.schemas.cliente import PersonaNaturalCreate, PersonaJuridicaCreate, ClienteListItem
from app.core.rbac import obtener_usuario_actual, requiere_rol
from app.models.usuario import Usuario
from app.services.auditoria_service import registrar_auditoria
from app.services.checklist_service import checklist_expediente
from app.services.estado_service import verificar_documentos_para_revision
from sqlalchemy import or_, func

router = APIRouter(prefix="/clientes", tags=["Clientes"])


def _cliente_list_item(db: Session, c: Cliente) -> ClienteListItem:
    nombre = None
    identificacion = None
    if c.tipo_cliente == "NATURAL":
        pn = db.query(PersonaNatural).filter(PersonaNatural.id == c.id_cliente).first()
        if pn:
            nombre = f"{pn.nombres} {pn.apellidos}"
            identificacion = pn.numero_documento
    else:
        pj = db.query(PersonaJuridica).filter(PersonaJuridica.id == c.id_cliente).first()
        if pj:
            nombre = pj.razon_social
            identificacion = pj.ruc
    return ClienteListItem(
        id_cliente=str(c.id_cliente),
        tipo_cliente=c.tipo_cliente,
        estado=c.estado,
        nivel_riesgo=c.nivel_riesgo,
        fecha_registro=str(c.fecha_registro),
        registrado_por=c.registrado_por,
        nombre=nombre,
        identificacion=identificacion
    )


@router.post("/natural")
def registrar_persona_natural(
    datos: PersonaNaturalCreate,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("registrar_cliente"))
):
    cliente = Cliente(
        tipo_cliente="NATURAL",
        es_pep=datos.es_pep,
        registrado_por=usuario.correo
    )
    db.add(cliente)
    db.commit()
    db.refresh(cliente)

    pn = PersonaNatural(
        id=cliente.id_cliente,
        nombres=datos.nombres,
        apellidos=datos.apellidos,
        tipo_documento=datos.tipo_documento,
        numero_documento=datos.numero_documento,
        fecha_nacimiento=datos.fecha_nacimiento,
        nacionalidad=datos.nacionalidad,
        pais_residencia=datos.pais_residencia,
        direccion=datos.direccion,
        telefono=datos.telefono,
        correo=datos.correo,
        ocupacion=datos.ocupacion,
        fuente_ingresos=datos.fuente_ingresos,
        rango_ingresos=datos.rango_ingresos,
        proposito_transaccion=datos.proposito_transaccion,
        origen_fondos=datos.origen_fondos,
        monto_estimado=datos.monto_estimado
    )
    db.add(pn)
    db.commit()

    registrar_auditoria(db, usuario.correo, "CREAR_CLIENTE", str(cliente.id_cliente), None, "PENDIENTE")
    return {"id_cliente": str(cliente.id_cliente), "estado": cliente.estado}


@router.post("/juridica")
def registrar_persona_juridica(
    datos: PersonaJuridicaCreate,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("registrar_cliente"))
):
    cliente = Cliente(
        tipo_cliente="JURIDICA",
        es_pep=datos.es_pep,
        estado="PENDIENTE_BF",
        registrado_por=usuario.correo
    )
    db.add(cliente)
    db.commit()
    db.refresh(cliente)

    pj = PersonaJuridica(
        id=cliente.id_cliente,
        razon_social=datos.razon_social,
        ruc=datos.ruc,
        tipo_pj=datos.tipo_pj,
        pais_constitucion=datos.pais_constitucion,
        actividad_economica=datos.actividad_economica,
        domicilio_legal=datos.domicilio_legal,
        telefono=datos.telefono,
        correo=datos.correo,
        proposito_adquisicion=datos.proposito_adquisicion,
        fuente_ingresos=datos.fuente_ingresos,
        rango_ingresos=datos.rango_ingresos,
        origen_fondos=datos.origen_fondos,
        monto_estimado=datos.monto_estimado
    )
    db.add(pj)

    rl = RepresentanteLegal(
        id_cliente=cliente.id_cliente,
        nombre_completo=datos.representante_legal.nombre_completo,
        numero_identificacion=datos.representante_legal.numero_identificacion,
        cargo=datos.representante_legal.cargo,
        poderes_otorgados=datos.representante_legal.poderes_otorgados
    )
    db.add(rl)

    for b in datos.beneficiarios_finales:
        bf = BeneficiarioFinal(
            id_cliente=cliente.id_cliente,
            nombre_completo=b.nombre_completo,
            numero_documento=b.numero_documento,
            nacionalidad=b.nacionalidad,
            porcentaje_participacion=b.porcentaje_participacion,
            tipo_control=b.tipo_control,
            es_pep=b.es_pep,
            es_relevante=(b.porcentaje_participacion >= 25)
        )
        db.add(bf)

    db.commit()

    registrar_auditoria(db, usuario.correo, "CREAR_CLIENTE", str(cliente.id_cliente), None, "PENDIENTE_BF")
    return {"id_cliente": str(cliente.id_cliente), "estado": cliente.estado}


@router.get("/", response_model=List[ClienteListItem])
def listar_clientes(
    busqueda: str = "",
    tipo: str = "",
    estado: str = "",
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes")),
    response: Response = None
):
    query = db.query(Cliente).filter(Cliente.eliminado == False)

    if tipo:
        query = query.filter(Cliente.tipo_cliente == tipo.upper())
    if estado:
        query = query.filter(Cliente.estado == estado.upper())
    if busqueda:
        # Build a subquery for nombre/identificacion matching
        pn_match = db.query(PersonaNatural).filter(
            or_(
                PersonaNatural.nombres.ilike(f"%{busqueda}%"),
                PersonaNatural.apellidos.ilike(f"%{busqueda}%"),
                PersonaNatural.numero_documento.ilike(f"%{busqueda}%")
            )
        ).subquery()
        pj_match = db.query(PersonaJuridica).filter(
            or_(
                PersonaJuridica.razon_social.ilike(f"%{busqueda}%"),
                PersonaJuridica.ruc.ilike(f"%{busqueda}%")
            )
        ).subquery()
        query = query.filter(
            or_(
                Cliente.registrado_por.ilike(f"%{busqueda}%"),
                Cliente.id_cliente.in_(db.query(pn_match.c.id)),
                Cliente.id_cliente.in_(db.query(pj_match.c.id))
            )
        )

    total = query.count()
    clientes = query.offset(skip).limit(limit).all()

    resultados = []
    for c in clientes:
        nombre = None
        identificacion = None
        if c.tipo_cliente == "NATURAL":
            pn = db.query(PersonaNatural).filter(PersonaNatural.id == c.id_cliente).first()
            if pn:
                nombre = f"{pn.nombres} {pn.apellidos}"
                identificacion = pn.numero_documento
        else:
            pj = db.query(PersonaJuridica).filter(PersonaJuridica.id == c.id_cliente).first()
            if pj:
                nombre = pj.razon_social
                identificacion = pj.ruc
        resultados.append(ClienteListItem(
            id_cliente=str(c.id_cliente),
            tipo_cliente=c.tipo_cliente,
            estado=c.estado,
            nivel_riesgo=c.nivel_riesgo,
            fecha_registro=str(c.fecha_registro),
            registrado_por=c.registrado_por,
            nombre=nombre,
            identificacion=identificacion
        ))

    if response is not None:
        response.headers["X-Total-Count"] = str(total)
    return resultados


@router.get("/con-observaciones", response_model=List[ClienteListItem])
def listar_clientes_con_observaciones(
    tipo: str = "",
    estado_observacion: str = "",
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    query = (
        db.query(Cliente)
        .join(Observacion, Observacion.id_cliente == Cliente.id_cliente)
        .filter(Cliente.eliminado == False)
        .distinct()
    )
    if tipo:
        query = query.filter(Cliente.tipo_cliente == tipo.upper())
    if estado_observacion:
        estado = estado_observacion.upper()
        if estado == "RESPONDIDA":
            query = query.filter(Observacion.estado == "ABIERTA", Observacion.respuesta.isnot(None))
        elif estado == "SIN_RESPUESTA":
            query = query.filter(Observacion.estado == "ABIERTA", Observacion.respuesta.is_(None))
        else:
            query = query.filter(Observacion.estado == estado)

    clientes = query.order_by(Cliente.fecha_registro.desc()).all()
    return [_cliente_list_item(db, c) for c in clientes]


@router.get("/con-beneficiarios", response_model=List[ClienteListItem])
def listar_clientes_con_beneficiarios(
    estado_validacion: str = "",
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    query = (
        db.query(Cliente)
        .join(BeneficiarioFinal, BeneficiarioFinal.id_cliente == Cliente.id_cliente)
        .filter(Cliente.eliminado == False, Cliente.tipo_cliente == "JURIDICA")
        .distinct()
    )
    if estado_validacion:
        query = query.filter(BeneficiarioFinal.estado_validacion == estado_validacion.upper())

    clientes = query.order_by(Cliente.fecha_registro.desc()).all()
    return [_cliente_list_item(db, c) for c in clientes]


@router.get("/con-documentos", response_model=List[ClienteListItem])
def listar_clientes_con_documentos(
    tipo: str = "",
    estado_documento: str = "",
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    query = (
        db.query(Cliente)
        .join(Documento, Documento.id_cliente == Cliente.id_cliente)
        .filter(Cliente.eliminado == False)
        .distinct()
    )
    if tipo:
        query = query.filter(Cliente.tipo_cliente == tipo.upper())
    if estado_documento:
        query = query.filter(Documento.estado == estado_documento.upper())

    clientes = query.order_by(Cliente.fecha_registro.desc()).all()
    return [_cliente_list_item(db, c) for c in clientes]


@router.get("/{id}")
def detalle_cliente(
    id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == id, Cliente.eliminado == False).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    data = {
        "id_cliente": str(cliente.id_cliente),
        "tipo_cliente": cliente.tipo_cliente,
        "estado": cliente.estado,
        "nivel_riesgo": cliente.nivel_riesgo,
        "es_pep": cliente.es_pep,
        "requiere_reevaluacion": cliente.requiere_reevaluacion,
        "fecha_registro": str(cliente.fecha_registro),
        "registrado_por": cliente.registrado_por
    }

    if cliente.tipo_cliente == "NATURAL":
        pn = db.query(PersonaNatural).filter(PersonaNatural.id == id).first()
        if pn:
            data["detalle"] = {
                "nombres": pn.nombres,
                "apellidos": pn.apellidos,
                "tipo_documento": pn.tipo_documento,
                "numero_documento": pn.numero_documento,
                "fecha_nacimiento": str(pn.fecha_nacimiento),
                "nacionalidad": pn.nacionalidad,
                "pais_residencia": pn.pais_residencia,
                "direccion": pn.direccion,
                "telefono": pn.telefono,
                "correo": pn.correo,
                "ocupacion": pn.ocupacion,
                "fuente_ingresos": pn.fuente_ingresos,
                "rango_ingresos": pn.rango_ingresos,
                "proposito_transaccion": pn.proposito_transaccion,
                "origen_fondos": pn.origen_fondos,
                "monto_estimado": float(pn.monto_estimado)
            }
    else:
        pj = db.query(PersonaJuridica).filter(PersonaJuridica.id == id).first()
        rl = db.query(RepresentanteLegal).filter(RepresentanteLegal.id_cliente == id).all()
        bf = db.query(BeneficiarioFinal).filter(BeneficiarioFinal.id_cliente == id).all()
        if pj:
            data["detalle"] = {
                "razon_social": pj.razon_social,
                "ruc": pj.ruc,
                "tipo_pj": pj.tipo_pj,
                "pais_constitucion": pj.pais_constitucion,
                "actividad_economica": pj.actividad_economica,
                "domicilio_legal": pj.domicilio_legal,
                "telefono": pj.telefono,
                "correo": pj.correo,
                "proposito_adquisicion": pj.proposito_adquisicion,
                "fuente_ingresos": pj.fuente_ingresos,
                "rango_ingresos": pj.rango_ingresos,
                "origen_fondos": pj.origen_fondos,
                "monto_estimado": float(pj.monto_estimado),
                "representantes_legales": [
                    {"nombre_completo": r.nombre_completo, "numero_identificacion": r.numero_identificacion, "cargo": r.cargo, "poderes_otorgados": r.poderes_otorgados}
                    for r in rl
                ],
                "beneficiarios_finales": [
                    {"nombre_completo": b.nombre_completo, "numero_documento": b.numero_documento, "nacionalidad": b.nacionalidad, "porcentaje_participacion": float(b.porcentaje_participacion), "tipo_control": b.tipo_control, "es_pep": b.es_pep, "es_relevante": b.es_relevante, "estado_validacion": b.estado_validacion}
                    for b in bf
                ]
            }

    return data


@router.post("/{id}/checklist")
def obtener_checklist_cliente(
    id: str,
    db: Session = Depends(obtener_db),
    usuario: Usuario = Depends(requiere_rol("consultar_clientes"))
):
    checklist = checklist_expediente(db, id)
    if not checklist:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return checklist
