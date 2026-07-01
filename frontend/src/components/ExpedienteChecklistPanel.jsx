import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, Clock3, LockKeyhole, X } from 'lucide-react';

export default function ExpedienteChecklistPanel({ clienteId, title = 'Checklist del expediente', compact = false, onClose }) {
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!clienteId) return;
    setChecklist(null);
    setError('');
    api.post(`/clientes/${clienteId}/checklist`)
      .then((res) => setChecklist(res.data))
      .catch(() => setError('No se pudo cargar la checklist del expediente'));
  }, [clienteId]);

  if (!clienteId) return null;

  const bloqueos = (checklist?.items || []).filter((item) => item.blocking);
  const visibles = compact
    ? [...bloqueos, ...(checklist?.items || []).filter((item) => !item.blocking)].slice(0, 6)
    : (checklist?.items || []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${checklist?.blocking_count ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">
              {!checklist ? 'Cargando controles...' : checklist.blocking_count ? `${checklist.blocking_count} bloqueo(s) antes de decidir` : 'Sin bloqueos críticos'}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Valida datos, perfiles, documentos, BF, observaciones, riesgo y controles antes de activar o rechazar.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {checklist && (
            <span className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-widest ${checklist.ready_for_officer ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              {checklist.ready_for_officer ? 'Listo' : 'En progreso'}
            </span>
          )}
          {onClose && (
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Cerrar checklist">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {checklist && (
        <div className={`mt-4 grid gap-3 ${compact ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-2'}`}>
          {visibles.map((item) => (
            <ChecklistMiniCard key={item.key} item={item} onNavigate={(route) => navigate(route)} />
          ))}
        </div>
      )}
    </section>
  );
}

function ChecklistMiniCard({ item, onNavigate }) {
  const ok = item.status === 'COMPLETO' || item.status === 'NO_APLICA';
  const Icon = ok ? CheckCircle2 : item.blocking ? LockKeyhole : item.status === 'PENDIENTE' ? Clock3 : AlertTriangle;
  const tone = ok
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : item.blocking
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${tone}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.owner || 'sistema'}</div>
            <div className="mt-0.5 text-sm font-black text-slate-950">{item.label}</div>
          </div>
        </div>
        <span className={`rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-widest ${tone}`}>
          {item.status}
        </span>
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{item.message}</p>
      {item.action && item.action_route && (
        <button type="button" onClick={() => onNavigate(item.action_route)} className="btn-secondary mt-3" style={{ padding: '6px 9px', fontSize: 12 }}>
          {item.action} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
