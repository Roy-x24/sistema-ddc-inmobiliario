CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR NOT NULL,
    correo VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    rol VARCHAR NOT NULL CHECK (rol IN ('empleado', 'oficial_cumplimiento', 'auditor', 'administrador')),
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS clientes (
    id_cliente UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_cliente VARCHAR NOT NULL CHECK (tipo_cliente IN ('NATURAL', 'JURIDICA')),
    nivel_riesgo VARCHAR CHECK (nivel_riesgo IN ('BAJO', 'ESTANDAR', 'ALTO')),
    estado VARCHAR NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_REVISION', 'ACTIVO', 'RECHAZADO')),
    es_pep BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP DEFAULT NOW(),
    eliminado BOOLEAN DEFAULT FALSE,
    registrado_por VARCHAR NOT NULL REFERENCES usuarios(correo)
);

CREATE TABLE IF NOT EXISTS personas_naturales (
    id UUID PRIMARY KEY REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    nombres VARCHAR NOT NULL,
    apellidos VARCHAR NOT NULL,
    tipo_documento VARCHAR NOT NULL CHECK (tipo_documento IN ('CEDULA', 'PASAPORTE')),
    numero_documento VARCHAR UNIQUE NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    nacionalidad VARCHAR NOT NULL,
    pais_residencia VARCHAR NOT NULL,
    direccion VARCHAR NOT NULL,
    telefono VARCHAR NOT NULL,
    correo VARCHAR NOT NULL,
    ocupacion VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS personas_juridicas (
    id UUID PRIMARY KEY REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    razon_social VARCHAR NOT NULL,
    ruc VARCHAR UNIQUE NOT NULL,
    tipo_pj VARCHAR NOT NULL,
    pais_constitucion VARCHAR NOT NULL,
    actividad_economica VARCHAR NOT NULL,
    domicilio_legal VARCHAR NOT NULL,
    telefono VARCHAR NOT NULL,
    correo VARCHAR NOT NULL,
    proposito_adquisicion VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS representantes_legales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cliente UUID NOT NULL REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    nombre_completo VARCHAR NOT NULL,
    numero_identificacion VARCHAR NOT NULL,
    cargo VARCHAR NOT NULL,
    poderes_otorgados VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS beneficiarios_finales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cliente UUID NOT NULL REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    nombre_completo VARCHAR NOT NULL,
    numero_documento VARCHAR NOT NULL,
    nacionalidad VARCHAR NOT NULL,
    porcentaje_participacion DECIMAL NOT NULL CHECK (porcentaje_participacion >= 25),
    tipo_control VARCHAR,
    es_pep BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS documentos (
    id_documento UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cliente UUID NOT NULL REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    tipo_documento VARCHAR NOT NULL,
    nombre_archivo VARCHAR NOT NULL,
    ruta_archivo VARCHAR NOT NULL,
    tamano_bytes INTEGER,
    formato VARCHAR NOT NULL,
    estado VARCHAR NOT NULL DEFAULT 'PENDIENTE_VERIFICACION' CHECK (estado IN ('PENDIENTE_VERIFICACION', 'VERIFICADO', 'RECHAZADO')),
    fecha_carga TIMESTAMP DEFAULT NOW(),
    fecha_verificacion TIMESTAMP,
    usuario_verificador VARCHAR,
    motivo_rechazo VARCHAR
);

CREATE TABLE IF NOT EXISTS perfiles_financieros (
    id_perfil UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cliente UUID NOT NULL UNIQUE REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    fuente_ingresos VARCHAR NOT NULL,
    rango_ingresos VARCHAR NOT NULL,
    origen_fondos VARCHAR NOT NULL,
    patrimonio_declarado DECIMAL,
    fecha_registro TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS perfiles_transaccionales (
    id_perfil UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cliente UUID NOT NULL UNIQUE REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    proposito_compra VARCHAR NOT NULL,
    monto_estimado DECIMAL NOT NULL,
    tipo_transaccion VARCHAR NOT NULL,
    tiene_financiamiento BOOLEAN DEFAULT FALSE,
    banco_financiamiento VARCHAR,
    monto_financiamiento DECIMAL,
    fecha_registro TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clasificaciones_riesgo (
    id_clasificacion UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cliente UUID NOT NULL REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    nivel_riesgo VARCHAR NOT NULL CHECK (nivel_riesgo IN ('BAJO', 'ESTANDAR', 'ALTO')),
    justificacion TEXT NOT NULL,
    factores_aplicados JSONB,
    fecha_calculo TIMESTAMP DEFAULT NOW(),
    es_automatica BOOLEAN DEFAULT TRUE,
    recalculado_por VARCHAR
);

CREATE TABLE IF NOT EXISTS auditorias (
    id_auditoria UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario VARCHAR NOT NULL,
    accion VARCHAR NOT NULL,
    cliente_id UUID REFERENCES clientes(id_cliente) ON DELETE SET NULL,
    valor_anterior VARCHAR,
    valor_nuevo VARCHAR,
    fecha TIMESTAMP DEFAULT NOW()
);

-- Seed de usuarios con contraseñas en bcrypt
INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES
('Empleado Demo', 'empleado@ddc.com', '$2b$12$xm97PLDY2TZh.cX3n19Y/.ZG0xWKk.vQDodjeGPf9iQoIPxmBqmR.', 'empleado'),
('Oficial de Cumplimiento', 'oficial@ddc.com', '$2b$12$9SmuZWQkMsRr9QhRrS0d2u4LHxlNl471tG3eIy.O6SJelcOIxI6L6', 'oficial_cumplimiento'),
('Auditor Interno', 'auditor@ddc.com', '$2b$12$vfiwTTljWAFo3Qy4cOxqBOLpnPJeXd.xymrIVW.2jMExExJR.WH2a', 'auditor'),
('Administrador', 'admin@ddc.com', '$2b$12$ZKoL33JcpJtmfRM1VPfja.EXZ2sKxUPJ3RdAPGOSj95kE1F7tE166', 'administrador');
