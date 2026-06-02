import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Settings, Users, LogOut, LayoutDashboard, ArrowLeft } from 'lucide-react';

export default function AdminShell({ children }) {
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!usuario) return null;

  const navItems = [
    { label: 'Matriz de Riesgo', icon: Settings, path: '/admin/matriz' },
    { label: 'Usuarios', icon: Users, path: '/admin/usuarios' },
  ];

  return (
    <div className="flex min-h-screen bg-cream font-sans antialiased">
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-navy-800 text-white shadow-elevated">
        <div className="flex items-center gap-3 border-b border-gold/20 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 font-display text-sm font-bold text-gold">ADM</div>
          <div>
            <span className="block text-sm font-semibold tracking-wide text-cream">Administracion</span>
            <span className="text-[10px] uppercase tracking-widest text-gold-muted">Configuracion del sistema</span>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gold-muted transition-all hover:bg-white/5 hover:text-cream"
          >
            <ArrowLeft className="h-4 w-4 text-gold-muted group-hover:text-cream" />
            Volver al Dashboard
          </button>
          <div className="my-2 border-t border-gold/10" />
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-gold/15 text-gold shadow-inner'
                    : 'text-gold-muted hover:bg-white/5 hover:text-cream'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-gold/20 px-3 py-5 space-y-1">
          <div className="px-3 pb-3">
            <div className="text-[10px] uppercase tracking-widest text-gold-muted">Usuario</div>
            <div className="truncate text-xs text-cream">{usuario.nombre || usuario.correo}</div>
            <div className="mt-0.5 text-[10px] text-gold-muted capitalize">{usuario.rol?.replace('_', ' ')}</div>
          </div>
          <button
            onClick={cerrarSesion}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gold-muted transition-colors hover:bg-white/5 hover:text-cream"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </button>
        </div>
      </aside>
      <div className="ml-64 flex-1">
        <header className="fixed left-64 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-parchment bg-surface/90 px-8 backdrop-blur-md">
          <div className="font-display text-lg font-semibold text-navy-800">Panel de Administracion</div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-display text-xs font-bold text-gold">
              {usuario.nombre?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-ink">{usuario.nombre || usuario.correo}</p>
              <p className="text-[10px] uppercase tracking-wider text-ink-muted">{usuario.rol?.replace('_', ' ')}</p>
            </div>
          </div>
        </header>
        <main className="mt-16 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
