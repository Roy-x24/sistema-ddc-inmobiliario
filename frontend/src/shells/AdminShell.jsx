import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Settings, ArrowLeft, LogOut } from 'lucide-react';

export default function AdminShell() {
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!usuario) return null;

  return (
    <div className="flex min-h-screen bg-fondo font-sans">
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col bg-sidebar text-white">
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-acento font-bold text-white">ADM</div>
          <span className="text-sm font-semibold tracking-wide">Administracion</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          <button
            onClick={() => navigate('/admin/matriz')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              location.pathname === '/admin/matriz' ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="h-4 w-4" />
            Matriz de Riesgo
          </button>
        </nav>
        <div className="border-t border-white/10 px-3 py-4 space-y-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al sistema
          </button>
          <button
            onClick={cerrarSesion}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </button>
        </div>
      </aside>
      <div className="ml-60 flex-1">
        <header className="fixed left-60 right-0 top-0 z-20 flex h-16 items-center justify-end border-b border-gray-200 bg-white/80 px-6 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar text-xs font-bold text-white">
              {usuario.nombre?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{usuario.nombre || usuario.correo}</p>
              <p className="text-xs capitalize text-gray-500">{usuario.rol?.replace('_', ' ')}</p>
            </div>
          </div>
        </header>
        <main className="mt-16 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
