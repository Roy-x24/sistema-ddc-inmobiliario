import { useEffect, useMemo, useState } from 'react';
import api from '../api/axiosConfig';
import { Users, Clock, CheckCircle, AlertTriangle, ShieldAlert, Eye, FileCheck } from 'lucide-react';

const EMPTY_STATS = {
  total: 0,
  pendiente: 0,
  pendiente_bf: 0,
  en_revision: 0,
  observado: 0,
  activo: 0,
  bloqueado: 0,
  rechazado: 0
};

export default function Dashboard() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [reciente, setReciente] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function cargarDashboard() {
      setCargando(true);

      try {
        const [clientesRes, auditoriaRes] = await Promise.all([
          api.get('/clientes/?limit=9999', { signal: controller.signal }),
          api.get('/auditoria', { signal: controller.signal }).catch(() => ({ data: [] }))
        ]);

        const data = clientesRes.data || [];
        const resumen = data.reduce((acc, cliente) => {
          acc.total += 1;

          if (cliente.estado in acc) {
            acc[cliente.estado.toLowerCase()] += 1;
          }

          return acc;
        }, { ...EMPTY_STATS });

        setStats(resumen);
        setReciente((auditoriaRes.data || []).slice(0, 10));
      } catch (error) {
        if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
          setStats(EMPTY_STATS);
          setReciente([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargarDashboard();

    return () => controller.abort();
  }, []);

  const statCards = useMemo(() => [
    { label: 'Total expedientes', value: stats.total, icon: Users, color: 'text-navy-800', bg: 'bg-navy-700/10', border: 'border-navy-600/20' },
    { label: 'Pendientes', value: stats.pendiente + stats.pendiente_bf, icon: Clock, color: 'text-gold-dark', bg: 'bg-gold/10', border: 'border-gold/20' },
    { label: 'En revision', value: stats.en_revision, icon: Eye, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Observados', value: stats.observado, icon: AlertTriangle, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
    { label: 'Activos', value: stats.activo, icon: CheckCircle, color: 'text-risk-bajo', bg: 'bg-risk-bajo/10', border: 'border-risk-bajo/20' },
    { label: 'Bloqueados', value: stats.bloqueado, icon: ShieldAlert, color: 'text-risk-alto', bg: 'bg-risk-alto/10', border: 'border-risk-alto/20' },
    { label: 'Rechazados', value: stats.rechazado, icon: FileCheck, color: 'text-ink-muted', bg: 'bg-ink-muted/10', border: 'border-ink-muted/20' },
  ], [stats]);

  const actionIcon = (accion) => {
    if (accion.includes('ACTIVAR')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (accion.includes('RECHAZAR')) return <ShieldAlert className="h-4 w-4 text-red-600" />;
    if (accion.includes('OBSERVACION')) return <AlertTriangle className="h-4 w-4 text-purple-600" />;
    if (accion.includes('DOCUMENTO')) return <FileCheck className="h-4 w-4 text-blue-600" />;
    return <Eye className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="dashboard-smooth space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <div className="mt-2 text-sm text-gray-500">Resumen del sistema de cumplimiento regulatorio</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="dashboard-card luxury-card p-5"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">{card.label}</p>
                <p className="mt-1 font-display text-3xl font-bold tracking-tight text-navy-800">{cargando ? '-' : card.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${card.border} ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-6 w-1.5 rounded-full bg-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Acciones recientes</h3>
        </div>
        {cargando ? (
          <div className="space-y-2">
            {[0, 1, 2].map((item) => (
              <div key={item} className="dashboard-skeleton h-14 rounded-lg" />
            ))}
          </div>
        ) : reciente.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">Sin registros recientes.</p>
        ) : (
          <div className="space-y-2">
            {reciente.map((r) => (
              <div
                key={r.id_auditoria}
                className="flex items-center justify-between rounded-xl border border-transparent px-4 py-3 transition-colors hover:border-gray-100 hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
                    {actionIcon(r.accion)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{r.usuario}</p>
                    <p className="text-xs font-medium text-gray-500 capitalize">{r.accion.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-400">{new Date(r.fecha).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
