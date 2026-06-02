import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import EstadoBadge from '../components/EstadoBadge';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, pendiente: 0, en_revision: 0, activo: 0, rechazado: 0 });
  const [reciente, setReciente] = useState([]);

  useEffect(() => {
    api.get('/clientes/?limit=9999').then(res => {
      const data = res.data || [];
      setStats({
        total: data.length,
        pendiente: data.filter(c => c.estado === 'PENDIENTE').length,
        en_revision: data.filter(c => c.estado === 'EN_REVISION').length,
        activo: data.filter(c => c.estado === 'ACTIVO').length,
        rechazado: data.filter(c => c.estado === 'RECHAZADO').length
      });
    });
    api.get('/auditoria').then(res => {
      setReciente((res.data || []).slice(0, 8));
    }).catch(() => {});
  }, []);

  const tarjeta = (label, valor, color, delay) => (
    <div className={`card animate-fade-in-up stagger-${delay}`} style={{
      flex: 1,
      minWidth: 180,
      padding: '24px 28px',
      borderLeft: `3px solid ${color}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>{valor}</div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 32 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>Resumen del sistema de cumplimiento regulatorio</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 32, marginTop: 24 }}>
        {tarjeta('Total clientes', stats.total, 'var(--accent-cobalt)', 1)}
        {tarjeta('Pendientes', stats.pendiente, 'var(--risk-estandar)', 2)}
        {tarjeta('En revisión', stats.en_revision, 'var(--accent-cobalt)', 3)}
        {tarjeta('Activos', stats.activo, 'var(--risk-bajo)', 4)}
        {tarjeta('Rechazados', stats.rechazado, 'var(--risk-alto)', 5)}
      </div>

      <div className="card animate-fade-in-up stagger-3" style={{ padding: 28 }}>
        <h3 style={{ fontSize: 18, marginBottom: 20, fontFamily: 'var(--font-display)' }}>Acciones recientes</h3>
        {reciente.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sin registros recientes.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {reciente.map((r, i) => (
            <div key={r.id_auditoria} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 0',
              borderBottom: i < reciente.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              transition: 'background-color var(--transition-fast)',
              borderRadius: 6,
              paddingLeft: 12,
              paddingRight: 12,
              marginLeft: -12,
              marginRight: -12
            }} className="audit-row">
              <div style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: 'rgba(201, 162, 39, 0.1)',
                  color: 'var(--accent-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700
                }}>
                  {r.usuario.charAt(0).toUpperCase()}
                </span>
                <div>
                  <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{r.usuario}</strong>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>{r.accion.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{new Date(r.fecha).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
