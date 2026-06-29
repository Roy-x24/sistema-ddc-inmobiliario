import { CheckCircle2, Wand2, AlertTriangle } from 'lucide-react';

const confidenceTone = (confidence = 0) => {
  if (confidence >= 0.82) return { label: 'Alta', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  if (confidence >= 0.65) return { label: 'Media', className: 'border-amber-200 bg-amber-50 text-amber-700' };
  return { label: 'Baja', className: 'border-rose-200 bg-rose-50 text-rose-700' };
};

const formatKey = (key) => key.replaceAll('_', ' ');

export default function OCRPrefillPanel({ result, currentValues = {}, onApplyField, onApplyAll }) {
  if (!result) return null;

  const fields = result.fields || {};
  const entries = Object.entries(fields).filter(([, value]) => value !== undefined && value !== null && value !== '');
  const confidence = Number(result.confidence || 0);
  const tone = confidenceTone(confidence);

  if (result.error || entries.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
        <div className="flex items-center gap-2 font-black">
          <AlertTriangle className="h-4 w-4" />
          Sin datos confiables para prellenar
        </div>
        <p className="mt-2 text-amber-700">{result.error || 'El OCR no devolvio campos utilizables. Puedes continuar el registro manualmente.'}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Datos detectados por OCR</span>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-widest ${tone.className}`}>
              Confianza {tone.label} · {Math.round(confidence * 100)}%
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Revisa diferencias antes de usar datos detectados. La IA no guarda cambios sin confirmacion humana.
          </p>
        </div>
        <button type="button" onClick={onApplyAll} className="btn-primary" style={{ padding: '9px 12px', fontSize: 12 }}>
          <Wand2 className="h-4 w-4" /> Usar todos
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {entries.map(([key, detected]) => {
          const current = currentValues?.[key];
          const changed = String(current || '').trim() && String(current || '').trim() !== String(detected || '').trim();
          return (
            <div
              key={key}
              data-testid={`ocr-field-${key}`}
              className={`rounded-xl border p-3 ${changed ? 'border-amber-200 bg-amber-50/60' : 'border-slate-100 bg-slate-50'}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">{formatKey(key)}</div>
                  <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">Registrado</div>
                      <div className="mt-1 truncate font-semibold text-slate-700">{current || '-'}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">Detectado</div>
                      <div className="mt-1 truncate font-black text-slate-950">{String(detected)}</div>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => onApplyField(key, detected)} className="btn-secondary" style={{ padding: '8px 11px', fontSize: 12 }}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Usar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
