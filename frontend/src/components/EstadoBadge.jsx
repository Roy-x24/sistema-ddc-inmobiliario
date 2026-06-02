export default function EstadoBadge({ estado }) {
  const map = {
    PENDIENTE: 'bg-estate-pendiente/10 text-estate-pendiente border-estate-pendiente/20',
    PENDIENTE_BF: 'bg-orange-100 text-orange-700 border-orange-200',
    EN_REVISION: 'bg-estate-en_revision/10 text-estate-en_revision border-estate-en_revision/20',
    OBSERVADO: 'bg-estate-observado/10 text-estate-observado border-estate-observado/20',
    ACTIVO: 'bg-estate-activo/10 text-estate-activo border-estate-activo/20',
    BLOQUEADO: 'bg-estate-bloqueado/10 text-estate-bloqueado border-estate-bloqueado/20',
    RECHAZADO: 'bg-estate-rechazado/10 text-estate-rechazado border-estate-rechazado/20',
  };
  return (
    <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold tracking-wide ${map[estado] || map.PENDIENTE}`}>
      {estado?.replace('_', ' ')}
    </span>
  );
}
