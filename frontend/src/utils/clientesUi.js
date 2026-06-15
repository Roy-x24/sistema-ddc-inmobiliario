export const tipoClienteLabel = (tipo) => (tipo === 'JURIDICA' ? 'Juridica' : 'Natural');

export const tipoClienteBadgeClass = (tipo) => (
  tipo === 'JURIDICA'
    ? 'border-sky-200 bg-sky-50 text-sky-700'
    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
);

export const clienteOptionLabel = (cliente) => {
  const nombre = cliente.nombre || cliente.id_cliente;
  const identificacion = cliente.identificacion ? ` - ${cliente.identificacion}` : '';
  return `${nombre} - ${tipoClienteLabel(cliente.tipo_cliente)}${identificacion}`;
};

export const filtrarClientesPorTipo = (clientes, tipo) => (
  tipo ? clientes.filter((cliente) => cliente.tipo_cliente === tipo) : clientes
);
