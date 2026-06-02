import { useNavigate } from 'react-router-dom';
import { Clock, LogIn } from 'lucide-react';

export default function SesionExpirada() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-800 px-4">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold ring-1 ring-gold/20">
        <Clock className="h-8 w-8" />
      </div>
      <h1 className="font-display text-2xl font-bold text-cream">Sesión expirada</h1>
      <p className="mt-2 max-w-md text-center text-sm text-gold-muted">
        Su sesión ha finalizado por inactividad o el token de acceso ya no es válido. Inicie sesión nuevamente para continuar.
      </p>
      <button
        onClick={() => navigate('/login')}
        className="btn-primary mt-6"
      >
        <LogIn className="h-4 w-4" />
        Ir al inicio de sesión
      </button>
    </div>
  );
}
