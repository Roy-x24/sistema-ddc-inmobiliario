export default function Boton({ children, variant = 'primario', loading = false, disabled = false, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const styles = {
    primario: 'bg-navy-800 text-cream shadow-soft hover:bg-navy-700 hover:shadow-card focus:ring-gold',
    dorado: 'bg-gold text-navy-900 shadow-glow hover:bg-gold-light hover:shadow-elevated focus:ring-navy-800',
    secundario: 'border border-parchment bg-surface text-ink shadow-soft hover:bg-cream hover:border-gold/40 focus:ring-gold',
    peligro: 'bg-risk-alto text-white shadow-soft hover:bg-red-800 focus:ring-red-400',
    fantasma: 'text-ink-muted hover:text-navy-800 hover:bg-parchment/50',
  };
  return (
    <button
      className={`${base} ${styles[variant]} ${className} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}
