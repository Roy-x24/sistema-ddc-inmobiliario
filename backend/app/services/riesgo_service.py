from sqlalchemy.orm import Session
from app.models.cliente import Cliente
from app.models.perfil_financiero import PerfilFinanciero
from app.models.perfil_transaccional import PerfilTransaccional
from app.models.persona_natural import PersonaNatural
from app.models.persona_juridica import PersonaJuridica
from app.models.clasificacion_riesgo import ClasificacionRiesgo
from app.models.version_matriz_riesgo import VersionMatrizRiesgo
from app.models.factor_riesgo import FactorRiesgo
from app.services.auditoria_service import registrar_auditoria

PAISES_RIESGO = {"IR", "KP", "SY", "AF", "BY", "MM", "RU"}


def obtener_version_activa(db: Session):
    return db.query(VersionMatrizRiesgo).filter(VersionMatrizRiesgo.esta_activa == True).first()


def calcular_riesgo_cliente(db: Session, cliente_id: str, usuario: str = "sistema"):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == cliente_id).first()
    if not cliente:
        return None

    perfil_financiero = db.query(PerfilFinanciero).filter(PerfilFinanciero.id_cliente == cliente_id).first()
    perfil_transaccional = db.query(PerfilTransaccional).filter(PerfilTransaccional.id_cliente == cliente_id).first()

    if not perfil_financiero or not perfil_transaccional:
        return None

    version = obtener_version_activa(db)
    if not version:
        # Fallback sin matriz versionada
        return _calcular_riesgo_cualitativo(db, cliente, perfil_financiero, perfil_transaccional, cliente_id, usuario)

    factores = db.query(FactorRiesgo).filter(
        FactorRiesgo.version_id == version.id,
        FactorRiesgo.activo == True
    ).all()

    puntaje_bruto = 0
    factores_aplicados_list = []
    bloqueante_activo = False

    # Bloqueantes
    if cliente.es_pep:
        bloqueante_activo = True
        factores_aplicados_list.append({"factor": "es_pep", "tipo": "bloqueante", "peso": 0, "aplicado": True})

    pais_riesgo = False
    if cliente.tipo_cliente == "NATURAL":
        pn = db.query(PersonaNatural).filter(PersonaNatural.id == cliente_id).first()
        if pn and pn.pais_residencia in PAISES_RIESGO:
            pais_riesgo = True
    else:
        pj = db.query(PersonaJuridica).filter(PersonaJuridica.id == cliente_id).first()
        if pj and pj.pais_constitucion in PAISES_RIESGO:
            pais_riesgo = True

    if pais_riesgo:
        bloqueante_activo = True
        factores_aplicados_list.append({"factor": "pais_riesgo", "tipo": "bloqueante", "peso": 0, "aplicado": True})

    if perfil_financiero.origen_fondos in ["efectivo", "desconocido", "otro_no_verificable"]:
        bloqueante_activo = True
        factores_aplicados_list.append({"factor": "origen_fondos_no_verificable", "tipo": "bloqueante", "peso": 0, "aplicado": True})

    # Puntaje
    for f in factores:
        if f.tipo == "bloqueante":
            continue
        aplicado = False
        # monto > 500k
        if f.nombre_factor == "monto_mayor_500k" and perfil_transaccional.monto_total_propiedad and perfil_transaccional.monto_total_propiedad > 500000:
            puntaje_bruto += f.peso
            aplicado = True
        # monto 100k-500k
        elif f.nombre_factor == "monto_100k_500k" and perfil_transaccional.monto_total_propiedad and 100000 <= perfil_transaccional.monto_total_propiedad <= 500000:
            puntaje_bruto += f.peso
            aplicado = True
        # pj extranjera compleja
        elif f.nombre_factor == "pj_extranjera_compleja" and cliente.tipo_cliente == "JURIDICA":
            pj = db.query(PersonaJuridica).filter(PersonaJuridica.id == cliente_id).first()
            if pj and pj.pais_constitucion != "PA" and pj.tipo_pj in ["fideicomiso", "fundacion"]:
                puntaje_bruto += f.peso
                aplicado = True
        # pj extranjera sa
        elif f.nombre_factor == "pj_extranjera_sa" and cliente.tipo_cliente == "JURIDICA":
            pj = db.query(PersonaJuridica).filter(PersonaJuridica.id == cliente_id).first()
            if pj and pj.pais_constitucion != "PA" and pj.tipo_pj in ["SA", "SRL"]:
                puntaje_bruto += f.peso
                aplicado = True
        # financiamiento bancario
        elif f.nombre_factor == "financiamiento_bancario" and perfil_transaccional.tiene_financiamiento:
            puntaje_bruto += f.peso
            aplicado = True
        # pj nacional docs
        elif f.nombre_factor == "pj_nacional_docs" and cliente.tipo_cliente == "JURIDICA":
            pj = db.query(PersonaJuridica).filter(PersonaJuridica.id == cliente_id).first()
            if pj and pj.pais_constitucion == "PA":
                puntaje_bruto += f.peso
                aplicado = True
        # ingresos consistentes
        elif f.nombre_factor == "ingresos_consistentes":
            # simplificado: siempre aplicable como mitigante si hay perfil financiero
            puntaje_bruto += f.peso
            aplicado = True

        if aplicado:
            factores_aplicados_list.append({"factor": f.nombre_factor, "tipo": f.tipo, "peso": f.peso, "aplicado": True})

    puntaje_bruto = min(puntaje_bruto, 100)
    puntaje_final = max(puntaje_bruto, 0)

    if bloqueante_activo:
        nivel = "ALTO"
        justificacion = "ALTO por factor bloqueante: " + "; ".join([fa["factor"] for fa in factores_aplicados_list if fa["tipo"] == "bloqueante"])
    else:
        if puntaje_final < 30:
            nivel = "BAJO"
        elif puntaje_final < 70:
            nivel = "ESTANDAR"
        else:
            nivel = "ALTO"
        justificacion = "; ".join([f"{fa['factor']} ({fa['peso']})" for fa in factores_aplicados_list if fa["aplicado"] and fa["tipo"] != "bloqueante"])
        if not justificacion:
            justificacion = "Sin factores de riesgo aplicables"

    clasificacion = ClasificacionRiesgo(
        id_cliente=cliente_id,
        version_matriz_id=version.id if version else None,
        nivel_riesgo=nivel,
        puntaje_bruto=puntaje_bruto,
        puntaje_final=puntaje_final,
        justificacion=justificacion,
        factores_aplicados={"factores": factores_aplicados_list},
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


def _calcular_riesgo_cualitativo(db, cliente, perfil_financiero, perfil_transaccional, cliente_id, usuario):
    # Fallback legacy si no hay matriz versionada
    factores = []
    nivel = "BAJO"

    if cliente.es_pep:
        nivel = "ALTO"
        factores.append("Cliente es PEP")

    pais_riesgo = False
    if cliente.tipo_cliente == "NATURAL":
        pn = db.query(PersonaNatural).filter(PersonaNatural.id == cliente_id).first()
        if pn and pn.pais_residencia in PAISES_RIESGO:
            pais_riesgo = True
    else:
        pj = db.query(PersonaJuridica).filter(PersonaJuridica.id == cliente_id).first()
        if pj and pj.pais_constitucion in PAISES_RIESGO:
            pais_riesgo = True

    if pais_riesgo:
        nivel = "ALTO"
        factores.append("Pais de residencia/constitucion en lista de riesgo")

    if perfil_transaccional.monto_total_propiedad and perfil_transaccional.monto_total_propiedad > 500000:
        nivel = "ALTO"
        factores.append("Monto de transaccion mayor a $500,000 USD")

    if perfil_financiero.origen_fondos in ["efectivo", "desconocido", "otro_no_verificable"]:
        nivel = "ALTO"
        factores.append("Origen de fondos no verificable o en efectivo")

    if cliente.tipo_cliente == "JURIDICA":
        pj = db.query(PersonaJuridica).filter(PersonaJuridica.id == cliente_id).first()
        if pj and pj.pais_constitucion != "PA" and pj.tipo_pj in ["fideicomiso", "fundacion"]:
            if nivel != "ALTO":
                nivel = "ALTO"
            factores.append("PJ extranjera con estructura compleja")

    if nivel != "ALTO":
        monto = perfil_transaccional.monto_total_propiedad or 0
        if 100000 <= monto <= 500000:
            nivel = "ESTANDAR"
            factores.append("Monto entre $100,000 y $500,000")
        if cliente.tipo_cliente == "JURIDICA":
            pj = db.query(PersonaJuridica).filter(PersonaJuridica.id == cliente_id).first()
            if pj and pj.pais_constitucion == "PA":
                nivel = "ESTANDAR"
                factores.append("PJ nacional con documentacion completa")

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

    registrar_auditoria(db, usuario, "CALCULAR_RIESGO", str(cliente_id), None, nivel)
    return clasificacion
