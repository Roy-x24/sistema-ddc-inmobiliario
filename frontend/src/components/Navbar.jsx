import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { usuario } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  if (!usuario) return null;

  return (
    <header className="fixed left-72 right-0 top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/70 bg-white/80 px-8 shadow-sm backdrop-blur-xl">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-teal-700">
          <ShieldCheck className="h-4 w-4" />
          Debida Diligencia
        </div>
        <div className="mt-1 text-lg font-black tracking-tight text-slate-950">
          Sistema de Cumplimiento Inmobiliario
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden min-w-[300px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400 lg:flex">
          <Search className="h-4 w-4" />
          Buscar expediente, cliente o documento
        </div>
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setHasUnreadNotifications(false);
            }}
            className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <Bell className="h-5 w-5" />
            {hasUnreadNotifications && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
              <h3 className="mb-3 text-sm font-bold text-slate-950">Notificaciones</h3>
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No hay notificaciones nuevas</div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white shadow-sm">
            {usuario.nombre?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-950">{usuario.nombre || usuario.correo}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{usuario.rol?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
