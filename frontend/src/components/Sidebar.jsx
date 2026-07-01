import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, FileText, FileSpreadsheet, Shield, AlertTriangle,
  ClipboardList, MessageSquare, UserCheck, LogOut, Settings, Sparkles, X, Lock, Bell
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['empleado', 'oficial_cumplimiento'] },
  { label: 'Notificaciones', icon: Bell, path: '/notificaciones', roles: ['empleado', 'oficial_cumplimiento', 'auditor'] },
  { label: 'Cumplimiento', icon: Shield, path: '/cumplimiento', roles: ['oficial_cumplimiento', 'auditor'] },
  { label: 'Activacion', icon: AlertTriangle, path: '/activacion', roles: ['oficial_cumplimiento'] },
  { label: 'Post-activacion', icon: Lock, path: '/post-activacion', roles: ['oficial_cumplimiento'] },
  { label: 'Riesgo', icon: Shield, path: '/riesgo', roles: ['oficial_cumplimiento'] },
  { type: 'divider', roles: ['oficial_cumplimiento'] },
  { label: 'Documentos', icon: FileText, path: '/documentos', roles: ['empleado', 'oficial_cumplimiento'] },
  { label: 'Beneficiarios', icon: UserCheck, path: '/beneficiarios', roles: ['empleado', 'oficial_cumplimiento'] },
  { label: 'Observaciones', icon: MessageSquare, path: '/observaciones', roles: ['empleado', 'oficial_cumplimiento'] },
  { type: 'divider', roles: ['oficial_cumplimiento'] },
  { label: 'Clientes', icon: Users, path: '/clientes', roles: ['empleado', 'oficial_cumplimiento'] },
  { label: 'Perfiles', icon: FileSpreadsheet, path: '/perfiles', roles: ['empleado'] },
  { label: 'Auditoria', icon: ClipboardList, path: '/auditoria', roles: ['auditor'] },
];

const adminItems = [
  { label: 'Dashboard Admin', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Notificaciones', icon: Bell, path: '/notificaciones' },
  { label: 'Matriz de Riesgo', icon: Settings, path: '/admin/matriz' },
  { label: 'IA y Proveedores', icon: Sparkles, path: '/admin/ia' },
  { label: 'PEP / Sanciones', icon: Shield, path: '/admin/screening' },
  { label: 'Usuarios', icon: Users, path: '/admin/usuarios' },
  { label: 'Auditoria Admin', icon: ClipboardList, path: '/admin/auditoria' },
];

const empleadoNavOrder = [
  'dashboard',
  'notificaciones',
  'clientes',
  'divider',
  'documentos',
  'beneficiarios',
  'observaciones',
  'perfiles',
];

const navItemGroups = {
  dashboard: navItems[0],
  notificaciones: navItems[1],
  documentos: navItems[7],
  beneficiarios: navItems[8],
  observaciones: navItems[9],
  clientes: navItems[11],
  perfiles: navItems[12],
};

const getNavItemsForRole = (rol) => {
  if (rol === 'empleado') {
    return empleadoNavOrder.map((key) => (key === 'divider' ? { type: 'divider' } : navItemGroups[key]));
  }

  return navItems.filter((item) => item.roles.includes(rol));
};

export default function Sidebar({ mobileOpen = false, onClose, desktopCollapsed = false }) {
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const activePath = location.pathname;

  const isActive = (path) => {
    if (activePath === path) return true;
    if (path !== '/' && activePath.startsWith(path + '/')) return true;
    return false;
  };

  const goTo = (path) => {
    onClose?.();
    if (path !== location.pathname) navigate(path);
  };

  if (!usuario) return null;
  const isAdmin = usuario.rol === 'admin';

  const renderItem = (item, key) => {
    if (item.type === 'divider') {
      return <div key={key} className={`my-3 border-t border-white/10 ${desktopCollapsed ? 'mx-3' : 'mr-5'}`} />;
    }
    const active = isActive(item.path);
    return (
      <button
        key={key}
        onClick={() => goTo(item.path)}
        title={desktopCollapsed ? item.label : undefined}
        className={`sidebar-nav-item group flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold ${desktopCollapsed ? 'lg:justify-center lg:px-0' : ''} ${
          active
            ? 'sidebar-active-item'
            : 'rounded-l-2xl text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
      >
        <item.icon className={`sidebar-nav-icon h-5 w-5 ${active ? 'text-slate-950' : 'text-cyan-100/80 group-hover:text-white'}`} />
        <span className={`sidebar-nav-label ${desktopCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
      </button>
    );
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside className={`sidebar-shell fixed left-0 top-0 z-40 flex h-screen w-72 max-w-[86vw] flex-col overflow-hidden bg-[#08111f] text-white shadow-[18px_0_50px_rgba(8,17,31,0.2)] transition-[transform,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:max-w-none lg:translate-x-0 ${desktopCollapsed ? 'lg:w-20' : 'lg:w-72'} ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
      <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_30%_10%,rgba(20,184,166,0.32),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.2),transparent_36%)]" />
      <div className={`relative flex items-center gap-3 border-b border-white/10 px-6 py-6 ${desktopCollapsed ? 'lg:justify-center lg:px-4' : ''}`}>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-sm font-black text-white shadow-sm backdrop-blur">
          DDC
        </div>
        <div className={desktopCollapsed ? 'lg:hidden' : ''}>
          <span className="block text-sm font-bold tracking-wide text-white">KYC Inmobiliario</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-teal-100/80">Compliance Regulatorio</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white/15 hover:text-white lg:hidden"
          aria-label="Cerrar menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className={`relative mx-5 mt-5 rounded-xl border border-white/10 bg-white/[0.06] p-4 shadow-inner ${desktopCollapsed ? 'lg:hidden' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-300 text-slate-950">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className={desktopCollapsed ? 'lg:hidden' : ''}>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Centro KYC</div>
            <div className="text-sm font-semibold text-white">Control operativo</div>
          </div>
        </div>
      </div>

      <nav className={`relative flex-1 space-y-1 overflow-x-hidden overflow-y-auto pl-4 py-6 ${desktopCollapsed ? 'lg:pl-3 lg:pr-0' : ''}`}>
        {isAdmin ? (
          <>
            <div className={`px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 ${desktopCollapsed ? 'lg:text-center lg:text-[0px]' : ''}`}>{desktopCollapsed ? 'AD' : 'Administracion'}</div>
            {adminItems.map((item) => renderItem(item, 'admin-' + item.path))}
          </>
        ) : (
          getNavItemsForRole(usuario.rol).map((item, index) => renderItem(item, item.path || `divider-${index}`))
        )}
      </nav>

      <div className={`relative min-h-[142px] space-y-1 border-t border-white/10 px-4 py-5 ${desktopCollapsed ? 'lg:min-h-[116px] lg:px-3' : ''}`}>
        <div className={`h-[58px] px-3 pb-3 ${desktopCollapsed ? 'lg:hidden' : ''}`}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Usuario</div>
          <div className="truncate text-xs font-bold text-white">{usuario.nombre || usuario.correo}</div>
          <div className="mt-0.5 truncate text-[10px] font-medium capitalize text-slate-300">{usuario.rol?.replace('_', ' ')}</div>
        </div>
        <button
          onClick={cerrarSesion}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white ${desktopCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
          title={desktopCollapsed ? 'Cerrar sesion' : undefined}
        >
          <LogOut className="h-5 w-5" />
          <span className={desktopCollapsed ? 'lg:hidden' : ''}>Cerrar sesion</span>
        </button>
      </div>
      </aside>
    </>
  );
}
