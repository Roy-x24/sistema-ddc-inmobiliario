import { useNavigate } from 'react-router-dom';
import { Clock, LogIn } from 'lucide-react';

export default function SesionExpirada() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-fondo px-4">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <Clock className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Sesion expirada</h1>
      <p className="mt-2 max-w-md text-center text-sm text-gray-500">
        Su sesion ha finalizado por inactividad o el token de acceso ya no es valido. Inicie sesion nuevamente para continuar.
      </p>
      <button
        onClick={() => navigate('/login')}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-acento px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        <LogIn className="h-4 w-4" />
        Ir al inicio de sesion
      </button>
    </div>
  );
}
