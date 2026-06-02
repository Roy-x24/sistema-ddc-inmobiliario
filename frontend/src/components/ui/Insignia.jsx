export default function Insignia({ children, variant = 'default', className = '' }) {
  const styles = {
    default: 'bg-gray-100 text-gray-700',
    bajo: 'bg-green-50 text-green-700 border-green-200',
    estandar: 'bg-amber-50 text-amber-700 border-amber-200',
    alto: 'bg-red-50 text-red-700 border-red-200',
    azul: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
