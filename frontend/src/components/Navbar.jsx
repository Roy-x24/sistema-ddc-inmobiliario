import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';

export default function Navbar() {
  const { usuario } = useAuth();
  if (!usuario) return null;

  return (
    <header className="fixed left-64 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-parchment bg-surface/90 px-8 backdrop-blur-md">
      <div className="font-display text-lg font-semibold text-navy-800 tracking-tight">
        Sistema de Debida Diligencia
      </div>
      <div className="flex items-center gap-5">
        <button className="relative rounded-full p-2 text-ink-muted transition-colors hover:bg-parchment hover:text-navy-800">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-risk-alto ring-2 ring-white" />
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-parchment">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-display text-xs font-bold text-gold">
            {usuario.nombre?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-ink">{usuario.nombre || usuario.correo}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-muted">{usuario.rol?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
