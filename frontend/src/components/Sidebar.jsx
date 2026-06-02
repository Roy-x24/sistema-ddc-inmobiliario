import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, FileText, FileSpreadsheet, Shield, AlertTriangle,
  ClipboardList, MessageSquare, UserCheck, LogOut, Settings
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['empleado', 'oficial_cumplimiento', 'auditor'] },
  { label: 'Clientes', icon: Users, path: '/clientes', roles: ['empleado', 'oficial_cumplimiento', 'auditor'] },
  { label: 'Documentos', icon: FileText, path: '/documentos', roles: ['empleado', 'oficial_cumplimiento'] },
  { label: 'Perfiles', icon: FileSpreadsheet, path: '/perfiles', roles: ['empleado'] },
  { label: 'Riesgo', icon: Shield, path: '/riesgo', roles: ['oficial_cumplimiento', 'auditor'] },
  { label: 'Activacion', icon: AlertTriangle, path: '/activacion', roles: ['oficial_cumplimiento'] },
  { label: 'Observaciones', icon: MessageSquare, path: '/observaciones', roles: ['empleado', 'oficial_cumplimiento'] },
  { label: 'Beneficiarios', icon: UserCheck, path: '/beneficiarios', roles: ['empleado', 'oficial_cumplimiento'] },
  { label: 'Auditoria', icon: ClipboardList, path: '/auditoria', roles: ['oficial_cumplimiento', 'auditor'] },
];

const adminItems = [
  { label: 'Matriz de Riesgo', icon: Settings, path: '/admin/matriz' },
  { label: 'Usuarios', icon: Users, path: '/admin/usuarios' },
];

export default function Sidebar() {
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!usuario) return null;
  const isAdmin = usuario.rol === 'admin';

  const isActive = (path) => {
    if (location.pathname === path) return true;
    if (path !== '/' && location.pathname.startsWith(path + '/')) return true;
    return false;
  };

  const renderItem = (item, key) => {
    const active = isActive(item.path);
    return (
      <button
        key={key}
        onClick={() => navigate(item.path)}
        className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
          active
            ? 'bg-gold/15 text-gold shadow-inner'
            : 'text-gold-muted hover:bg-white/5 hover:text-cream'
        }`}
      >
        <item.icon className={`h-4 w-4 transition-colors ${active ? 'text-gold' : 'text-gold-muted group-hover:text-cream'}`} />
        {item.label}
        {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
      </button>
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-navy-800 text-white shadow-elevated">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-gold/20 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 font-display text-sm font-bold text-gold">
          DDC
        </div>
        <div>
          <span className="block text-sm font-semibold tracking-wide text-cream">KYC Inmobiliario</span>
          <span className="text-[10px] uppercase tracking-widest text-gold-muted">Compliance Regulatorio</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-6">
        {isAdmin ? (
          <>
            <div className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-gold-muted/60">Operativo</div>
            {navItems.map((item) => renderItem(item, item.path))}
            <div className="px-3 pb-2 pt-4 text-[10px] font-bold uppercase tracking-widest text-gold-muted/60">Administracion</div>
            {adminItems.map((item) => renderItem(item, 'admin-' + item.path))}
          </>
        ) : (
          navItems
            .filter((item) => item.roles.includes(usuario.rol))
            .map((item) => renderItem(item, item.path))
        )}
      </nav>

      {/* Bottom */}
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
  );
}
