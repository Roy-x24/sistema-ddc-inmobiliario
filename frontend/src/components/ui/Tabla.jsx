export default function Tabla({ columns, data, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-600">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-gray-700">
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
