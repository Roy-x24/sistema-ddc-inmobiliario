import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, Clock3, LockKeyhole, X } from 'lucide-react';
import InfoHint from './InfoHint';

export default function ExpedienteChecklistPanel({ clienteId, title = 'Checklist del expediente', compact = false, onClose }) {
  const navigate = useNavigate();
  const { usuario } = useAuth();
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
            <div className="mt-1 flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-950">
                {!checklist ? 'Cargando controles...' : checklist.blocking_count ? `${checklist.blocking_count} bloqueo(s) antes de decidir` : 'Sin bloqueos críticos'}
              </h2>
              <InfoHint label="Que valida este checklist" side="bottom">
                Resume controles del expediente: datos, perfiles, documentos, BF, observaciones, riesgo y reglas de activacion. Sus botones cambian segun el rol.
              </InfoHint>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Valida datos, perfiles, documentos, BF, observaciones, riesgo y controles antes de activar o rechazar.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {checklist && (
            <span className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-widest ${checklist.ready_for_officer ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              {checklist.ready_for_officer ? 'Listo' : 'En progreso'}
              <InfoHint label="Estado del checklist" side="bottom">
                Listo significa que no hay bloqueos operativos detectados. En progreso indica que falta completar o revisar algun control.
              </InfoHint>
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
        <div className={`mt-4 grid gap-3 ${compact ? 'min-[520px]:grid-cols-2' : 'md:grid-cols-2'}`}>
          {visibles.map((item) => (
            <ChecklistMiniCard key={item.key} item={item} rol={usuario?.rol || 'empleado'} onNavigate={(route) => navigate(route)} />
          ))}
        </div>
      )}
    </section>
  );
}

function actionForRole(item, rol) {
  const owner = String(item.owner || '').toLowerCase();
  const key = item.key;
  const isDone = item.status === 'COMPLETO' || item.status === 'NO_APLICA';

  if (isDone) {
    if (key === 'documentos_obligatorios' && ['empleado', 'oficial_cumplimiento', 'admin', 'auditor'].includes(rol)) {
      return { label: 'Ver documentos', route: item.action_route || '/documentos' };
    }
    return { ownerText: 'Control completo' };
  }

  const policies = {
    datos_cliente: {
      empleado: { label: item.action || 'Completar datos', route: item.action_route },
      admin: { label: item.action || 'Completar datos', route: item.action_route },
      oficial_cumplimiento: { ownerText: 'Lo completa Empleado' },
      auditor: { ownerText: 'Solo lectura' },
    },
    perfiles: {
      empleado: { label: item.action || 'Completar perfiles', route: item.action_route },
      admin: { label: item.action || 'Completar perfiles', route: item.action_route },
      oficial_cumplimiento: { ownerText: 'Lo completa Empleado' },
      auditor: { ownerText: 'Solo lectura' },
    },
    documentos_obligatorios: {
      empleado: { label: 'Subir documentos', route: item.action_route || '/documentos' },
      admin: { label: 'Subir documentos', route: item.action_route || '/documentos' },
      oficial_cumplimiento: { label: 'Revisar documentos', route: item.action_route || '/documentos' },
      auditor: { ownerText: 'Solo lectura' },
    },
    beneficiarios_finales: {
      empleado: { label: 'Registrar BF', route: item.action_route || '/beneficiarios' },
      admin: { label: 'Validar BF', route: item.action_route || '/beneficiarios' },
      oficial_cumplimiento: { label: 'Validar BF', route: item.action_route || '/beneficiarios' },
      auditor: { ownerText: 'Solo lectura' },
    },
    observaciones: {
      empleado: { label: 'Responder observaciones', route: item.action_route || '/observaciones' },
      admin: { label: 'Cerrar observaciones', route: item.action_route || '/observaciones' },
      oficial_cumplimiento: { label: 'Cerrar observaciones', route: item.action_route || '/observaciones' },
      auditor: { ownerText: 'Solo lectura' },
    },
    riesgo_vigente: {
      empleado: { ownerText: 'Lo revisa Oficial' },
      admin: { label: item.action || 'Calcular riesgo', route: item.action_route },
      oficial_cumplimiento: { label: item.action || 'Calcular riesgo', route: item.action_route },
      auditor: { ownerText: 'Solo lectura' },
    },
  };

  const action = policies[key]?.[rol];
  if (action) return action;
  if (rol === 'auditor') return { ownerText: 'Solo lectura' };
  if (owner.includes('oficial') && rol === 'empleado') return { ownerText: 'Lo revisa Oficial' };
  if (owner.includes('empleado') && rol === 'oficial_cumplimiento') return { ownerText: 'Lo completa Empleado' };
  if (item.action && item.action_route && ['admin', 'oficial_cumplimiento'].includes(rol)) return { label: item.action, route: item.action_route };
  return { ownerText: owner.includes('sistema') ? 'Control automatico' : 'Sin accion para este rol' };
}

function ChecklistMiniCard({ item, rol, onNavigate }) {
  const ok = item.status === 'COMPLETO' || item.status === 'NO_APLICA';
  const Icon = ok ? CheckCircle2 : item.blocking ? LockKeyhole : item.status === 'PENDIENTE' ? Clock3 : AlertTriangle;
  const tone = ok
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : item.blocking
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-amber-200 bg-amber-50 text-amber-700';

  const action = actionForRole(item, rol);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.owner || 'sistema'}</div>
              <div className="mt-0.5 break-words text-sm font-black leading-5 text-slate-950">{item.label}</div>
            </div>
            <span className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-widest ${tone}`}>
              {item.status}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{item.message}</p>
      {action?.label && action?.route ? (
        <button type="button" onClick={() => onNavigate(action.route)} className="btn-secondary mt-3 w-full justify-center" style={{ padding: '7px 9px', fontSize: 12 }}>
          {action.label} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ) : (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-400">
          {action?.ownerText || 'Sin accion para este rol'}
        </div>
      )}
    </div>
  );
}
