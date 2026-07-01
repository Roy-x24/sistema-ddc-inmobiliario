import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { Activity, Bell, Bot, ClipboardList, Download, FileSearch, ShieldCheck } from 'lucide-react';

const PREVIEW_LIMIT = 5;

export default function AuditorDashboard() {
  const navigate = useNavigate();
  const [auditoria, setAuditoria] = useState([]);
  const [modelRuns, setModelRuns] = useState([]);
  const [notificaciones, setNotificaciones] = useState({ total: 0, alta: 0, items: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;
    setLoading(true);
    Promise.all([
      api.get('/auditoria'),
      api.get('/ai/model-runs'),
      api.get('/notificaciones/'),
    ])
      .then(([auditRes, runsRes, notifRes]) => {
        if (!activo) return;
        setAuditoria(auditRes.data || []);
        setModelRuns(runsRes.data || []);
        setNotificaciones(notifRes.data || { total: 0, alta: 0, items: [] });
      })
      .catch(() => {
        if (!activo) return;
        setAuditoria([]);
        setModelRuns([]);
        setNotificaciones({ total: 0, alta: 0, items: [] });
      })
      .finally(() => {
        if (activo) setLoading(false);
      });
    return () => { activo = false; };
  }, []);

  const expedientesConMasEventos = useMemo(() => {
    const counts = new Map();
    auditoria.forEach((item) => {
      if (!item.cliente_id) return;
      counts.set(item.cliente_id, (counts.get(item.cliente_id) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, PREVIEW_LIMIT);
  }, [auditoria]);

  const erroresIA = modelRuns.filter((run) => run.status !== 'ok' || run.errors?.length).length;

  return (
    <div className="animate-fade-in-up space-y-6">
      <header className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-2xl">
        <div className="relative p-7">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_20%,rgba(20,184,166,0.35),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(245,158,11,0.22),transparent_32%)]" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-teal-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Auditoria independiente
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-white">Dashboard Auditor</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Vista de consulta para revisar trazabilidad, evidencia IA/OCR y avisos operativos sin intervenir expedientes.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate('/auditoria')} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5">
                <ClipboardList className="h-4 w-4" />
                Ver auditoria
              </button>
              <button onClick={() => navigate('/notificaciones')} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15">
                <Bell className="h-4 w-4" />
                Notificaciones
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Eventos auditados" value={loading ? '-' : auditoria.length} icon={ClipboardList} />
        <MetricCard label="Corridas IA/OCR" value={loading ? '-' : modelRuns.length} icon={Bot} tone="teal" />
        <MetricCard label="Alertas IA" value={loading ? '-' : erroresIA} icon={Activity} tone="amber" />
        <MetricCard label="Avisos altos" value={loading ? '-' : notificaciones.alta} icon={Bell} tone="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-teal-700">Trazabilidad</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Eventos recientes</h2>
            </div>
            <button onClick={() => navigate('/auditoria')} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12 }}>
              Abrir auditoria
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Fecha</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Usuario</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Accion</th>
                  <th className="px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Expediente</th>
                </tr>
              </thead>
              <tbody>
                {auditoria.slice(0, PREVIEW_LIMIT).map((item) => (
                  <tr key={item.id_auditoria} className="border-t border-slate-100">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">{new Date(item.fecha).toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{item.usuario}</td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{item.accion?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.cliente_id ? `${item.cliente_id.slice(0, 8)}...` : '-'}</td>
                  </tr>
                ))}
                {!loading && auditoria.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center font-semibold text-slate-500">Sin eventos recientes.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <InfoPanel
            icon={Bot}
            title="Actividad IA/OCR"
            subtitle={`${modelRuns.length} corrida(s), ${erroresIA} con alerta`}
            action="Ver auditoria IA"
            onClick={() => navigate('/auditoria')}
          />
          <InfoPanel
            icon={FileSearch}
            title="Expedientes con mas eventos"
            subtitle={expedientesConMasEventos.length ? expedientesConMasEventos.map(([id, count]) => `${id.slice(0, 8)}... (${count})`).join(', ') : 'Sin actividad agrupada'}
            action="Investigar"
            onClick={() => navigate('/auditoria')}
          />
          <InfoPanel
            icon={Download}
            title="Exportaciones"
            subtitle="La exportacion CSV se gestiona desde Auditoria."
            action="Exportar desde auditoria"
            onClick={() => navigate('/auditoria')}
          />
        </aside>
      </section>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, tone = 'slate' }) {
  const toneClass = tone === 'rose' ? 'bg-rose-100 text-rose-700' : tone === 'teal' ? 'bg-teal-100 text-teal-700' : tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-slate-950 text-white';
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function InfoPanel({ icon: Icon, title, subtitle, action, onClick }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{subtitle}</p>
        </div>
      </div>
      <button onClick={onClick} className="btn-primary mt-4 w-full justify-center" style={{ padding: '9px 12px', fontSize: 12 }}>
        {action}
      </button>
    </div>
  );
}
