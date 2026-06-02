export default function Select({ label, error, options = [], className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>}
      <select
        className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus:border-acento focus:outline-none focus:ring-1 focus:ring-acento ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
        }`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
