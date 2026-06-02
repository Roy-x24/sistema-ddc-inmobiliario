import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export default function Alerta({ variant = 'info', children, className = '' }) {
  const styles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    exito: 'bg-green-50 text-green-800 border-green-200',
    advertencia: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200',
  };
  const icons = {
    info: Info,
    exito: CheckCircle,
    advertencia: AlertCircle,
    error: XCircle,
  };
  const Icon = icons[variant];
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${styles[variant]} ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
