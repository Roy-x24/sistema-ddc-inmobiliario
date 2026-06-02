import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NoAutorizado() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-800 px-4" style={{ backgroundImage: 'var(--tw-gradient-to)' }}>
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-risk-alto/10 text-risk-alto ring-1 ring-risk-alto/20">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="font-display text-2xl font-bold text-cream">Acceso no autorizado</h1>
      <p className="mt-2 max-w-md text-center text-sm text-gold-muted">
        No tiene permisos para acceder a este módulo. Contacte al administrador si cree que esto es un error.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="btn-primary mt-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio
      </button>
    </div>
  );
}
