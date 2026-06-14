import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Settings, Users, LogOut, ArrowLeft, ShieldCheck, Search, Bell } from 'lucide-react';

export default function AdminShell({ children }) {
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!usuario) return null;

  const navItems = [
    { label: 'Matriz de Riesgo', icon: Settings, path: '/admin/matriz', hint: 'Pesos y versiones' },
    { label: 'Usuarios', icon: Users, path: '/admin/usuarios', hint: 'Roles y accesos' },
  ];

  const activeItem = navItems.find((item) => item.path === location.pathname);

  return (
    <div className="app-canvas flex min-h-screen font-sans antialiased text-slate-900">
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-72 flex-col overflow-hidden bg-[#08111f] text-white shadow-[18px_0_50px_rgba(8,17,31,0.2)]">
        <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_30%_10%,rgba(20,184,166,0.32),transparent_42%),radial-gradient(circle_at_82%_0%,rgba(245,158,11,0.2),transparent_36%)]" />
        <div className="relative flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-sm font-black text-white shadow-sm backdrop-blur">ADM</div>
          <div>
            <span className="block text-sm font-bold tracking-wide text-white">Administracion</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-100/80">Configuracion del sistema</span>
          </div>
        </div>

        <div className="relative mx-5 mt-5 rounded-xl border border-white/10 bg-white/[0.06] p-4 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-300 text-slate-950">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Panel seguro</div>
              <div className="text-sm font-semibold text-white">Control administrativo</div>
            </div>
          </div>
        </div>

        <nav className="relative flex-1 space-y-1 overflow-y-auto pl-4 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="group mb-4 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 text-cyan-100/80 group-hover:text-white" />
            Volver al Dashboard
          </button>
          <div className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Gestion</div>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold transition-all ${
                  active
                    ? 'sidebar-active-item'
                    : 'rounded-l-2xl text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className={`h-5 w-5 transition-colors ${active ? 'text-slate-950' : 'text-cyan-100/80 group-hover:text-white'}`} />
                <span className="flex-1 text-left">
                  <span className="block">{item.label}</span>
                  <span className={`block text-[10px] font-bold uppercase tracking-widest ${active ? 'text-slate-500' : 'text-slate-500 group-hover:text-slate-300'}`}>{item.hint}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="relative space-y-1 border-t border-white/10 px-4 py-5">
          <div className="px-3 pb-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Usuario</div>
            <div className="truncate text-xs font-bold text-white">{usuario.nombre || usuario.correo}</div>
            <div className="mt-0.5 text-[10px] font-medium capitalize text-slate-300">{usuario.rol?.replace('_', ' ')}</div>
          </div>
          <button
            onClick={cerrarSesion}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesion
          </button>
        </div>
      </aside>
      <div className="ml-72 flex-1">
        <header className="fixed left-72 right-0 top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/70 bg-white/80 px-8 shadow-sm backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-teal-700">
              <ShieldCheck className="h-4 w-4" />
              Panel de Administracion
            </div>
            <div className="mt-1 text-lg font-black tracking-tight text-slate-950">
              {activeItem?.label || 'Configuracion'}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden min-w-[280px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400 lg:flex">
              <Search className="h-4 w-4" />
              Buscar configuracion o usuario
            </div>
            <button className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900">
              <Bell className="h-5 w-5" />
            </button>
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
        <main className="mt-20 px-8 pb-10 pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
