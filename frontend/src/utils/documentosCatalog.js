export const ESTADOS_DOCUMENTO_VALIDOS = ['VERIFICADO', 'VALIDADO_AUTOMATICO', 'VERIFICADO_MANUAL'];

export const DOCUMENTOS_CATALOGO = {
  DOCUMENTO_IDENTIDAD: {
    label: 'Documento de identidad',
    description: 'Cedula o pasaporte del cliente. Sustenta la identidad principal del expediente.',
    appliesTo: ['NATURAL'],
    requirement: 'OBLIGATORIO',
    repeatable: false,
    fills: ['nombre', 'identificacion', 'fecha de nacimiento', 'nacionalidad'],
  },
  COMPROBANTE_INGRESOS: {
    label: 'Comprobante de ingresos',
    description: 'Soporte de salario, actividad economica o ingresos declarados.',
    appliesTo: ['NATURAL'],
    requirement: 'OBLIGATORIO',
    repeatable: true,
    fills: ['fuente de ingresos', 'rango de ingresos'],
  },
  COMPROBANTE_RESIDENCIA: {
    label: 'Comprobante de residencia',
    description: 'Soporte de direccion o residencia del cliente.',
    appliesTo: ['NATURAL'],
    requirement: 'OBLIGATORIO',
    repeatable: false,
    fills: ['direccion', 'pais de residencia'],
  },
  CARTA_REFERENCIA_BANCARIA: {
    label: 'Carta referencia bancaria',
    description: 'Referencia o relacion bancaria usada como soporte adicional.',
    appliesTo: ['NATURAL', 'JURIDICA'],
    requirement: 'OPCIONAL',
    repeatable: true,
    fills: ['banco', 'relacion bancaria'],
  },
  DECLARACION_ORIGEN_FONDOS: {
    label: 'Declaracion origen de fondos',
    description: 'Declaracion o evidencia que explica la procedencia de los fondos.',
    appliesTo: ['NATURAL', 'JURIDICA'],
    requirement: 'CONDICIONAL',
    repeatable: true,
    fills: ['origen de fondos', 'monto', 'actividad'],
  },
  AVISO_OPERACION: {
    label: 'Aviso de operacion',
    description: 'Documento que sustenta la actividad operativa declarada por la sociedad.',
    appliesTo: ['JURIDICA'],
    requirement: 'OBLIGATORIO',
    repeatable: false,
    fills: ['actividad economica', 'razon social'],
  },
  CERTIFICADO_EXISTENCIA: {
    label: 'Certificado de existencia',
    description: 'Certificado o registro publico que confirma existencia legal y datos societarios.',
    appliesTo: ['JURIDICA'],
    requirement: 'OBLIGATORIO',
    repeatable: false,
    fills: ['razon social', 'RUC', 'representante legal'],
  },
  IDENTIFICACION_REPRESENTANTE: {
    label: 'Identificacion representante',
    description: 'Cedula o pasaporte del representante legal registrado.',
    appliesTo: ['JURIDICA'],
    requirement: 'OBLIGATORIO',
    repeatable: false,
    fills: ['representante legal', 'identificacion del representante'],
  },
  IDENTIFICACION_BENEFICIARIOS: {
    label: 'Identificacion beneficiarios',
    description: 'Identificacion de beneficiarios finales relevantes de la persona juridica.',
    appliesTo: ['JURIDICA'],
    requirement: 'OBLIGATORIO',
    repeatable: true,
    fills: ['beneficiarios finales', 'porcentaje de participacion'],
  },
  OTRO_SOPORTE: {
    label: 'Otro soporte',
    description: 'Evidencia complementaria no cubierta por un requisito documental principal.',
    appliesTo: ['NATURAL', 'JURIDICA'],
    requirement: 'OPCIONAL',
    repeatable: true,
    fills: [],
  },
};

export function documentosParaTipoCliente(tipoCliente) {
  return Object.entries(DOCUMENTOS_CATALOGO)
    .filter(([, config]) => config.appliesTo.includes(tipoCliente || 'NATURAL'))
    .map(([value, config]) => ({ value, ...config }));
}

export function etiquetaDocumento(tipo) {
  return DOCUMENTOS_CATALOGO[tipo]?.label || tipo;
}

export function estadoRequisitoDocumento(requisito, documentos = []) {
  const asociados = documentos.filter((doc) => doc.tipo_documento === requisito.value);
  if (asociados.length === 0) {
    return {
      status: requisito.requirement === 'OBLIGATORIO' ? 'FALTANTE' : 'DISPONIBLE',
      label: requisito.requirement === 'OBLIGATORIO' ? 'Falta subir' : 'Disponible',
      blocking: requisito.requirement === 'OBLIGATORIO',
      docs: [],
      latest: null,
      complete: false,
    };
  }

  const latest = asociados[0];
  const tieneValido = asociados.some((doc) => ESTADOS_DOCUMENTO_VALIDOS.includes(doc.estado));
  const tieneRechazado = asociados.some((doc) => doc.estado === 'RECHAZADO');
  const tieneObservado = asociados.some((doc) => doc.estado === 'OBSERVADO');

  if (tieneValido) {
    return {
      status: 'CUBIERTO',
      label: 'Cubierto',
      blocking: false,
      docs: asociados,
      latest,
      complete: true,
    };
  }

  if (tieneRechazado) {
    return {
      status: 'RECHAZADO',
      label: 'Rechazado',
      blocking: requisito.requirement === 'OBLIGATORIO',
      docs: asociados,
      latest,
      complete: false,
    };
  }

  if (tieneObservado) {
    return {
      status: 'OBSERVADO',
      label: 'Observado',
      blocking: requisito.requirement === 'OBLIGATORIO',
      docs: asociados,
      latest,
      complete: false,
    };
  }

  return {
    status: 'PENDIENTE',
    label: 'Pendiente revision',
    blocking: requisito.requirement === 'OBLIGATORIO',
    docs: asociados,
    latest,
    complete: false,
  };
}
