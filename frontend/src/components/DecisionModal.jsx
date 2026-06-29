import { useEffect, useMemo, useState } from 'react';
import Modal from './ui/Modal';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

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
                {details.map((item) => <li key={item}>- {item}</li>)}
              </ul>
            )}
          </div>
        </div>

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
