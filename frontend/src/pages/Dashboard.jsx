import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Users, Clock, CheckCircle, AlertTriangle, ShieldAlert, Eye, FileCheck } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0, pendiente: 0, pendiente_bf: 0, en_revision: 0,
    observado: 0, activo: 0, bloqueado: 0, rechazado: 0
  });
  const [reciente, setReciente] = useState([]);

  useEffect(() => {
    api.get('/clientes/?limit=9999').then(res => {
      const data = res.data || [];
      setStats({
        total: data.length,
        pendiente: data.filter(c => c.estado === 'PENDIENTE').length,
        pendiente_bf: data.filter(c => c.estado === 'PENDIENTE_BF').length,
        en_revision: data.filter(c => c.estado === 'EN_REVISION').length,
        observado: data.filter(c => c.estado === 'OBSERVADO').length,
        activo: data.filter(c => c.estado === 'ACTIVO').length,
        bloqueado: data.filter(c => c.estado === 'BLOQUEADO').length,
        rechazado: data.filter(c => c.estado === 'RECHAZADO').length,
      });
    });
    api.get('/auditoria').then(res => {
      setReciente((res.data || []).slice(0, 10));
    }).catch(() => {});
  }, []);

  const statCards = [
    { label: 'Total expedientes', value: stats.total, icon: Users, color: 'text-navy-800', bg: 'bg-navy-700/10', border: 'border-navy-600/20' },
    { label: 'Pendientes', value: stats.pendiente + stats.pendiente_bf, icon: Clock, color: 'text-gold-dark', bg: 'bg-gold/10', border: 'border-gold/20' },
    { label: 'En revision', value: stats.en_revision, icon: Eye, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Observados', value: stats.observado, icon: AlertTriangle, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
    { label: 'Activos', value: stats.activo, icon: CheckCircle, color: 'text-risk-bajo', bg: 'bg-risk-bajo/10', border: 'border-risk-bajo/20' },
    { label: 'Bloqueados', value: stats.bloqueado, icon: ShieldAlert, color: 'text-risk-alto', bg: 'bg-risk-alto/10', border: 'border-risk-alto/20' },
    { label: 'Rechazados', value: stats.rechazado, icon: FileCheck, color: 'text-ink-muted', bg: 'bg-ink-muted/10', border: 'border-ink-muted/20' },
  ];

  const actionIcon = (accion) => {
    if (accion.includes('ACTIVAR')) return <CheckCircle className="h-3.5 w-3.5 text-risk-bajo" />;
    if (accion.includes('RECHAZAR')) return <ShieldAlert className="h-3.5 w-3.5 text-risk-alto" />;
    if (accion.includes('OBSERVACION')) return <AlertTriangle className="h-3.5 w-3.5 text-purple-600" />;
    if (accion.includes('DOCUMENTO')) return <FileCheck className="h-3.5 w-3.5 text-blue-600" />;
    return <Eye className="h-3.5 w-3.5 text-navy-700" />;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-navy-800">Dashboard</h1>
        <div className="gold-underline mt-2 text-sm text-ink-muted">Resumen del sistema de cumplimiento regulatorio</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`luxury-card p-5 animate-fade-in-up stagger-${i + 1}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">{card.label}</p>
                <p className="mt-1 font-display text-3xl font-bold tracking-tight text-navy-800">{card.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${card.border} ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="luxury-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <div className="h-1 w-8 rounded-full bg-gold" />
          <h3 className="font-display text-lg font-semibold text-navy-800">Acciones recientes</h3>
        </div>
        {reciente.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">Sin registros recientes.</p>
        ) : (
          <div className="space-y-1">
            {reciente.map((r) => (
              <div
                key={r.id_auditoria}
                className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-cream/60"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/20 bg-gold/10">
                    {actionIcon(r.accion)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{r.usuario}</p>
                    <p className="text-xs capitalize text-ink-muted">{r.accion.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-ink-muted">{new Date(r.fecha).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
