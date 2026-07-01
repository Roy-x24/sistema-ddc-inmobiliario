import { useEffect, useMemo, useState } from 'react';
import { Bot, FileSearch, X } from 'lucide-react';
import OCRPrefillPanel from './OCRPrefillPanel';
import { documentosParaTipoCliente } from '../utils/documentosCatalog';

const PRIORIDAD_ANALISIS = {
  NATURAL: ['DOCUMENTO_IDENTIDAD', 'COMPROBANTE_INGRESOS', 'COMPROBANTE_RESIDENCIA', 'DECLARACION_ORIGEN_FONDOS'],
  JURIDICA: ['CERTIFICADO_EXISTENCIA', 'AVISO_OPERACION', 'IDENTIFICACION_REPRESENTANTE', 'IDENTIFICACION_BENEFICIARIOS', 'DECLARACION_ORIGEN_FONDOS'],
};

export default function AssistedDocumentAnalyzer({
  tipoCliente,
  title = 'Prellenado asistido',
  description,
  archivo,
  onArchivoChange,
  tipoDocumento,
  onTipoDocumentoChange,
  analizando,
  onAnalyze,
  result,
  currentValues,
  onApplyField,
  onApplyAll,
}) {
  const [preview, setPreview] = useState({ url: '', type: '', name: '' });
  const opciones = useMemo(() => {
    const prioridad = PRIORIDAD_ANALISIS[tipoCliente] || [];
    return documentosParaTipoCliente(tipoCliente)
      .filter((doc) => prioridad.includes(doc.value))
      .sort((a, b) => prioridad.indexOf(a.value) - prioridad.indexOf(b.value));
  }, [tipoCliente]);
  const seleccionado = opciones.find((doc) => doc.value === tipoDocumento) || opciones[0];

  useEffect(() => {
    if (!tipoDocumento && opciones[0]) onTipoDocumentoChange(opciones[0].value);
  }, [onTipoDocumentoChange, opciones, tipoDocumento]);

  useEffect(() => {
    if (preview.url) URL.revokeObjectURL(preview.url);
    if (!archivo) {
      setPreview({ url: '', type: '', name: '' });
      return undefined;
    }
    const next = { url: URL.createObjectURL(archivo), type: archivo.type || '', name: archivo.name };
    setPreview(next);
    return () => URL.revokeObjectURL(next.url);
  }, [archivo]);

  const isImage = preview.type.startsWith('image/');
  const isPdf = preview.type === 'application/pdf' || archivo?.name?.toLowerCase().endsWith('.pdf');

  return (
    <div className="card" style={{ padding: 18, marginBottom: 20, borderColor: 'rgba(20,184,166,0.22)', background: 'linear-gradient(135deg, rgba(20,184,166,0.07), rgba(255,255,255,0.96))' }}>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
          <Bot className="h-5 w-5" />
        </div>
        <div className="min-w-[240px] flex-1">
          <div className="font-black text-slate-950">{title}</div>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            {description || 'Selecciona que documento estas usando, revisa la vista previa y luego analiza. Nada se guarda sin confirmacion humana.'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(260px,0.9fr)_minmax(280px,1.1fr)]">
        <div className="space-y-3">
          <div>
            <label className="label-upper">Documento para analizar</label>
            <select value={tipoDocumento || seleccionado?.value || ''} onChange={(event) => onTipoDocumentoChange(event.target.value)} className="select-field" style={{ width: '100%' }}>
              {opciones.map((doc) => (
                <option key={doc.value} value={doc.value}>{doc.label}</option>
              ))}
            </select>
          </div>
          {seleccionado && (
            <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">{seleccionado.requirement}</div>
              <div className="mt-1 text-sm font-black text-slate-950">{seleccionado.label}</div>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{seleccionado.description}</p>
              {seleccionado.fills?.length > 0 && (
                <p className="mt-2 text-xs font-bold text-teal-700">
                  Puede sugerir: {seleccionado.fills.join(', ')}.
                </p>
              )}
            </div>
          )}
          <div>
            <label className="label-upper">Archivo</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => onArchivoChange(event.target.files?.[0] || null)} className="input-field" style={{ padding: 9 }} />
          </div>
          <button type="button" onClick={onAnalyze} disabled={!archivo || analizando} className="btn-secondary" style={{ padding: '10px 14px', fontSize: 12, opacity: !archivo || analizando ? 0.65 : 1 }}>
            <FileSearch className="h-4 w-4" /> {analizando ? 'Analizando...' : 'Analizar documento'}
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Vista previa</p>
              <p className="mt-1 max-w-md truncate text-sm font-black text-slate-950">{archivo?.name || 'Sin archivo seleccionado'}</p>
            </div>
            {archivo && (
              <button type="button" onClick={() => onArchivoChange(null)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" aria-label="Quitar archivo">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex min-h-[260px] items-center justify-center bg-slate-50 p-3">
            {!archivo && <p className="px-4 text-center text-sm font-semibold text-slate-400">Sube un PDF o imagen para confirmar que es el documento correcto antes de analizar.</p>}
            {preview.url && isImage && <img src={preview.url} alt={preview.name} className="max-h-[340px] max-w-full rounded-xl bg-white object-contain shadow-sm" />}
            {preview.url && isPdf && <iframe title={preview.name} src={preview.url} className="h-[340px] w-full rounded-xl border border-slate-200 bg-white shadow-sm" />}
            {preview.url && !isImage && !isPdf && <p className="px-4 text-center text-sm font-semibold text-slate-500">Este formato no tiene vista previa integrada.</p>}
          </div>
        </div>
      </div>

      <OCRPrefillPanel
        result={result}
        currentValues={currentValues}
        onApplyField={onApplyField}
        onApplyAll={onApplyAll}
      />
    </div>
  );
}
