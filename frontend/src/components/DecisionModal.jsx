import { useEffect, useMemo, useState } from 'react';
import Modal from './ui/Modal';
import { AlertTriangle, CheckCircle2, ClipboardCheck, LockKeyhole } from 'lucide-react';

export default function DecisionModal({
  open,
  title,
  description,
  actionLabel = 'Confirmar',
  tone = 'danger',
  requireReason = false,
  reasonLabel = 'Motivo',
  reasonPlaceholder = 'Describe el motivo operativo...',
  confirmText = '',
  confirmHelp = '',
  details = [],
  checklist,
  onClose,
  onConfirm,
}) {
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
      setConfirmation('');
      setSubmitting(false);
    }
  }, [open]);

  const canSubmit = useMemo(() => {
    if (requireReason && !reason.trim()) return false;
    if (confirmText && confirmation.trim() !== confirmText) return false;
    return !submitting;
  }, [confirmation, confirmText, reason, requireReason, submitting]);

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onConfirm?.({ reason: reason.trim(), confirmation: confirmation.trim() });
      onClose?.();
    } finally {
      setSubmitting(false);
    }
  };

  const Icon = tone === 'success' ? CheckCircle2 : AlertTriangle;
  const primaryClass = tone === 'success' ? 'btn-success' : tone === 'neutral' ? 'btn-primary' : 'btn-danger';

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={title}
      footer={(
        <>
          <button type="button" onClick={onClose} className="btn-secondary" disabled={submitting}>
            Cancelar
          </button>
          <button type="button" onClick={submit} className={primaryClass} disabled={!canSubmit}>
            {submitting ? 'Procesando...' : actionLabel}
          </button>
        </>
      )}
    >
      <div className="space-y-4">
        <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone === 'success' ? 'text-emerald-600' : 'text-amber-600'}`} />
          <div>
            <p className="font-bold text-slate-900">{description}</p>
            {details.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm font-semibold text-slate-500">
                {details.map((item, index) => {
                  const label = typeof item === 'object' ? item.label : '';
                  const value = typeof item === 'object' ? item.value : item;
                  return (
                    <li key={`${label || 'detail'}-${index}`}>
                      {label ? `${label}: ${value || '-'}` : `- ${value || '-'}`}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {checklist && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${checklist.blocking_count ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">Checklist antes de confirmar</div>
                  <div className="mt-1 text-sm font-black text-slate-950">
                    {checklist.blocking_count ? `${checklist.blocking_count} bloqueo(s) detectado(s)` : 'Sin bloqueos críticos detectados'}
                  </div>
                </div>
              </div>
              <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-black uppercase tracking-widest ${checklist.ready_for_officer ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                {checklist.ready_for_officer ? 'Listo' : 'En progreso'}
              </span>
            </div>
            <div className="mt-3 grid gap-2">
              {(checklist.items || []).filter((item) => item.blocking).slice(0, 4).map((item) => (
                <div key={item.key} className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50/70 px-3 py-2">
                  <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
                  <div>
                    <div className="text-xs font-black text-rose-800">{item.label}</div>
                    <div className="text-xs font-semibold text-rose-700">{item.message}</div>
                  </div>
                </div>
              ))}
              {(!checklist.items || checklist.items.filter((item) => item.blocking).length === 0) && (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs font-bold text-emerald-700">
                  La checklist no reporta bloqueos. La decisión seguirá quedando auditada.
                </div>
              )}
            </div>
          </div>
        )}

        {requireReason && (
          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">{reasonLabel}</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
              placeholder={reasonPlaceholder}
            />
          </label>
        )}

        {confirmText && (
          <label className="block">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Confirmacion manual</span>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {confirmHelp || `Escribe ${confirmText} para habilitar esta accion.`}
            </p>
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-black text-slate-900 outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
              placeholder={confirmText}
            />
          </label>
        )}
      </div>
    </Modal>
  );
}
