const config = {
  BAJO: { color: '#4ADE80', label: 'Bajo', glow: 'rgba(74, 222, 128, 0.25)' },
  ESTANDAR: { color: '#FBBF24', label: 'Estándar', glow: 'rgba(251, 191, 36, 0.25)' },
  ALTO: { color: '#F87171', label: 'Alto', glow: 'rgba(248, 113, 113, 0.25)' }
};

export default function RiesgoIndicador({ nivel }) {
  const c = config[nivel] || config['BAJO'];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      fontWeight: 700,
      color: c.color,
      fontSize: 13,
      padding: '4px 12px',
      borderRadius: 9999,
      backgroundColor: c.glow,
      border: `1px solid ${c.glow}`,
      fontFamily: 'var(--font-body)'
    }}>
      <span style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: c.color,
        boxShadow: `0 0 6px ${c.color}`
      }} />
      {c.label}
    </span>
  );
}
