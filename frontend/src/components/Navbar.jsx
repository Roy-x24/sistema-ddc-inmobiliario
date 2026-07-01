import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { Bell, Menu, PanelLeftClose, PanelLeftOpen, Search, ShieldCheck } from 'lucide-react';

export default function Navbar({ onMenuClick, desktopCollapsed = false, onToggleSidebar }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificaciones, setNotificaciones] = useState({ total: 0, alta: 0, items: [] });

  useEffect(() => {
    if (!usuario) return;
    let activo = true;
    api.get('/notificaciones/')
      .then((res) => {
        if (activo) setNotificaciones(res.data || { total: 0, alta: 0, items: [] });
      })
      .catch(() => {
        if (activo) setNotificaciones({ total: 0, alta: 0, items: [] });
      });
    return () => { activo = false; };
  }, [usuario, location.pathname]);

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
              setShowNotifications((valor) => !valor);
            }}
            className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
            aria-label="Ver notificaciones"
          >
            <Bell className="h-5 w-5" />
            {notificaciones.total > 0 && (
              <span className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black text-white ring-2 ring-white ${notificaciones.alta ? 'bg-rose-500' : 'bg-teal-600'}`}>
                {Math.min(notificaciones.total, 9)}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-950">Notificaciones</h3>
                  <p className="text-xs font-semibold text-slate-400">{notificaciones.total} aviso(s) operativo(s)</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/notificaciones');
                  }}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-black text-slate-700 hover:bg-slate-50"
                >
                  Ver todo
                </button>
              </div>
              <div className="space-y-2">
                {(notificaciones.items || []).slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate(item.destino || '/notificaciones');
                    }}
                    className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-teal-200 hover:bg-teal-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-black text-slate-950">{item.titulo}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${item.prioridad === 'ALTA' ? 'bg-rose-100 text-rose-700' : item.prioridad === 'MEDIA' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                        {item.prioridad}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{item.mensaje}</p>
                  </button>
                ))}
                {(!notificaciones.items || notificaciones.items.length === 0) && (
                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No hay avisos operativos ahora mismo.</div>
                )}
              </div>
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
