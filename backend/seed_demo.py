import os
import uuid
import hashlib
import json
import bcrypt
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Configurar conexion a la base de datos desde variables de entorno o default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ddc_user:ddc_pass@localhost:5432/ddc_db")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
DEMO_USER = "demo_empleado@ddc.com"
OFICIAL_USER = "oficial@ddc.com"
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")

def crear_usuario_demo(email, nombre, rol, password_plano):
    password_hash = bcrypt.hashpw(password_plano.encode(), bcrypt.gensalt(12)).decode()
    with engine.connect() as conn:
        conn.execute(text("""
            INSERT INTO usuarios (nombre, correo, password_hash, rol)
            VALUES (:nombre, :correo, :password_hash, :rol)
            ON CONFLICT (correo) DO NOTHING
        """), {"nombre": nombre, "correo": email, "password_hash": password_hash, "rol": rol})
        conn.commit()

def _demo_uuid(etiqueta):
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"ddc-demo-{etiqueta}"))

def _generar_clientes_naturales_extra():
    nombres = [
        ("Daniel", "Serrano Lopez", "Analista financiero"),
        ("Gabriela", "Ponce Villarreal", "Abogada"),
        ("Ricardo", "Navarro Solis", "Empresario"),
        ("Isabel", "Cordero Batista", "Contadora"),
        ("Fernando", "Arias Molina", "Gerente comercial"),
        ("Natalia", "Ramos Delgado", "Disenadora"),
        ("Eduardo", "Torres Marin", "Constructor"),
        ("Valentina", "Castro Vega", "Administradora"),
        ("Oscar", "Moreno Ibarra", "Consultor logistico"),
        ("Camila", "Herrera Campos", "Odontologa"),
    ]
    estados = ["PENDIENTE", "EN_REVISION", "ACTIVO", "OBSERVADO", "PENDIENTE"]
    niveles = ["BAJO", "ESTANDAR", "BAJO", "ALTO", "ESTANDAR"]
    montos = [78000, 145000, 92000, 610000, 275000, 118000, 520000, 88000, 330000, 205000]
    clientes = []

    for indice, (nombre, apellido, ocupacion) in enumerate(nombres, start=6):
        posicion = indice - 6
        clientes.append({
            "id": _demo_uuid(f"natural-{indice}"),
            "estado": estados[posicion % len(estados)],
            "nivel_riesgo": niveles[posicion % len(niveles)],
            "es_pep": indice in (9, 12),
            "nombres": nombre,
            "apellidos": apellido,
            "tipo_documento": "CEDULA",
            "numero_documento": f"8-800-{1000 + indice}",
            "fecha_nacimiento": f"{1975 + posicion}-0{(posicion % 9) + 1}-15",
            "nacionalidad": "PA",
            "pais_residencia": "PA",
            "direccion": f"Panama, sector demo {indice}, calle {20 + indice}",
            "telefono": f"6000-{1000 + indice}",
            "correo": f"{nombre.lower()}.{apellido.split()[0].lower()}.demo@ddc.com",
            "ocupacion": ocupacion,
            "fuente_ingresos": "salario" if posicion % 2 == 0 else "negocio_propio",
            "rango_ingresos": "2500-5000" if montos[posicion] < 100000 else "5000-10000",
            "proposito_transaccion": "compra_vivienda" if posicion % 2 == 0 else "inversion_inmobiliaria",
            "origen_fondos": "ahorros" if posicion % 3 else "utilidades_negocio",
            "monto_estimado": montos[posicion],
        })
    return clientes

def _generar_clientes_juridicos_extra():
    empresas = [
        ("Agroindustrias Valle Verde, S.A.", "Agricultura", "PA", "SA", 240000),
        ("Tecnologia Canal Digital, S.A.", "Tecnologia", "PA", "SA", 420000),
        ("Marina Norte Holdings Ltd.", "Tenencia de activos", "VG", "SA", 690000),
        ("Fundacion Patrimonial Alba", "Administracion patrimonial", "LI", "fundacion", 980000),
        ("Distribuidora Metro Centro, S.A.", "Distribucion", "PA", "SA", 160000),
        ("Hoteles Bahia Serena, S.A.", "Hoteleria", "PA", "SA", 575000),
        ("Comercializadora Altamar, S.R.L.", "Comercio internacional", "CR", "SRL", 310000),
        ("Inmobiliaria Los Lagos, S.A.", "Bienes raices", "PA", "SA", 265000),
        ("Fideicomiso Costa Dorada", "Fideicomiso inmobiliario", "KY", "fideicomiso", 1320000),
        ("Servicios Medicos Integral, S.A.", "Servicios medicos", "PA", "SA", 190000),
    ]
    estados = ["PENDIENTE_BF", "EN_REVISION", "OBSERVADO", "OBSERVADO", "ACTIVO"]
    niveles = ["ESTANDAR", "ESTANDAR", "ALTO", "ALTO", "BAJO"]
    clientes = []

    for indice, (razon, actividad, pais, tipo_pj, monto) in enumerate(empresas, start=6):
        posicion = indice - 6
        representante = f"Representante Demo {indice}"
        beneficiario = f"Beneficiario Demo {indice}"
        clientes.append({
            "id": _demo_uuid(f"juridica-{indice}"),
            "estado": estados[posicion % len(estados)],
            "nivel_riesgo": niveles[posicion % len(niveles)],
            "es_pep": False,
            "razon_social": razon,
            "ruc": f"155700{1000 + indice}-2-2026",
            "tipo_pj": tipo_pj,
            "pais_constitucion": pais,
            "actividad_economica": actividad,
            "domicilio_legal": f"Ciudad de Panama, oficina demo {indice}",
            "telefono": f"390-{1000 + indice}",
            "correo": f"empresa{indice}@demo.ddc",
            "proposito_adquisicion": "compra_activo" if monto < 500000 else "inversion",
            "fuente_ingresos": "ventas" if pais == "PA" else "dividendos",
            "rango_ingresos": "50000-100000" if monto < 500000 else "100000-500000",
            "origen_fondos": "utilidades" if pais == "PA" else "transferencia_internacional",
            "monto_estimado": monto,
            "representante": (representante, f"8-900-{2000 + indice}", "Representante legal", "Firma y administracion"),
            "beneficiarios": [
                (beneficiario, f"8-910-{2000 + indice}", "PA", 65, "directo", False),
                (f"Socio Demo {indice}", f"8-920-{2000 + indice}", "PA", 35, "directo", False),
            ],
        })
    return clientes

def seed_clientes_demo():
    clientes_naturales = [
        {
            "id": _demo_uuid("natural-1"),
            "estado": "PENDIENTE",
            "nivel_riesgo": "BAJO",
            "es_pep": False,
            "nombres": "Ana Maria",
            "apellidos": "Rodriguez Perez",
            "tipo_documento": "CEDULA",
            "numero_documento": "8-800-1001",
            "fecha_nacimiento": "1988-04-12",
            "nacionalidad": "PA",
            "pais_residencia": "PA",
            "direccion": "San Francisco, Calle 74, Panama",
            "telefono": "6000-1001",
            "correo": "ana.rodriguez.demo@ddc.com",
            "ocupacion": "Arquitecta",
            "fuente_ingresos": "salario",
            "rango_ingresos": "2500-5000",
            "proposito_transaccion": "compra_vivienda",
            "origen_fondos": "ahorros",
            "monto_estimado": 85000,
        },
        {
            "id": _demo_uuid("natural-2"),
            "estado": "EN_REVISION",
            "nivel_riesgo": "ESTANDAR",
            "es_pep": False,
            "nombres": "Carlos Andres",
            "apellidos": "Mendez Castillo",
            "tipo_documento": "CEDULA",
            "numero_documento": "8-800-1002",
            "fecha_nacimiento": "1979-09-03",
            "nacionalidad": "PA",
            "pais_residencia": "PA",
            "direccion": "Costa del Este, Avenida Centenario",
            "telefono": "6000-1002",
            "correo": "carlos.mendez.demo@ddc.com",
            "ocupacion": "Comerciante",
            "fuente_ingresos": "negocio_propio",
            "rango_ingresos": "5000-10000",
            "proposito_transaccion": "inversion_inmobiliaria",
            "origen_fondos": "utilidades_negocio",
            "monto_estimado": 220000,
        },
        {
            "id": _demo_uuid("natural-3"),
            "estado": "OBSERVADO",
            "nivel_riesgo": "ALTO",
            "es_pep": True,
            "nombres": "Marisol",
            "apellidos": "Vega Santos",
            "tipo_documento": "PASAPORTE",
            "numero_documento": "PA1003003",
            "fecha_nacimiento": "1972-01-25",
            "nacionalidad": "PA",
            "pais_residencia": "PA",
            "direccion": "Obarrio, Calle 60",
            "telefono": "6000-1003",
            "correo": "marisol.vega.demo@ddc.com",
            "ocupacion": "Consultora",
            "fuente_ingresos": "servicios_profesionales",
            "rango_ingresos": "10000-20000",
            "proposito_transaccion": "compra_local",
            "origen_fondos": "honorarios",
            "monto_estimado": 540000,
        },
        {
            "id": _demo_uuid("natural-4"),
            "estado": "ACTIVO",
            "nivel_riesgo": "BAJO",
            "es_pep": False,
            "nombres": "Luis Fernando",
            "apellidos": "Gomez Herrera",
            "tipo_documento": "CEDULA",
            "numero_documento": "8-800-1004",
            "fecha_nacimiento": "1991-06-18",
            "nacionalidad": "PA",
            "pais_residencia": "PA",
            "direccion": "Brisas del Golf, Calle 12",
            "telefono": "6000-1004",
            "correo": "luis.gomez.demo@ddc.com",
            "ocupacion": "Ingeniero de sistemas",
            "fuente_ingresos": "salario",
            "rango_ingresos": "2500-5000",
            "proposito_transaccion": "primera_vivienda",
            "origen_fondos": "ahorros",
            "monto_estimado": 95000,
        },
        {
            "id": _demo_uuid("natural-5"),
            "estado": "PENDIENTE",
            "nivel_riesgo": "ESTANDAR",
            "es_pep": False,
            "nombres": "Patricia Elena",
            "apellidos": "Alvarado Ruiz",
            "tipo_documento": "CEDULA",
            "numero_documento": "8-800-1005",
            "fecha_nacimiento": "1984-11-09",
            "nacionalidad": "PA",
            "pais_residencia": "PA",
            "direccion": "Via Argentina, Edificio Central",
            "telefono": "6000-1005",
            "correo": "patricia.alvarado.demo@ddc.com",
            "ocupacion": "Medica",
            "fuente_ingresos": "salario",
            "rango_ingresos": "5000-10000",
            "proposito_transaccion": "compra_apartamento",
            "origen_fondos": "ahorros_y_prestamo",
            "monto_estimado": 310000,
        },
    ]

    clientes_juridicos = [
        {
            "id": _demo_uuid("juridica-1"),
            "estado": "PENDIENTE_BF",
            "nivel_riesgo": "ESTANDAR",
            "es_pep": False,
            "razon_social": "Inversiones Pacifico Azul, S.A.",
            "ruc": "1557001001-2-2026",
            "tipo_pj": "SA",
            "pais_constitucion": "PA",
            "actividad_economica": "Bienes raices",
            "domicilio_legal": "Punta Pacifica, Torre Empresarial",
            "telefono": "390-1001",
            "correo": "contacto@pacificoazul.demo",
            "proposito_adquisicion": "desarrollo_inmobiliario",
            "fuente_ingresos": "ventas",
            "rango_ingresos": "50000-100000",
            "origen_fondos": "capital_propio",
            "monto_estimado": 480000,
            "representante": ("Roberto Diaz Moran", "8-900-2001", "Presidente", "Administracion general"),
            "beneficiarios": [
                ("Roberto Diaz Moran", "8-900-2001", "PA", 60, "directo", False),
                ("Elena Diaz Moran", "8-900-2002", "PA", 40, "directo", False),
            ],
        },
        {
            "id": _demo_uuid("juridica-2"),
            "estado": "EN_REVISION",
            "nivel_riesgo": "ALTO",
            "es_pep": False,
            "razon_social": "Global Estate Holdings Ltd.",
            "ruc": "1557001002-2-2026",
            "tipo_pj": "SA",
            "pais_constitucion": "VG",
            "actividad_economica": "Tenencia de activos",
            "domicilio_legal": "Marbella, Oficina 1204",
            "telefono": "390-1002",
            "correo": "legal@globalestate.demo",
            "proposito_adquisicion": "inversion",
            "fuente_ingresos": "dividendos",
            "rango_ingresos": "100000-500000",
            "origen_fondos": "transferencia_internacional",
            "monto_estimado": 760000,
            "representante": ("Sofia Morales Rios", "8-900-2003", "Apoderada", "Firma de contratos"),
            "beneficiarios": [
                ("Martin Clarke", "P-900-2004", "GB", 70, "indirecto", False),
                ("Sofia Morales Rios", "8-900-2003", "PA", 30, "representacion", False),
            ],
        },
        {
            "id": _demo_uuid("juridica-3"),
            "estado": "ACTIVO",
            "nivel_riesgo": "BAJO",
            "es_pep": False,
            "razon_social": "Servicios Logisticos Istmo, S.A.",
            "ruc": "1557001003-2-2026",
            "tipo_pj": "SA",
            "pais_constitucion": "PA",
            "actividad_economica": "Logistica",
            "domicilio_legal": "Zona Libre de Colon, Local 15",
            "telefono": "390-1003",
            "correo": "admin@logisticosistmo.demo",
            "proposito_adquisicion": "bodega_operativa",
            "fuente_ingresos": "servicios",
            "rango_ingresos": "20000-50000",
            "origen_fondos": "utilidades",
            "monto_estimado": 180000,
            "representante": ("Javier Ortega Leon", "3-900-2005", "Gerente General", "Representacion legal"),
            "beneficiarios": [
                ("Javier Ortega Leon", "3-900-2005", "PA", 55, "directo", False),
                ("Camila Ortega Leon", "3-900-2006", "PA", 45, "directo", False),
            ],
        },
        {
            "id": _demo_uuid("juridica-4"),
            "estado": "OBSERVADO",
            "nivel_riesgo": "ALTO",
            "es_pep": False,
            "razon_social": "Fideicomiso Horizonte Norte",
            "ruc": "1557001004-2-2026",
            "tipo_pj": "fideicomiso",
            "pais_constitucion": "KY",
            "actividad_economica": "Administracion patrimonial",
            "domicilio_legal": "Obarrio, Plaza Corporativa",
            "telefono": "390-1004",
            "correo": "cumplimiento@horizontenorte.demo",
            "proposito_adquisicion": "administracion_activos",
            "fuente_ingresos": "patrimonio",
            "rango_ingresos": "100000-500000",
            "origen_fondos": "patrimonio_familiar",
            "monto_estimado": 1250000,
            "representante": ("Valeria Campos Nuñez", "8-900-2007", "Fiduciaria", "Administracion fiduciaria"),
            "beneficiarios": [
                ("Andres Fuentes", "P-900-2008", "CO", 50, "indirecto", False),
                ("Laura Fuentes", "P-900-2009", "CO", 50, "indirecto", False),
            ],
        },
        {
            "id": _demo_uuid("juridica-5"),
            "estado": "PENDIENTE_BF",
            "nivel_riesgo": "ESTANDAR",
            "es_pep": False,
            "razon_social": "Constructora Camino Real, S.A.",
            "ruc": "1557001005-2-2026",
            "tipo_pj": "SA",
            "pais_constitucion": "PA",
            "actividad_economica": "Construccion",
            "domicilio_legal": "David, Chiriqui, Avenida Central",
            "telefono": "390-1005",
            "correo": "info@caminoreal.demo",
            "proposito_adquisicion": "compra_terreno",
            "fuente_ingresos": "contratos",
            "rango_ingresos": "50000-100000",
            "origen_fondos": "utilidades_y_financiamiento",
            "monto_estimado": 360000,
            "representante": ("Miguel Salazar Cano", "4-900-2010", "Director", "Firma de documentos"),
            "beneficiarios": [
                ("Miguel Salazar Cano", "4-900-2010", "PA", 80, "directo", False),
                ("Nadia Cano Perez", "4-900-2011", "PA", 20, "directo", False),
            ],
        },
    ]

    clientes_naturales.extend(_generar_clientes_naturales_extra())
    clientes_juridicos.extend(_generar_clientes_juridicos_extra())

    with engine.connect() as conn:
        for c in clientes_naturales:
            conn.execute(text("""
                INSERT INTO clientes (id_cliente, tipo_cliente, nivel_riesgo, estado, es_pep, registrado_por)
                VALUES (:id, 'NATURAL', :nivel_riesgo, :estado, :es_pep, 'demo_empleado@ddc.com')
                ON CONFLICT (id_cliente) DO UPDATE SET
                    nivel_riesgo = EXCLUDED.nivel_riesgo,
                    estado = EXCLUDED.estado,
                    es_pep = EXCLUDED.es_pep,
                    eliminado = FALSE
            """), c)
            conn.execute(text("""
                INSERT INTO personas_naturales (
                    id, nombres, apellidos, tipo_documento, numero_documento, fecha_nacimiento,
                    nacionalidad, pais_residencia, direccion, telefono, correo, ocupacion,
                    fuente_ingresos, rango_ingresos, proposito_transaccion, origen_fondos, monto_estimado
                )
                VALUES (
                    :id, :nombres, :apellidos, :tipo_documento, :numero_documento, :fecha_nacimiento,
                    :nacionalidad, :pais_residencia, :direccion, :telefono, :correo, :ocupacion,
                    :fuente_ingresos, :rango_ingresos, :proposito_transaccion, :origen_fondos, :monto_estimado
                )
                ON CONFLICT (numero_documento) DO UPDATE SET
                    nombres = EXCLUDED.nombres,
                    apellidos = EXCLUDED.apellidos,
                    correo = EXCLUDED.correo,
                    monto_estimado = EXCLUDED.monto_estimado
            """), c)
            _insertar_perfiles(conn, c)

        for c in clientes_juridicos:
            conn.execute(text("""
                INSERT INTO clientes (id_cliente, tipo_cliente, nivel_riesgo, estado, es_pep, registrado_por)
                VALUES (:id, 'JURIDICA', :nivel_riesgo, :estado, :es_pep, 'demo_empleado@ddc.com')
                ON CONFLICT (id_cliente) DO UPDATE SET
                    nivel_riesgo = EXCLUDED.nivel_riesgo,
                    estado = EXCLUDED.estado,
                    es_pep = EXCLUDED.es_pep,
                    eliminado = FALSE
            """), c)
            conn.execute(text("""
                INSERT INTO personas_juridicas (
                    id, razon_social, ruc, tipo_pj, pais_constitucion, actividad_economica,
                    domicilio_legal, telefono, correo, proposito_adquisicion, fuente_ingresos,
                    rango_ingresos, origen_fondos, monto_estimado
                )
                VALUES (
                    :id, :razon_social, :ruc, :tipo_pj, :pais_constitucion, :actividad_economica,
                    :domicilio_legal, :telefono, :correo, :proposito_adquisicion, :fuente_ingresos,
                    :rango_ingresos, :origen_fondos, :monto_estimado
                )
                ON CONFLICT (ruc) DO UPDATE SET
                    razon_social = EXCLUDED.razon_social,
                    correo = EXCLUDED.correo,
                    monto_estimado = EXCLUDED.monto_estimado
            """), c)

            conn.execute(text("DELETE FROM representantes_legales WHERE id_cliente = :id"), c)
            nombre, documento, cargo, poderes = c["representante"]
            conn.execute(text("""
                INSERT INTO representantes_legales (id_cliente, nombre_completo, numero_identificacion, cargo, poderes_otorgados)
                VALUES (:id_cliente, :nombre, :documento, :cargo, :poderes)
            """), {
                "id_cliente": c["id"],
                "nombre": nombre,
                "documento": documento,
                "cargo": cargo,
                "poderes": poderes,
            })

            conn.execute(text("DELETE FROM beneficiarios_finales WHERE id_cliente = :id"), c)
            for nombre, documento, nacionalidad, porcentaje, tipo_control, es_pep in c["beneficiarios"]:
                estado_bf = "PENDIENTE" if c["estado"] == "PENDIENTE_BF" else "APROBADO"
                conn.execute(text("""
                    INSERT INTO beneficiarios_finales (
                        id_cliente, nombre_completo, numero_documento, nacionalidad,
                        porcentaje_participacion, tipo_control, es_pep, es_relevante,
                        estado_validacion, validado_por, fecha_validacion
                    )
                    VALUES (
                        :id_cliente, :nombre, :documento, :nacionalidad,
                        :porcentaje, :tipo_control, :es_pep, :es_relevante,
                        :estado_validacion, :validado_por,
                        CASE WHEN :estado_validacion = 'APROBADO' THEN NOW() ELSE NULL END
                    )
                """), {
                    "id_cliente": c["id"],
                    "nombre": nombre,
                    "documento": documento,
                    "nacionalidad": nacionalidad,
                    "porcentaje": porcentaje,
                    "tipo_control": tipo_control,
                    "es_pep": es_pep,
                    "es_relevante": porcentaje >= 25,
                    "estado_validacion": estado_bf,
                    "validado_por": OFICIAL_USER if estado_bf == "APROBADO" else None,
                })
            _insertar_perfiles(conn, c)

        conn.commit()

    seed_expedientes_demo(clientes_naturales + clientes_juridicos)

def _insertar_perfiles(conn, c):
    conn.execute(text("""
        INSERT INTO perfiles_financieros (
            id_cliente, fuente_ingresos, rango_ingresos, origen_fondos, patrimonio_declarado
        )
        VALUES (:id, :fuente_ingresos, :rango_ingresos, :origen_fondos, :patrimonio)
        ON CONFLICT (id_cliente) DO UPDATE SET
            fuente_ingresos = EXCLUDED.fuente_ingresos,
            rango_ingresos = EXCLUDED.rango_ingresos,
            origen_fondos = EXCLUDED.origen_fondos,
            patrimonio_declarado = EXCLUDED.patrimonio_declarado
    """), {**c, "patrimonio": c["monto_estimado"] * 1.5})
    conn.execute(text("""
        INSERT INTO perfiles_transaccionales (
            id_cliente, monto_total_propiedad, metodo_pago_predominante, tipo_operacion,
            banco_origen_fondos, tiene_financiamiento, banco_financiamiento, monto_financiamiento
        )
        VALUES (
            :id, :monto_estimado, :metodo_pago, :tipo_operacion,
            :banco_origen_fondos, :tiene_financiamiento, :banco_financiamiento, :monto_financiamiento
        )
        ON CONFLICT (id_cliente) DO UPDATE SET
            monto_total_propiedad = EXCLUDED.monto_total_propiedad,
            metodo_pago_predominante = EXCLUDED.metodo_pago_predominante,
            tipo_operacion = EXCLUDED.tipo_operacion,
            banco_origen_fondos = EXCLUDED.banco_origen_fondos,
            tiene_financiamiento = EXCLUDED.tiene_financiamiento,
            banco_financiamiento = EXCLUDED.banco_financiamiento,
            monto_financiamiento = EXCLUDED.monto_financiamiento
    """), {
        **c,
        "metodo_pago": "transferencia_bancaria",
        "tipo_operacion": "compra",
        "banco_origen_fondos": "Banco General",
        "tiene_financiamiento": c["monto_estimado"] >= 300000,
        "banco_financiamiento": "BAC Credomatic" if c["monto_estimado"] >= 300000 else None,
        "monto_financiamiento": c["monto_estimado"] * 0.6 if c["monto_estimado"] >= 300000 else None,
    })

def seed_expedientes_demo(clientes):
    with engine.connect() as conn:
        for c in clientes:
            conn.execute(text("DELETE FROM documentos WHERE id_cliente = :id"), c)
            conn.execute(text("DELETE FROM observaciones WHERE id_cliente = :id"), c)
            conn.execute(text("DELETE FROM clasificaciones_riesgo WHERE id_cliente = :id"), c)
            conn.execute(text("DELETE FROM auditorias WHERE cliente_id = :id"), c)

            _insertar_documentos(conn, c)
            _insertar_observaciones(conn, c)
            _insertar_clasificacion_riesgo(conn, c)
            _insertar_auditoria_expediente(conn, c)

        conn.commit()

def _tipos_documento(c):
    if "nombres" in c:
        return [
            "DOCUMENTO_IDENTIDAD",
            "COMPROBANTE_INGRESOS",
            "COMPROBANTE_RESIDENCIA",
            "CARTA_REFERENCIA_BANCARIA",
            "DECLARACION_ORIGEN_FONDOS",
        ]
    return [
        "AVISO_OPERACION",
        "CERTIFICADO_EXISTENCIA",
        "IDENTIFICACION_REPRESENTANTE",
        "IDENTIFICACION_BENEFICIARIOS",
        "DECLARACION_ORIGEN_FONDOS",
    ]

def _crear_archivo_demo(nombre_archivo, contenido):
    ruta = os.path.join(UPLOAD_DIR, nombre_archivo)
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        with open(ruta, "wb") as archivo:
            archivo.write(contenido)
    except OSError:
        # En ejecuciones locales sin /app/uploads, el registro igual sirve para listar documentos.
        pass
    return ruta

def _insertar_documentos(conn, c):
    estados = ["VERIFICADO", "VERIFICADO", "PENDIENTE_VERIFICACION", "VERIFICADO", "RECHAZADO"]
    for indice, tipo_documento in enumerate(_tipos_documento(c), start=1):
        formato = "PDF" if indice != 4 else "PNG"
        extension = formato.lower()
        nombre_base = c.get("numero_documento") or c.get("ruc")
        nombre_archivo = f"{nombre_base}_{tipo_documento.lower()}.{extension}"
        contenido = (
            f"Documento demo\nCliente: {c.get('nombres', c.get('razon_social'))}\n"
            f"Tipo: {tipo_documento}\n"
        ).encode("utf-8")
        ruta = _crear_archivo_demo(f"demo_{nombre_archivo}", contenido)
        estado = estados[indice - 1]
        conn.execute(text("""
            INSERT INTO documentos (
                id_cliente, tipo_documento, nombre_archivo, ruta_archivo, hash_sha256,
                tamano_bytes, formato, estado, fecha_verificacion, usuario_verificador, motivo_rechazo
            )
            VALUES (
                :id_cliente, :tipo_documento, :nombre_archivo, :ruta_archivo, :hash_sha256,
                :tamano_bytes, :formato, :estado,
                CASE WHEN :estado IN ('VERIFICADO', 'RECHAZADO') THEN NOW() ELSE NULL END,
                CASE WHEN :estado IN ('VERIFICADO', 'RECHAZADO') THEN :usuario_verificador ELSE NULL END,
                :motivo_rechazo
            )
        """), {
            "id_cliente": c["id"],
            "tipo_documento": tipo_documento,
            "nombre_archivo": nombre_archivo,
            "ruta_archivo": ruta,
            "hash_sha256": hashlib.sha256(contenido).hexdigest(),
            "tamano_bytes": len(contenido),
            "formato": formato,
            "estado": estado,
            "usuario_verificador": OFICIAL_USER,
            "motivo_rechazo": "Documento ilegible, favor subir una version actualizada" if estado == "RECHAZADO" else None,
        })

def _insertar_observaciones(conn, c):
    if c["estado"] not in ("OBSERVADO", "EN_REVISION", "ACTIVO"):
        return

    observaciones = [
        {
            "descripcion": "Validar consistencia entre ingresos declarados y monto estimado de la operacion.",
            "respuesta": "Se adjunto soporte actualizado y referencia bancaria para sustentar la operacion.",
            "estado": "CERRADA" if c["estado"] == "ACTIVO" else "ABIERTA",
        }
    ]
    if c["nivel_riesgo"] == "ALTO":
        observaciones.append({
            "descripcion": "Revisar factores de riesgo alto antes de continuar con la aprobacion.",
            "respuesta": None,
            "estado": "ABIERTA",
        })

    for obs in observaciones:
        conn.execute(text("""
            INSERT INTO observaciones (
                id_cliente, descripcion, respuesta, estado, creada_por, respondida_por,
                fecha_respuesta, fecha_cierre
            )
            VALUES (
                :id_cliente, :descripcion, :respuesta, :estado, :creada_por, :respondida_por,
                CASE WHEN :respuesta IS NOT NULL THEN NOW() ELSE NULL END,
                CASE WHEN :estado = 'CERRADA' THEN NOW() ELSE NULL END
            )
        """), {
            "id_cliente": c["id"],
            "descripcion": obs["descripcion"],
            "respuesta": obs["respuesta"],
            "estado": obs["estado"],
            "creada_por": OFICIAL_USER,
            "respondida_por": DEMO_USER if obs["respuesta"] else None,
        })

def _factores_para_cliente(c):
    factores = []
    monto = c["monto_estimado"]
    if c["es_pep"]:
        factores.append({"factor": "es_pep", "tipo": "bloqueante", "peso": 0, "aplicado": True})
    if monto > 500000:
        factores.append({"factor": "monto_mayor_500k", "tipo": "positivo", "peso": 40, "aplicado": True})
    elif monto >= 100000:
        factores.append({"factor": "monto_100k_500k", "tipo": "positivo", "peso": 20, "aplicado": True})
    if "razon_social" in c and c["pais_constitucion"] != "PA":
        factor = "pj_extranjera_compleja" if c["tipo_pj"] in ("fideicomiso", "fundacion") else "pj_extranjera_sa"
        factores.append({"factor": factor, "tipo": "positivo", "peso": 30 if factor == "pj_extranjera_compleja" else 15, "aplicado": True})
    if "razon_social" in c and c["pais_constitucion"] == "PA":
        factores.append({"factor": "pj_nacional_docs", "tipo": "mitigante", "peso": -5, "aplicado": True})
    factores.append({"factor": "ingresos_consistentes", "tipo": "mitigante", "peso": -5, "aplicado": True})
    return factores

def _insertar_clasificacion_riesgo(conn, c):
    factores = _factores_para_cliente(c)
    puntaje_bruto = sum(f["peso"] for f in factores if f["tipo"] != "bloqueante")
    puntaje_final = max(min(puntaje_bruto, 100), 0)
    if c["nivel_riesgo"] == "ALTO":
        justificacion = "Cliente clasificado como ALTO por monto elevado, PEP o estructura juridica extranjera/compleja."
    elif c["nivel_riesgo"] == "ESTANDAR":
        justificacion = "Cliente clasificado como ESTANDAR por monto medio y documentacion en validacion."
    else:
        justificacion = "Cliente clasificado como BAJO por perfil consistente, documentacion suficiente y monto moderado."

    conn.execute(text("""
        INSERT INTO clasificaciones_riesgo (
            id_cliente, nivel_riesgo, puntaje_bruto, puntaje_final,
            justificacion, factores_aplicados, es_automatica, recalculado_por
        )
        VALUES (
            :id_cliente, :nivel_riesgo, :puntaje_bruto, :puntaje_final,
            :justificacion, CAST(:factores_aplicados AS JSONB), TRUE, NULL
        )
    """), {
        "id_cliente": c["id"],
        "nivel_riesgo": c["nivel_riesgo"],
        "puntaje_bruto": puntaje_bruto,
        "puntaje_final": puntaje_final,
        "justificacion": justificacion,
        "factores_aplicados": json.dumps({"factores": factores}),
    })

def _insertar_auditoria_expediente(conn, c):
    acciones = [
        ("CREAR_CLIENTE", None, c["estado"]),
        ("REGISTRAR_PERFIL_FINANCIERO", None, c["fuente_ingresos"]),
        ("REGISTRAR_PERFIL_TRANSACCIONAL", None, str(c["monto_estimado"])),
        ("ADJUNTAR_DOCUMENTO", None, "documentos_demo"),
        ("CALCULAR_RIESGO", None, c["nivel_riesgo"]),
    ]
    if c["estado"] == "OBSERVADO":
        acciones.append(("CAMBIAR_ESTADO", "EN_REVISION", "OBSERVADO"))
    elif c["estado"] == "ACTIVO":
        acciones.append(("CAMBIAR_ESTADO", "EN_REVISION", "ACTIVO"))

    for accion, anterior, nuevo in acciones:
        usuario = OFICIAL_USER if accion in ("CALCULAR_RIESGO", "CAMBIAR_ESTADO") else DEMO_USER
        conn.execute(text("""
            INSERT INTO auditorias (usuario, accion, cliente_id, valor_anterior, valor_nuevo)
            VALUES (:usuario, :accion, :cliente_id, :valor_anterior, :valor_nuevo)
        """), {
            "usuario": usuario,
            "accion": accion,
            "cliente_id": c["id"],
            "valor_anterior": anterior,
            "valor_nuevo": nuevo,
        })

def seed():
    print("Ejecutando seed determinista...")
    crear_usuario_demo("demo_empleado@ddc.com", "Demo Empleado", "empleado", "empleado123")
    seed_clientes_demo()
    print("Seed completado.")

if __name__ == "__main__":
    seed()
