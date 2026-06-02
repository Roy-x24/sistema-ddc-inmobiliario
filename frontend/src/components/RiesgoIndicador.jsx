export default function RiesgoIndicador({ nivel }) {
  const map = {
    BAJO: { text: 'text-risk-bajo', bg: 'bg-risk-bajo/10', border: 'border-risk-bajo/20', label: 'Bajo' },
    ESTANDAR: { text: 'text-gold-dark', bg: 'bg-gold/10', border: 'border-gold/20', label: 'Estandar' },
    ALTO: { text: 'text-risk-alto', bg: 'bg-risk-alto/10', border: 'border-risk-alto/20', label: 'Alto' },
  };
  const style = map[nivel] || map.BAJO;
  return (
    <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold tracking-wide ${style.text} ${style.bg} ${style.border}`}>
      Riesgo {style.label}
    </span>
  );
}
