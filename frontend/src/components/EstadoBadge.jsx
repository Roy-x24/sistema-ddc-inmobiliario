export default function EstadoBadge({ estado }) {
  const map = {
    PENDIENTE: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    PENDIENTE_BF: 'bg-orange-50 text-orange-700 border-orange-200',
    EN_REVISION: 'bg-blue-50 text-blue-700 border-blue-200',
    OBSERVADO: 'bg-purple-50 text-purple-700 border-purple-200',
    ACTIVO: 'bg-green-50 text-green-700 border-green-200',
    BLOQUEADO: 'bg-red-50 text-red-700 border-red-200',
    RECHAZADO: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[estado] || map.PENDIENTE}`}>
      {estado?.replace('_', ' ')}
    </span>
  );
}
