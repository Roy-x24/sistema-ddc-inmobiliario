import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import EmptyState from '../components/EmptyState';
import { AlertTriangle, Bell, CheckCircle2, ClipboardList, FileText, Search, ShieldAlert, UserCheck } from 'lucide-react';

const PRIORIDAD_STYLE = {
  ALTA: 'border-rose-200 bg-rose-50 text-rose-700',
  MEDIA: 'border-amber-200 bg-amber-50 text-amber-700',
  BAJA: 'border-slate-200 bg-slate-50 text-slate-600',
};

const TYPE_ICON = {
  observacion: AlertTriangle,
  documentos: FileText,
  beneficiarios: UserCheck,
  riesgo: ShieldAlert,
  screening: ShieldAlert,
  auditoria: ClipboardList,
  cola: Bell,
  checklist: CheckCircle2,
};

export default function Notificaciones() {
  const navigate = useNavigate();
  const [data, setData] = useState({ total: 0, alta: 0, items: [] });
  const [filtro, setFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activo = true;
    setLoading(true);
    api.get('/notificaciones/')
      .then((res) => {
        if (activo) setData(res.data || { total: 0, alta: 0, items: [] });
      })
      .catch(() => {
        if (activo) setData({ total: 0, alta: 0, items: [] });
      })
      .finally(() => {
        if (activo) setLoading(false);
      });
    return () => { activo = false; };
  }, []);

  const items = data.items || [];
  const filtradas = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    return items.filter((item) => {
      if (filtro && item.prioridad !== filtro) return false;
      if (!query) return true;
      return [item.titulo, item.mensaje, item.tipo].filter(Boolean).join(' ').toLowerCase().includes(query);
    });
  }, [items, filtro, busqueda]);

  return (
    <div className="animate-fade-in-up space-y-6">
      <header>
        <h1 style={{ fontSize: 28 }}>Notificaciones</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Avisos operativos calculados desde expedientes, checklist, observaciones, BF y colas de cumplimiento.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Total" value={loading ? '-' : data.total} icon={Bell} />
        <SummaryCard label="Alta prioridad" value={loading ? '-' : data.alta} icon={AlertTriangle} tone="rose" />
        <SummaryCard label="Mostrando" value={loading ? '-' : filtradas.length} icon={Search} tone="teal" />
      </section>

      <section className="card" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(160px, 220px)', gap: 12 }}>
          <div>
            <label className="label-upper">Busqueda</label>
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              className="input-field"
              placeholder="Buscar por cliente, motivo o tipo..."
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label className="label-upper">Prioridad</label>
            <select value={filtro} onChange={(event) => setFiltro(event.target.value)} className="select-field" style={{ width: '100%' }}>
              <option value="">Todas</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {loading && (
          <div className="card" style={{ padding: 24, color: 'var(--text-muted)' }}>Cargando notificaciones...</div>
        )}
        {!loading && filtradas.length === 0 && (
          <EmptyState
            icon={Bell}
            title="Sin notificaciones para estos filtros"
            message="Cuando existan observaciones, documentos faltantes, BF pendientes o colas críticas aparecerán aquí."
          />
        )}
        {!loading && filtradas.map((item) => (
          <NotificationRow key={item.id} item={item} onOpen={() => navigate(item.destino || '/dashboard')} />
        ))}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, tone = 'slate' }) {
  const toneClass = tone === 'rose' ? 'bg-rose-100 text-rose-700' : tone === 'teal' ? 'bg-teal-100 text-teal-700' : 'bg-slate-950 text-white';
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

function NotificationRow({ item, onOpen }) {
  const Icon = TYPE_ICON[item.tipo] || Bell;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black text-slate-950">{item.titulo}</h2>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-widest ${PRIORIDAD_STYLE[item.prioridad] || PRIORIDAD_STYLE.MEDIA}`}>
                {item.prioridad}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{item.mensaje}</p>
            <p className="mt-2 text-[11px] font-black uppercase tracking-widest text-slate-400">{item.tipo}</p>
          </div>
        </div>
        <button type="button" onClick={onOpen} className="btn-primary" style={{ padding: '9px 14px', fontSize: 12 }}>
          Abrir flujo
        </button>
      </div>
    </article>
  );
}
