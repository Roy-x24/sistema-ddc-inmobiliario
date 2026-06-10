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
        className={`group flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
          active
            ? 'sidebar-active-item'
            : 'rounded-l-2xl text-blue-100 hover:bg-white/10 hover:text-white'
        }`}
      >
        <item.icon className={`h-5 w-5 transition-colors ${active ? 'text-blue-900' : 'text-blue-200 group-hover:text-white'}`} />
        {item.label}
      </button>
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-gradient-to-b from-[#02196b] to-blue-800 text-white shadow-xl">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-white/20 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/40 bg-white/10 font-bold text-white shadow-sm">
          DDC
        </div>
        <div>
          <span className="block text-sm font-bold tracking-wide text-white">KYC Inmobiliario</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-200">Compliance Regulatorio</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto pl-4 py-6">
        {isAdmin ? (
          <>
            <div className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-blue-200">Operativo</div>
            {navItems.map((item) => renderItem(item, item.path))}
            <div className="px-3 pb-2 pt-4 text-[10px] font-bold uppercase tracking-widest text-blue-200">Administracion</div>
            {adminItems.map((item) => renderItem(item, 'admin-' + item.path))}
          </>
        ) : (
          navItems
            .filter((item) => item.roles.includes(usuario.rol))
            .map((item) => renderItem(item, item.path))
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/20 px-4 py-5 space-y-1">
        <div className="px-3 pb-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Usuario</div>
          <div className="truncate text-xs font-bold text-white">{usuario.nombre || usuario.correo}</div>
          <div className="mt-0.5 text-[10px] font-medium text-blue-100 capitalize">{usuario.rol?.replace('_', ' ')}</div>
        </div>
        <button
          onClick={cerrarSesion}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-blue-100 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
