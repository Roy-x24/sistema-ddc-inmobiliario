from sqlalchemy.orm import Session
from app.models.cliente import Cliente
from app.models.perfil_financiero import PerfilFinanciero
from app.models.perfil_transaccional import PerfilTransaccional
from app.models.clasificacion_riesgo import ClasificacionRiesgo
from app.services.auditoria_service import registrar_auditoria

PAISES_RIESGO = {"IR", "KP", "SY", "AF", "BY", "MM", "RU"}


def calcular_riesgo_cliente(db: Session, cliente_id: str, usuario: str = "sistema"):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == cliente_id).first()
    if not cliente:
        return None

    perfil_financiero = db.query(PerfilFinanciero).filter(PerfilFinanciero.id_cliente == cliente_id).first()
    perfil_transaccional = db.query(PerfilTransaccional).filter(PerfilTransaccional.id_cliente == cliente_id).first()

    if not perfil_financiero or not perfil_transaccional:
        return None

    factores = []
    nivel = "BAJO"

    # Reglas de ALTO
    if cliente.es_pep:
        nivel = "ALTO"
        factores.append("Cliente es PEP")

    pais_riesgo = False
    if cliente.tipo_cliente == "NATURAL":
        from app.models.persona_natural import PersonaNatural
        pn = db.query(PersonaNatural).filter(PersonaNatural.id == cliente_id).first()
        if pn and pn.pais_residencia in PAISES_RIESGO:
            pais_riesgo = True
    else:
        from app.models.persona_juridica import PersonaJuridica
        pj = db.query(PersonaJuridica).filter(PersonaJuridica.id == cliente_id).first()
        if pj and pj.pais_constitucion in PAISES_RIESGO:
            pais_riesgo = True

    if pais_riesgo:
        nivel = "ALTO"
        factores.append("País de residencia/constitución en lista de riesgo")

    if perfil_transaccional.monto_estimado and perfil_transaccional.monto_estimado > 500000:
        nivel = "ALTO"
        factores.append("Monto de transacción mayor a $500,000 USD")

    if perfil_financiero.origen_fondos in ["efectivo", "desconocido", "otro_no_verificable"]:
        nivel = "ALTO"
        factores.append("Origen de fondos no verificable o en efectivo")

    if cliente.tipo_cliente == "JURIDICA":
        from app.models.persona_juridica import PersonaJuridica
        pj = db.query(PersonaJuridica).filter(PersonaJuridica.id == cliente_id).first()
        if pj and pj.pais_constitucion != "PA" and pj.tipo_pj in ["fideicomiso", "fundacion"]:
            if nivel != "ALTO":
                nivel = "ALTO"
            factores.append("PJ extranjera con estructura compleja")

    # Si no es ALTO, evaluar ESTÁNDAR
    if nivel != "ALTO":
        monto = perfil_transaccional.monto_estimado or 0
        if 100000 <= monto <= 500000:
            nivel = "ESTANDAR"
            factores.append("Monto entre $100,000 y $500,000")

        if cliente.tipo_cliente == "JURIDICA":
            from app.models.persona_juridica import PersonaJuridica
            pj = db.query(PersonaJuridica).filter(PersonaJuridica.id == cliente_id).first()
            if pj and pj.pais_constitucion == "PA":
                nivel = "ESTANDAR"
                factores.append("PJ nacional con documentación completa")

    if not factores:
        factores.append("Cliente nacional, ingresos verificables, monto menor a $100,000")

    justificacion = "; ".join(factores)

    clasificacion = ClasificacionRiesgo(
        id_cliente=cliente_id,
        nivel_riesgo=nivel,
        justificacion=justificacion,
        factores_aplicados={"factores": factores},
        es_automatica=True,
        recalculado_por=None
    )
    db.add(clasificacion)

    cliente.nivel_riesgo = nivel
    db.commit()
    db.refresh(clasificacion)

    registrar_auditoria(
        db=db,
        usuario=usuario,
        accion="CALCULAR_RIESGO",
        cliente_id=str(cliente_id),
        valor_anterior=None,
        valor_nuevo=nivel
    )

    return clasificacion
