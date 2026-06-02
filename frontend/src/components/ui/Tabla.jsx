export default function Tabla({ columns, data, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-parchment bg-surface shadow-soft ${className}`}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-parchment bg-cream/60">
            {columns.map((col) => (
              <th key={col.key} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-parchment">
          {data.map((row, i) => (
            <tr key={i} className="group transition-colors hover:bg-cream/40">
              {columns.map((col) => (
                <td key={col.key} className="px-5 py-3.5 text-ink">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
