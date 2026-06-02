import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const rutas = [
  { path: '/dashboard', label: 'Dashboard', icon: '◆', roles: ['empleado', 'oficial_cumplimiento', 'auditor', 'administrador'] },
  { path: '/clientes', label: 'Clientes', icon: '◎', roles: ['empleado', 'oficial_cumplimiento', 'auditor', 'administrador'] },
  { path: '/documentos', label: 'Documentos', icon: '▣', roles: ['empleado', 'oficial_cumplimiento', 'administrador'] },
  { path: '/perfiles', label: 'Perfiles', icon: '◈', roles: ['empleado', 'administrador'] },
  { path: '/riesgo', label: 'Riesgo', icon: '◉', roles: ['oficial_cumplimiento', 'auditor', 'administrador'] },
  { path: '/activacion', label: 'Activación', icon: '✦', roles: ['oficial_cumplimiento', 'administrador'] },
  { path: '/auditoria', label: 'Auditoría', icon: '◐', roles: ['oficial_cumplimiento', 'auditor', 'administrador'] },
  { path: '/admin', label: 'Administración', icon: '✶', roles: ['administrador'] },
];

export default function Sidebar() {
  const { usuario } = useAuth();
  const location = useLocation();

  const permitidas = rutas.filter(r => r.roles.includes(usuario?.rol));

  return (
    <aside style={{
      width: 240,
      background: 'rgba(11, 15, 25, 0.95)',
      borderRight: '1px solid var(--border-subtle)',
      color: 'var(--text-secondary)',
      padding: '88px 16px 24px',
      position: 'fixed',
      top: 0,
      bottom: 0,
      left: 0,
      overflowY: 'auto',
      zIndex: 40
    }}>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'var(--text-muted)',
        marginBottom: 12,
        paddingLeft: 12
      }}>
        Módulos
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {permitidas.map(r => {
          const activa = location.pathname.startsWith(r.path);
          return (
            <Link
              key={r.path}
              to={r.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: activa ? 'var(--accent-gold)' : 'var(--text-secondary)',
                backgroundColor: activa ? 'rgba(201, 162, 39, 0.08)' : 'transparent',
                fontWeight: activa ? 700 : 500,
                fontSize: 14,
                transition: 'all var(--transition-fast)',
                borderLeft: activa ? '3px solid var(--accent-gold)' : '3px solid transparent',
                marginLeft: -3
              }}
            >
              <span style={{ fontSize: 13, opacity: activa ? 1 : 0.6 }}>{r.icon}</span>
              {r.label}
            </Link>
          );
        })}
      </nav>

      <div style={{
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        padding: 16,
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, rgba(201,162,39,0.08), rgba(59,130,246,0.05))',
        border: '1px solid rgba(201,162,39,0.15)'
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Versión</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-gold)' }}>MVP 1.0</div>
      </div>
    </aside>
  );
}
