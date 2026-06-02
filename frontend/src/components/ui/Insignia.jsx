export default function Insignia({ children, variant = 'default', className = '' }) {
  const styles = {
    default: 'bg-parchment text-ink-light border-parchment',
    bajo: 'bg-risk-bajo/10 text-risk-bajo border-risk-bajo/20',
    estandar: 'bg-gold/10 text-gold-dark border-gold/20',
    alto: 'bg-risk-alto/10 text-risk-alto border-risk-alto/20',
    azul: 'bg-navy-700/10 text-navy-700 border-navy-600/20',
  };
  return (
    <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold tracking-wide ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
