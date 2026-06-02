export default function Select({ label, error, options = [], className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-muted">{label}</label>}
      <select
        className={`w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-ink shadow-soft transition-all focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 ${
          error ? 'border-risk-alto focus:border-risk-alto focus:ring-red-200' : 'border-parchment hover:border-gold/30'
        }`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs font-medium text-risk-alto">{error}</p>}
    </div>
  );
}
