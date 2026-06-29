import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Users, Clock, CheckCircle, AlertTriangle, ShieldAlert, Eye, FileCheck, Activity, ArrowUpRight, Bot, ClipboardList } from 'lucide-react';

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
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [reciente, setReciente] = useState([]);
  const [operativo, setOperativo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const rol = usuario?.rol;
  const puedeVerAuditoria = ['oficial_cumplimiento', 'auditor', 'admin'].includes(rol);
  const puedeVerMetricasSensibles = ['oficial_cumplimiento', 'auditor', 'admin'].includes(rol);
  const puedeVerIndicadoresEjecutivos = ['oficial_cumplimiento', 'admin'].includes(rol);

  useEffect(() => {
    const controller = new AbortController();

    async function cargarDashboard() {
      setCargando(true);

      try {
        const clientesRes = await api.get('/clientes/?limit=9999', { signal: controller.signal });
        const auditoriaRes = puedeVerAuditoria
          ? await api.get('/auditoria', { signal: controller.signal }).catch(() => ({ data: [] }))
          : { data: [] };

        const data = clientesRes.data || [];
        const resumen = data.reduce((acc, cliente) => {
          acc.total += 1;
          const estado = String(cliente.estado || '').toLowerCase();
          if (estado in acc) acc[estado] += 1;
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
        if (!controller.signal.aborted) setCargando(false);
      }
    }

    cargarDashboard();

    return () => controller.abort();
  }, [puedeVerAuditoria]);

  useEffect(() => {
    if (!rol) return;
    const endpoint = rol === 'empleado'
      ? '/dashboard/empleado'
      : rol === 'oficial_cumplimiento'
        ? '/dashboard/oficial'
        : '';
    if (!endpoint) return;
    api.get(endpoint).then(res => setOperativo(res.data)).catch(() => setOperativo(null));
  }, [rol]);

  const statCards = useMemo(() => ([
    { label: 'Total expedientes', value: stats.total, icon: Users, tone: 'bg-slate-950 text-white', hint: 'Universo registrado', visible: true },
    { label: 'Pendientes', value: stats.pendiente + stats.pendiente_bf, icon: Clock, tone: 'bg-amber-100 text-amber-800', hint: 'Requieren captura', visible: true },
    { label: 'En revision', value: stats.en_revision, icon: Eye, tone: 'bg-sky-100 text-sky-800', hint: 'En analisis', visible: true },
    { label: 'Observados', value: stats.observado, icon: AlertTriangle, tone: 'bg-violet-100 text-violet-800', hint: 'Con ajustes abiertos', visible: true },
    { label: 'Activos', value: stats.activo, icon: CheckCircle, tone: 'bg-emerald-100 text-emerald-800', hint: 'Habilitados', visible: puedeVerMetricasSensibles },
    { label: 'Bloqueados', value: stats.bloqueado, icon: ShieldAlert, tone: 'bg-rose-100 text-rose-800', hint: 'Alerta critica', visible: puedeVerMetricasSensibles },
    { label: 'Rechazados', value: stats.rechazado, icon: FileCheck, tone: 'bg-slate-100 text-slate-700', hint: 'Cerrados', visible: puedeVerMetricasSensibles },
  ]).filter(card => card.visible), [stats, puedeVerMetricasSensibles]);

  const workload = stats.total ? Math.round(((stats.pendiente + stats.pendiente_bf + stats.en_revision + stats.observado) / stats.total) * 100) : 0;
  const activeRate = stats.total ? Math.round((stats.activo / stats.total) * 100) : 0;

  const actionIcon = (accion = '') => {
    if (accion.includes('ACTIVAR')) return <CheckCircle className="h-4 w-4 text-emerald-600" />;
    if (accion.includes('RECHAZAR')) return <ShieldAlert className="h-4 w-4 text-rose-600" />;
    if (accion.includes('OBSERVACION')) return <AlertTriangle className="h-4 w-4 text-violet-600" />;
    if (accion.includes('DOCUMENTO')) return <FileCheck className="h-4 w-4 text-sky-600" />;
    return <Eye className="h-4 w-4 text-slate-500" />;
  };

  return (
    <div className="dashboard-smooth space-y-7">
      <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-2xl">
        <div className="relative p-7">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_20%,rgba(20,184,166,0.38),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(245,158,11,0.24),transparent_32%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-teal-100">
                <Activity className="h-3.5 w-3.5" />
                Monitor operacional
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-white">Dashboard KYC</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Vista ejecutiva de expedientes, carga operativa y eventos recientes del sistema de cumplimiento.
              </p>
            </div>
            <div className={`grid gap-3 ${puedeVerIndicadoresEjecutivos ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Carga abierta</p>
                <p className="mt-3 text-3xl font-black">{cargando ? '-' : `${workload}%`}</p>
              </div>
              {puedeVerIndicadoresEjecutivos && (
                <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Activacion</p>
                  <p className="mt-3 text-3xl font-black">{cargando ? '-' : `${activeRate}%`}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {rol === 'empleado' && operativo && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-teal-700">Trabajo del empleado</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Próximos expedientes a completar</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['Incompletos', operativo.incompletos],
                ['Docs faltantes', operativo.documentos_faltantes],
                ['Observaciones', operativo.observaciones_por_responder],
                ['Pendientes BF', operativo.pendientes_bf],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
                  <div className="text-lg font-black text-slate-950">{value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Cliente</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Bloqueos</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Condición</th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-400">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(operativo.items || []).slice(0, 8).map((item) => (
                  <tr key={item.id_cliente}>
                    <td className="px-4 py-3">
                      <div className="font-black text-slate-950">{item.nombre}</div>
                      <div className="font-mono text-xs text-slate-400">{item.identificacion}</div>
                    </td>
                    <td className="px-4 py-3 font-black text-slate-950">{item.blocking_count}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-500">
                      {item.observaciones_por_responder > 0 ? 'Observación sin respuesta' : item.documentos_faltantes?.length ? 'Faltan documentos' : item.blocking_count ? 'Requisitos pendientes' : 'Listo para revisión'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => navigate(item.destino)} className="btn-primary" style={{ padding: '8px 12px', fontSize: 12 }}>
                        {item.accion_sugerida}
                      </button>
                    </td>
                  </tr>
                ))}
                {(!operativo.items || operativo.items.length === 0) && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">No tienes expedientes pendientes.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {rol === 'oficial_cumplimiento' && operativo && (
        <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-teal-700">Bandeja del Oficial</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Prioridades operativas</h2>
              </div>
              <button onClick={() => navigate('/cumplimiento')} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12 }}>
                Ver cumplimiento
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
              {[
                ['Alto riesgo', operativo.alto_riesgo, AlertTriangle],
                ['Observados', operativo.observados, ShieldAlert],
                ['Revisión manual', operativo.revision_manual, Eye],
                ['Pendientes BF', operativo.pendientes_bf, Users],
                ['PEP/Sanciones', operativo.screening_alertas || 0, ShieldAlert],
                ['Prioridad alta', operativo.prioridades_criticas || 0, Activity],
              ].map(([label, value, Icon]) => (
                <button key={label} onClick={() => navigate('/cumplimiento')} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-teal-200 hover:bg-teal-50">
                  <Icon className="mb-3 h-5 w-5 text-gold" />
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</div>
                  <div className="mt-1 text-2xl font-black text-slate-950">{value}</div>
                </button>
              ))}
            </div>
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Cliente</th>
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Cola</th>
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Motivo</th>
                    <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-400">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(operativo.prioridad || []).slice(0, 8).map((item) => (
                    <tr key={item.id_cliente}>
                      <td className="px-4 py-3">
                        <div className="font-black text-slate-950">{item.nombre}</div>
                        <div className="font-mono text-xs text-slate-400">{item.identificacion}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500">{item.cola?.replaceAll('_', ' ')}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-500">{item.motivo_principal}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => navigate(`/expediente/${item.id_cliente}`)} className="btn-primary" style={{ padding: '8px 12px', fontSize: 12 }}>
                          Ver flujo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-gold" />
              <h2 className="text-lg font-black text-slate-950">Auditoría IA reciente</h2>
            </div>
            <div className="mt-4 space-y-3">
              {(operativo.auditoria_ia || []).map((item) => (
                <div key={item.id_auditoria} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                    <ClipboardList className="h-3.5 w-3.5" />
                    {item.accion?.replaceAll('_', ' ')}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-500">{new Date(item.fecha).toLocaleString()}</div>
                </div>
              ))}
              {(!operativo.auditoria_ia || operativo.auditoria_ia.length === 0) && (
                <p className="py-8 text-center text-sm font-semibold text-slate-500">Aún no hay eventos IA.</p>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="dashboard-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{card.label}</p>
                <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">{cargando ? '-' : card.value}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">{card.hint}</p>
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.tone}`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className={`grid gap-6 ${puedeVerAuditoria ? 'xl:grid-cols-[1fr_360px]' : ''}`}>
        {puedeVerAuditoria && <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-teal-700">Auditoria</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Acciones recientes</h2>
            </div>
            <ArrowUpRight className="h-5 w-5 text-slate-400" />
          </div>
          {cargando ? (
            <div className="space-y-2">
              {[0, 1, 2].map((item) => (
                <div key={item} className="dashboard-skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : reciente.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">Sin registros recientes.</p>
          ) : (
            <div className="space-y-2">
              {reciente.map((r) => (
                <div
                  key={r.id_auditoria}
                  className="flex items-center justify-between rounded-xl border border-transparent px-4 py-3 transition hover:border-slate-200 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                      {actionIcon(r.accion)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-950">{r.usuario}</p>
                      <p className="text-xs font-semibold capitalize text-slate-500">{r.accion?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">{new Date(r.fecha).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-teal-700">Pulso del sistema</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Distribucion</h2>
          <div className="mt-6 space-y-4">
            {statCards.filter(item => item.label !== 'Total expedientes').map((item) => {
              const value = Number(item.value) || 0;
              const width = stats.total ? Math.max(4, Math.round((value / stats.total) * 100)) : 4;
              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">{item.label}</span>
                    <span className="font-black text-slate-950">{cargando ? '-' : value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-teal-500" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
