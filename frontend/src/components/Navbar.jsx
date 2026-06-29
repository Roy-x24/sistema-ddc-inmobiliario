import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Menu, PanelLeftClose, PanelLeftOpen, Search, ShieldCheck } from 'lucide-react';

export default function Navbar({ onMenuClick, desktopCollapsed = false, onToggleSidebar }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  if (!usuario) return null;

  return (
    <header className={`fixed left-0 right-0 top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 shadow-sm backdrop-blur-xl transition-[left] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-6 lg:px-8 ${desktopCollapsed ? 'lg:left-20' : 'lg:left-72'}`}>
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:inline-flex"
          aria-label={desktopCollapsed ? 'Expandir menu' : 'Colapsar menu'}
        >
          {desktopCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-700 sm:text-[11px]">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span className="truncate">Debida Diligencia</span>
          </div>
          <div className="mt-1 truncate text-base font-black tracking-tight text-slate-950 sm:text-lg">
            Sistema de Cumplimiento Inmobiliario
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
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
        <div className="flex items-center gap-3 border-l border-slate-200 pl-3 sm:pl-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white shadow-sm">
            {usuario.nombre?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold text-slate-950">{usuario.nombre || usuario.correo}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{usuario.rol?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
