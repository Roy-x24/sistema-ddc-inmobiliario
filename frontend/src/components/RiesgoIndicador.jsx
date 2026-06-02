export default function RiesgoIndicador({ nivel }) {
  const map = {
    BAJO: { text: 'text-green-600', bg: 'bg-green-50', label: 'Bajo' },
    ESTANDAR: { text: 'text-amber-600', bg: 'bg-amber-50', label: 'Estandar' },
    ALTO: { text: 'text-red-600', bg: 'bg-red-50', label: 'Alto' },
  };
  const style = map[nivel] || map.BAJO;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.text} ${style.bg}`}>
      Riesgo {style.label}
    </span>
  );
}
