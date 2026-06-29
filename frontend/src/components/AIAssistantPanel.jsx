import { useState } from 'react';
import api from '../api/axiosConfig';
import { Bot, FileSearch, ListChecks, MessageSquarePlus, Search, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

const ACTIONS = {
  resumen: { label: 'Resumen IA', icon: Sparkles, endpoint: (id) => `/ai/clientes/${id}/resumen-operativo` },
  observacion: { label: 'Observacion sugerida', icon: MessageSquarePlus, endpoint: (id) => `/ai/clientes/${id}/observacion-sugerida` },
  beneficiarios: { label: 'Detectar BF', icon: UserCheck, endpoint: (id) => `/ai/clientes/${id}/beneficiarios-sugeridos` },
  screening: { label: 'PEP/sanciones', icon: ShieldAlert, endpoint: (id) => `/ai/clientes/${id}/screening` },
  prioridad: { label: 'Prioridad', icon: ListChecks, endpoint: (id) => `/ai/clientes/${id}/prioridad` },
  buscar: { label: 'Buscar contexto', icon: Search, endpoint: (id) => `/ai/clientes/${id}/buscar-contexto` },
};

const ACTION_HINTS = {
  resumen: 'Resume el expediente con contexto auditado.',
  observacion: 'Sugiere texto editable para abrir o completar una observacion.',
  beneficiarios: 'Busca posibles BF en evidencia disponible; nunca los aprueba automaticamente.',
  screening: 'Compara cliente/BF contra la lista local PEP/sanciones.',
  prioridad: 'Calcula urgencia con reglas, bloqueos y alertas.',
  buscar: 'Busca evidencia relacionada en documentos indexados.',
};

export default function AIAssistantPanel({ clienteId, tipoCliente, actions = ['resumen', 'observacion', 'screening', 'prioridad', 'buscar'], title = 'Asistente IA del expediente' }) {
  const [loading, setLoading] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const run = async (key) => {
    if (!clienteId) return;
    const payload = key === 'buscar' ? { query: query.trim() } : undefined;
    if (key === 'buscar' && !payload.query) {
      setError('Escribe que evidencia quieres buscar dentro del expediente.');
      return;
    }
    setLoading(key);
    setError('');
    try {
      const res = await api.post(ACTIONS[key].endpoint(clienteId), payload);
      setResult({ action: key, data: res.data });
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo ejecutar la accion IA');
    } finally {
      setLoading('');
    }
  };

  const visibleActions = actions.filter((key) => key !== 'beneficiarios' || tipoCliente === 'JURIDICA');

  return (
    <section className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-950">{title}</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              Lee evidencia, sugiere acciones y deja auditoria. No decide por si sola.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['JSON estricto', 'Temperatura baja', 'Revision humana', 'Auditable'].map((item) => (
                <span key={item} className="rounded-full border border-teal-200 bg-white/80 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-teal-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
        <span className="rounded-lg border border-teal-200 bg-white px-2.5 py-1 text-xs font-black uppercase tracking-widest text-teal-700">
          Asistido
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {visibleActions.map((key) => {
          const item = ACTIONS[key];
          const Icon = item.icon || FileSearch;
          if (key === 'buscar') return null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => run(key)}
              title={ACTION_HINTS[key]}
              disabled={!clienteId || !!loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon className="h-4 w-4" />
              {loading === key ? 'Calculando...' : item.label}
            </button>
          );
        })}
      </div>

      {visibleActions.includes('buscar') && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-3">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Buscar evidencia del expediente</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') run('buscar');
              }}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
              placeholder="Ej: documento ilegible, beneficiario, origen de fondos..."
            />
            <button
              type="button"
              onClick={() => run('buscar')}
              disabled={!clienteId || !!loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search className="h-4 w-4" />
              {loading === 'buscar' ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Usa embeddings para recuperar contexto; no participa en activaciones, rechazos ni riesgo.
          </p>
        </div>
      )}

      {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}

      {result && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
            Resultado: {ACTIONS[result.action]?.label}
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2">
            <ResultSummary data={result.data} />
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Evidencia y controles</p>
              <EvidenceList data={result.data} />
              <details className="mt-4">
                <summary className="cursor-pointer text-xs font-black uppercase tracking-widest text-teal-700">Ver payload tecnico</summary>
                <pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-teal-100">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ResultSummary({ data }) {
  const title = data?.titulo || data?.nivel || data?.accion_recomendada || 'Resultado generado';
  const details = [
    data?.mensaje,
    data?.nota_guardrail,
    data?.nota,
    data?.bloquea_automatizacion ? 'Bloquea automatizacion hasta revision humana.' : '',
  ].filter(Boolean);
  return (
    <div>
      <p className="text-base font-black text-slate-950">{title}</p>
      <div className="mt-3 space-y-2 text-sm font-semibold leading-6 text-slate-600">
        {details.length ? details.map((item, idx) => <p key={idx}>{item}</p>) : <p>Resultado disponible para revision.</p>}
      </div>
      {Array.isArray(data?.motivos) && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-600">{data.motivos.map((m, i) => <li key={i}>{m}</li>)}</ul>}
      {Array.isArray(data?.discrepancias) && <p className="mt-3 text-sm font-black text-amber-700">{data.discrepancias.length} discrepancia(s) detectada(s)</p>}
      {Array.isArray(data?.coincidencias) && <p className="mt-3 text-sm font-black text-amber-700">{data.coincidencias.length} coincidencia(s) encontradas</p>}
      {Array.isArray(data?.sugeridos) && <p className="mt-3 text-sm font-black text-teal-700">{data.sugeridos.length} BF sugerido(s)</p>}
      {Array.isArray(data?.results) && <p className="mt-3 text-sm font-black text-teal-700">{data.results.length} resultado(s) de contexto</p>}
    </div>
  );
}

function EvidenceList({ data }) {
  const entries = [];
  if (data?.provider || data?.model) entries.push(['Proveedor', [data.provider, data.model].filter(Boolean).join(' · ')]);
  if (typeof data?.confidence === 'number') entries.push(['Confianza', `${Math.round(data.confidence * 100)}%`]);
  if (typeof data?.score === 'number') entries.push(['Score', data.score]);
  if (data?.requires_human_review !== undefined) entries.push(['Revision humana', data.requires_human_review ? 'Si' : 'No']);
  if (data?.bloquea_automatizacion !== undefined) entries.push(['Bloquea automatizacion', data.bloquea_automatizacion ? 'Si' : 'No']);
  if (Array.isArray(data?.errors) && data.errors.length) entries.push(['Errores/fallback', data.errors.join(', ')]);

  const results = Array.isArray(data?.results) ? data.results : [];

  return (
    <div className="mt-3 space-y-3">
      {entries.length === 0 && results.length === 0 && (
        <p className="text-sm font-semibold leading-6 text-slate-500">No hay evidencia adicional para mostrar.</p>
      )}
      {entries.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-3 rounded-lg bg-white px-3 py-2">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
          <span className="text-right text-sm font-bold text-slate-700">{value}</span>
        </div>
      ))}
      {results.map((item, idx) => (
        <div key={`${item.source_id || idx}-${item.score}`} className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">{item.source_type || 'Fuente'}</span>
            <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-black text-teal-700">{Math.round((item.score || 0) * 100)}%</span>
          </div>
          <p className="mt-2 max-h-24 overflow-hidden text-sm font-semibold leading-6 text-slate-600">{item.text || 'Sin extracto disponible.'}</p>
        </div>
      ))}
    </div>
  );
}
