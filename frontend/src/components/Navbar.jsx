import { useAuth } from '../context/AuthContext';
import { Bell, User } from 'lucide-react';

export default function Navbar() {
  const { usuario } = useAuth();

  if (!usuario) return null;

  return (
    <header className="fixed left-60 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-6 backdrop-blur">
      <div />
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar text-xs font-bold text-white">
            {usuario.nombre?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{usuario.nombre || usuario.correo}</p>
            <p className="text-xs capitalize text-gray-500">{usuario.rol?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
