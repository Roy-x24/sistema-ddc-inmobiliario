import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList, Settings, Users, LogOut, ArrowLeft, ShieldCheck, Search, Bell, Menu, X,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

export default function AdminShell({ children }) {
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingPath, setPendingPath] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const navItems = [
    { label: 'Matriz de Riesgo', icon: Settings, path: '/admin/matriz', hint: 'Pesos y versiones' },
    { label: 'Usuarios', icon: Users, path: '/admin/usuarios', hint: 'Roles y accesos' },
    { label: 'Auditoria Admin', icon: ClipboardList, path: '/admin/auditoria', hint: 'Eventos sensibles' },
  ];

  const activePath = pendingPath || location.pathname;
  const activeItem = navItems.find((item) => item.path === activePath);

  useEffect(() => {
    setPendingPath('');
  }, [location.pathname]);

  useEffect(() => {
    if (!isSwitching) return undefined;
    const timer = window.setTimeout(() => setIsSwitching(false), 180);
    return () => window.clearTimeout(timer);
  }, [isSwitching]);

  const goTo = (path) => {
    setPendingPath(path);
    setIsSwitching(true);
    setMobileOpen(false);
    navigate(path);
  };

  if (!usuario) return null;

  return (
    <div className="app-canvas flex min-h-screen font-sans antialiased text-slate-900">
      <div
        className={`fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
      />
      <aside className={`fixed left-0 top-0 z-40 flex h-screen w-72 max-w-[86vw] flex-col overflow-hidden bg-[#08111f] text-white shadow-[18px_0_50px_rgba(8,17,31,0.2)] transition-[transform,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:max-w-none lg:translate-x-0 ${desktopCollapsed ? 'lg:w-20' : 'lg:w-72'} ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_30%_10%,rgba(20,184,166,0.32),transparent_42%),radial-gradient(circle_at_82%_0%,rgba(245,158,11,0.2),transparent_36%)]" />
        <div className={`relative flex items-center gap-3 border-b border-white/10 px-6 py-6 ${desktopCollapsed ? 'lg:justify-center lg:px-4' : ''}`}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-sm font-black text-white shadow-sm backdrop-blur">ADM</div>
          <div className={desktopCollapsed ? 'lg:hidden' : ''}>
            <span className="block text-sm font-bold tracking-wide text-white">Administracion</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-100/80">Configuracion del sistema</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white/15 hover:text-white lg:hidden"
            aria-label="Cerrar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={`relative mx-5 mt-5 rounded-xl border border-white/10 bg-white/[0.06] p-4 shadow-inner ${desktopCollapsed ? 'lg:mx-4 lg:p-3' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-300 text-slate-950">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className={desktopCollapsed ? 'lg:hidden' : ''}>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Panel seguro</div>
              <div className="text-sm font-semibold text-white">Control administrativo</div>
            </div>
          </div>
        </div>

        <nav className={`relative flex-1 space-y-1 overflow-x-hidden overflow-y-auto pl-4 py-6 ${desktopCollapsed ? 'lg:pl-3 lg:pr-0' : ''}`}>
          <button
            onClick={() => goTo('/dashboard')}
            title={desktopCollapsed ? 'Volver al Dashboard' : undefined}
            className={`group mb-4 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition-all hover:bg-white/10 hover:text-white ${desktopCollapsed ? 'lg:w-full lg:justify-center lg:px-0' : ''}`}
          >
            <ArrowLeft className="h-4 w-4 text-cyan-100/80 group-hover:text-white" />
            <span className={desktopCollapsed ? 'lg:hidden' : ''}>Volver al Dashboard</span>
          </button>
          <div className={`px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 ${desktopCollapsed ? 'lg:text-center lg:text-[0px]' : ''}`}>{desktopCollapsed ? 'GE' : 'Gestion'}</div>
          {navItems.map((item) => {
            const active = activePath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => goTo(item.path)}
                title={desktopCollapsed ? item.label : undefined}
                className={`sidebar-nav-item group flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold ${desktopCollapsed ? 'lg:justify-center lg:px-0' : ''} ${
                  active
                    ? 'sidebar-active-item'
                    : `rounded-l-2xl text-slate-300 ${isSwitching ? '' : 'hover:bg-white/10 hover:text-white'}`
                }`}
              >
                <item.icon className={`sidebar-nav-icon h-5 w-5 ${active ? 'text-slate-950' : 'text-cyan-100/80 group-hover:text-white'}`} />
                <span className={`sidebar-nav-label flex-1 text-left ${desktopCollapsed ? 'lg:hidden' : ''}`}>
                  <span className="block">{item.label}</span>
                  <span className={`block text-[10px] font-bold uppercase tracking-widest ${active ? 'text-slate-500' : 'text-slate-500 group-hover:text-slate-300'}`}>{item.hint}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <div className={`relative space-y-1 border-t border-white/10 px-4 py-5 ${desktopCollapsed ? 'lg:px-3' : ''}`}>
          <div className={`px-3 pb-3 ${desktopCollapsed ? 'lg:hidden' : ''}`}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Usuario</div>
            <div className="truncate text-xs font-bold text-white">{usuario.nombre || usuario.correo}</div>
            <div className="mt-0.5 text-[10px] font-medium capitalize text-slate-300">{usuario.rol?.replace('_', ' ')}</div>
          </div>
          <button
            onClick={cerrarSesion}
            title={desktopCollapsed ? 'Cerrar sesion' : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white ${desktopCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
          >
            <LogOut className="h-5 w-5" />
            <span className={desktopCollapsed ? 'lg:hidden' : ''}>Cerrar sesion</span>
          </button>
        </div>
      </aside>
      <div className={`flex-1 transition-[margin] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${desktopCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <header className={`fixed left-0 right-0 top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 shadow-sm backdrop-blur-xl transition-[left] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-6 lg:px-8 ${desktopCollapsed ? 'lg:left-20' : 'lg:left-72'}`}>
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setDesktopCollapsed((value) => !value)}
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:inline-flex"
              aria-label={desktopCollapsed ? 'Expandir menu' : 'Colapsar menu'}
            >
              {desktopCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-700 sm:text-[11px]">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span className="truncate">Panel de Administracion</span>
              </div>
              <div className="mt-1 truncate text-base font-black tracking-tight text-slate-950 sm:text-lg">
                {activeItem?.label || 'Configuracion'}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <div className="hidden min-w-[280px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400 lg:flex">
              <Search className="h-4 w-4" />
              Buscar configuracion o usuario
            </div>
            <button className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900">
              <Bell className="h-5 w-5" />
            </button>
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
        <main className="mt-20 px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
