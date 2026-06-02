import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, FileText, Shield, AlertTriangle,
  ClipboardList, Settings, LogOut, Briefcase
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['empleado', 'oficial_cumplimiento', 'auditor', 'admin'] },
  { label: 'Clientes', icon: Users, path: '/clientes', roles: ['empleado', 'oficial_cumplimiento', 'auditor', 'admin'] },
  { label: 'Documentos', icon: FileText, path: '/documentos', roles: ['empleado', 'oficial_cumplimiento', 'admin'] },
  { label: 'Riesgo', icon: Shield, path: '/riesgo', roles: ['oficial_cumplimiento', 'auditor', 'admin'] },
  { label: 'Activacion', icon: AlertTriangle, path: '/activacion', roles: ['oficial_cumplimiento', 'admin'] },
  { label: 'Auditoria', icon: ClipboardList, path: '/auditoria', roles: ['oficial_cumplimiento', 'auditor', 'admin'] },
];

export default function Sidebar() {
  const { usuario, cerrarSesion } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!usuario) return null;

  const isAdmin = usuario.rol === 'admin';

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col bg-sidebar text-white">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-acento font-bold text-white">DDC</div>
        <span className="text-sm font-semibold tracking-wide">KYC Inmobiliario</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems
          .filter((item) => item.roles.includes(usuario.rol))
          .map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        {isAdmin && (
          <button
            onClick={() => navigate('/admin/matriz')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors mb-1 ${
              location.pathname.startsWith('/admin') ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="h-4 w-4" />
            Matriz de Riesgo
          </button>
        )}
        <button
          onClick={cerrarSesion}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
