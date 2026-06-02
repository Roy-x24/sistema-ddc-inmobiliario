export default function Boton({ children, variant = 'primario', loading = false, disabled = false, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const styles = {
    primario: 'bg-acento text-white hover:bg-blue-700 focus:ring-acento',
    secundario: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300',
    peligro: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };
  return (
    <button
      className={`${base} ${styles[variant]} ${className} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
      {children}
    </button>
  );
}
