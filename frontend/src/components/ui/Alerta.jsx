import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export default function Alerta({ variant = 'info', children, className = '' }) {
  const styles = {
    info: 'bg-navy-700/10 text-navy-700 border-navy-600/20',
    exito: 'bg-risk-bajo/10 text-risk-bajo border-risk-bajo/20',
    advertencia: 'bg-gold/10 text-gold-dark border-gold/20',
    error: 'bg-risk-alto/10 text-risk-alto border-risk-alto/20',
  };
  const icons = {
    info: Info,
    exito: CheckCircle,
    advertencia: AlertCircle,
    error: XCircle,
  };
  const Icon = icons[variant];
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${styles[variant]} ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
