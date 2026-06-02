const config = {
  PENDIENTE: { bg: 'rgba(217, 119, 6, 0.12)', text: '#FBBF24', border: 'rgba(217, 119, 6, 0.3)' },
  EN_REVISION: { bg: 'rgba(59, 130, 246, 0.12)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' },
  ACTIVO: { bg: 'rgba(22, 163, 74, 0.12)', text: '#4ADE80', border: 'rgba(22, 163, 74, 0.3)' },
  RECHAZADO: { bg: 'rgba(220, 38, 38, 0.12)', text: '#F87171', border: 'rgba(220, 38, 38, 0.3)' },
  PENDIENTE_VERIFICACION: { bg: 'rgba(217, 119, 6, 0.12)', text: '#FBBF24', border: 'rgba(217, 119, 6, 0.3)' },
  VERIFICADO: { bg: 'rgba(22, 163, 74, 0.12)', text: '#4ADE80', border: 'rgba(22, 163, 74, 0.3)' }
};

export default function EstadoBadge({ estado }) {
  const estilo = config[estado] || config.PENDIENTE;
  return (
    <span className="badge" style={{
      backgroundColor: estilo.bg,
      color: estilo.text,
      border: `1px solid ${estilo.border}`,
      fontFamily: 'var(--font-body)'
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: estilo.text,
        display: 'inline-block'
      }} />
      {estado?.replace(/_/g, ' ')}
    </span>
  );
}
