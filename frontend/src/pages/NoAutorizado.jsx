import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NoAutorizado() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-fondo px-4">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Acceso no autorizado</h1>
      <p className="mt-2 max-w-md text-center text-sm text-gray-500">
        No tiene permisos para acceder a este modulo. Contacte al administrador si cree que esto es un error.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-acento px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio
      </button>
    </div>
  );
}
