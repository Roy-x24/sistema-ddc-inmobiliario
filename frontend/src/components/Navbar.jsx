import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';

export default function Navbar() {
  const { usuario } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  if (!usuario) return null;

  return (
    <header className="fixed left-64 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/90 px-8 backdrop-blur-md">
      <div className="text-lg font-bold text-gray-800 tracking-tight">
        Sistema de Debida Diligencia
      </div>
      <div className="flex items-center gap-5">
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setHasUnreadNotifications(false);
            }}
            className="relative rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-800"
          >
            <Bell className="h-5 w-5" />
            {hasUnreadNotifications && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
              <h3 className="mb-3 text-sm font-bold text-gray-900">Notificaciones</h3>
              <div className="space-y-3">
                <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500">No hay notificaciones nuevas</div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            {usuario.nombre?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">{usuario.nombre || usuario.correo}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{usuario.rol?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
