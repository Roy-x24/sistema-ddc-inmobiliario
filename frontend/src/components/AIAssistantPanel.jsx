import { useState } from 'react';
import api from '../api/axiosConfig';
import { Bot, CheckSquare, FileSearch, ListChecks, MessageSquarePlus, Search, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

const ACTIONS = {
  resumen: { label: 'Resumen operativo', icon: Sparkles, endpoint: (id) => `/ai/clientes/${id}/resumen-operativo` },
  observacion: { label: 'Sugerir observacion', icon: MessageSquarePlus, endpoint: (id) => `/ai/clientes/${id}/observacion-sugerida` },
  beneficiarios: { label: 'Detectar BF sugeridos', icon: UserCheck, endpoint: (id) => `/ai/clientes/${id}/beneficiarios-sugeridos` },
  screening: { label: 'PEP/sanciones', icon: ShieldAlert, endpoint: (id) => `/ai/clientes/${id}/screening` },
  prioridad: { label: 'Calcular prioridad', icon: ListChecks, endpoint: (id) => `/ai/clientes/${id}/prioridad` },
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

const CONTEXTS = {
  cumplimiento: {
    title: 'IA para cumplimiento',
    description: 'Prioriza la cola, resume bloqueos y recupera evidencia para que el Oficial revise excepciones.',
    primaryByQueue: {
      observados: 'observacion',
      alto_riesgo: 'screening',
      pendiente_bf: 'beneficiarios',
      revision_oficial: 'resumen',
      pendientes: 'prioridad',
      listos_auto: 'resumen',
    },
    primary: 'resumen',
    secondary: ['prioridad', 'screening', 'buscar', 'observacion', 'beneficiarios'],
    searchLabel: 'Buscar evidencia de cumplimiento',
    searchPlaceholder: 'Ej: observaciones abiertas, origen de fondos, documento rechazado...',
  },
  documentos: {
    title: 'IA documental',
    description: 'Lee documentos, compara datos y prepara observaciones editables cuando hay discrepancias.',
    primary: 'resumen',
    secondary: ['observacion', 'buscar', 'beneficiarios'],
    hidden: ['prioridad', 'screening'],
    searchLabel: 'Buscar contexto documental',
    searchPlaceholder: 'Ej: documento ilegible, identidad distinta, comprobante vencido...',
  },
  beneficiarios: {
    title: 'IA para beneficiarios finales',
    description: 'Sugiere BF desde evidencia, explica relevancia y permite revisar alertas sin aprobar automaticamente.',
    primary: 'beneficiarios',
    secondary: ['screening', 'resumen', 'buscar'],
    hidden: ['prioridad', 'observacion'],
    searchLabel: 'Buscar evidencia societaria',
    searchPlaceholder: 'Ej: porcentaje de participacion, representante, accionista...',
  },
  observaciones: {
    title: 'IA para observaciones',
    description: 'Resume la conversacion, sugiere respuestas editables y busca evidencia relacionada.',
    primary: 'observacion',
    secondary: ['resumen', 'buscar'],
    hidden: ['screening', 'beneficiarios', 'prioridad'],
    searchLabel: 'Buscar evidencia relacionada',
    searchPlaceholder: 'Ej: respuesta del cliente, documento corregido, motivo de observacion...',
  },
  riesgo: {
    title: 'IA para riesgo',
    description: 'Explica factores aplicados y busca evidencia que soporte la clasificacion.',
    primary: 'resumen',
    secondary: ['prioridad', 'screening', 'buscar'],
    hidden: ['observacion', 'beneficiarios'],
    searchLabel: 'Buscar evidencia de riesgo',
    searchPlaceholder: 'Ej: PEP, monto alto, pais, actividad economica...',
  },
  activacion: {
    title: 'IA previa a decision',
    description: 'Resume bloqueos, prepara revision de alto riesgo y explica por que un expediente puede o no activarse.',
    primaryByState: {
      OBSERVADO: 'observacion',
      PENDIENTE_BF: 'beneficiarios',
      EN_REVISION: 'resumen',
      PENDIENTE: 'prioridad',
    },
    primaryByRisk: { ALTO: 'screening' },
    primary: 'resumen',
    secondary: ['prioridad', 'screening', 'buscar', 'observacion', 'beneficiarios'],
    searchLabel: 'Buscar contexto para decision',
    searchPlaceholder: 'Ej: bloqueo de activacion, BF pendiente, observacion abierta...',
  },
  post_activacion: {
    title: 'IA post-activacion',
    description: 'Resume historial y recupera evidencia para bloquear, desbloquear o revertir con motivo humano.',
    primary: 'resumen',
    secondary: ['buscar', 'observacion'],
    hidden: ['beneficiarios', 'prioridad'],
    searchLabel: 'Buscar eventos relevantes',
    searchPlaceholder: 'Ej: motivo de bloqueo, decision anterior, documento posterior...',
  },
  expediente: {
    title: 'IA del expediente',
    description: 'Resume el expediente y recupera contexto sin ejecutar decisiones operativas.',
    primary: 'resumen',
    secondary: ['buscar', 'screening', 'observacion', 'beneficiarios'],
    searchLabel: 'Buscar contexto del expediente',
    searchPlaceholder: 'Ej: cadena de decision, documento observado, BF...',
  },
};

const ACTION_COPY = {
  cumplimiento: {
    resumen: 'Resumen operativo',
    prioridad: 'Priorizar cola',
    observacion: 'Preparar observacion',
    beneficiarios: 'Detectar BF si aplica',
  },
  documentos: {
    resumen: 'Resumen documental',
    observacion: 'Crear observacion sugerida',
    buscar: 'Buscar contexto documental',
    beneficiarios: 'Detectar BF desde documento',
  },
  beneficiarios: {
    beneficiarios: 'Detectar BF sugeridos',
    screening: 'Screening de BF/cliente',
    resumen: 'Explicar relevancia',
  },
  observaciones: {
    observacion: 'Sugerir respuesta/cierre',
    resumen: 'Resumir conversacion',
  },
  riesgo: {
    resumen: 'Explicar riesgo',
    prioridad: 'Ver urgencia',
  },
  activacion: {
    resumen: 'Resumen previo',
    prioridad: 'Checklist de bloqueos',
    screening: 'Preparar alto riesgo',
    observacion: 'Resolver observaciones',
    beneficiarios: 'Validar BF',
  },
  post_activacion: {
    resumen: 'Resumen historico',
    observacion: 'Sugerir motivo',
    buscar: 'Buscar eventos',
  },
};

function normalize(value) {
  return String(value || '').toLowerCase();
}

function buildContextConfig(context, metadata = {}) {
  const config = CONTEXTS[context] || CONTEXTS.expediente;
  const queueKey = normalize(metadata.cola || metadata.queue);
  const stateKey = String(metadata.estado || metadata.estado_cliente || '').toUpperCase();
  const riskKey = String(metadata.riesgo || metadata.nivel_riesgo || '').toUpperCase();
  const primary =
    config.primaryByQueue?.[queueKey]
    || config.primaryByState?.[stateKey]
    || config.primaryByRisk?.[riskKey]
    || config.primary;
  return { ...config, primary };
}

function getActionLabel(context, key) {
  return ACTION_COPY[context]?.[key] || ACTIONS[key]?.label || key;
}

function buildActionPlan({ context, config, explicitActions, tipoCliente }) {
  const configured = explicitActions || [config.primary, ...(config.secondary || [])];
  const hidden = new Set(config.hidden || []);
  const ordered = [config.primary, ...configured].filter(Boolean);
  return [...new Set(ordered)]
    .filter((key) => ACTIONS[key])
    .filter((key) => !hidden.has(key))
    .filter((key) => key !== 'beneficiarios' || tipoCliente === 'JURIDICA' || context === 'documentos');
}

export default function AIAssistantPanel({
  clienteId,
  tipoCliente,
  actions,
  title,
  context = 'expediente',
  metadata = {},
  description,
}) {
  const [loading, setLoading] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const config = buildContextConfig(context, metadata);
  const visibleActions = buildActionPlan({ context, config, explicitActions: actions, tipoCliente });
  const primaryAction = visibleActions.includes(config.primary) ? config.primary : visibleActions[0];

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

  return (
    <section className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-950">{title || config.title}</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              {description || config.description}
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

      <ContextNudge context={context} metadata={metadata} tipoCliente={tipoCliente} />

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,0.85fr)_minmax(0,1fr)]">
        {primaryAction && primaryAction !== 'buscar' && (
          <ActionButton
            actionKey={primaryAction}
            context={context}
            loading={loading}
            disabled={!clienteId || !!loading}
            onClick={() => run(primaryAction)}
            primary
          />
        )}
        <div className="flex flex-wrap gap-2">
        {visibleActions.map((key) => {
          if (key === primaryAction) return null;
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
              {loading === key ? 'Calculando...' : getActionLabel(context, key)}
            </button>
          );
        })}
        </div>
      </div>

      {visibleActions.includes('buscar') && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-3">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">{config.searchLabel || 'Buscar evidencia del expediente'}</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') run('buscar');
              }}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
              placeholder={config.searchPlaceholder || 'Ej: documento ilegible, beneficiario, origen de fondos...'}
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
              <ResultCtas action={result.action} context={context} data={result.data} />
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

function ActionButton({ actionKey, context, loading, disabled, onClick, primary = false }) {
  const item = ACTIONS[actionKey];
  const Icon = item?.icon || FileSearch;
  if (!item) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      title={ACTION_HINTS[actionKey]}
      disabled={disabled}
      className={`inline-flex min-h-[54px] items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
        primary
          ? 'border border-teal-300 bg-teal-700 text-white hover:bg-teal-800'
          : 'border border-slate-200 bg-white text-slate-800 hover:border-teal-300 hover:bg-teal-50'
      }`}
    >
      <Icon className="h-4 w-4" />
      {loading === actionKey ? 'Calculando...' : getActionLabel(context, actionKey)}
    </button>
  );
}

function ContextNudge({ context, metadata = {}, tipoCliente }) {
  const estado = String(metadata.estado || metadata.estado_cliente || '').toUpperCase();
  const riesgo = String(metadata.riesgo || metadata.nivel_riesgo || '').toUpperCase();
  const cola = normalize(metadata.cola || metadata.queue);
  const notes = [];

  if (context === 'cumplimiento') {
    if (cola === 'observados') notes.push('Cola observada: prioriza observaciones sugeridas y evidencia fuente.');
    if (cola === 'alto_riesgo' || riesgo === 'ALTO') notes.push('Alto riesgo: usa resumen y screening como soporte, no como decision final.');
    if (cola === 'pendiente_bf' || estado === 'PENDIENTE_BF') notes.push('Pendiente BF: la IA puede sugerir beneficiarios, pero el Oficial valida.');
  }
  if (context === 'activacion') {
    if (estado === 'OBSERVADO') notes.push('Expediente observado: la siguiente accion humana es resolver observaciones.');
    if (estado === 'PENDIENTE_BF') notes.push('Falta BF relevante: la activacion juridica debe quedar bloqueada.');
    if (riesgo === 'ALTO') notes.push('Alto riesgo: preparar revision y dejar motivo auditable.');
  }
  if (context === 'documentos') notes.push('La IA documental compara y sugiere; aprobar/rechazar sigue pasando por modal humano.');
  if (context === 'beneficiarios') notes.push('Los BF sugeridos deben convertirse en registros editables; nunca se aprueban automaticamente.');
  if (context === 'observaciones') notes.push('Las sugerencias de respuesta o cierre deben editarse antes de enviarse.');
  if (context === 'post_activacion') notes.push('Bloqueos y reversiones siempre requieren motivo humano.');
  if (context === 'riesgo' && tipoCliente === 'JURIDICA') notes.push('Si el riesgo depende de BF, revisa evidencia societaria antes de decidir.');

  if (!notes.length) return null;
  return (
    <div className="mt-4 rounded-2xl border border-teal-200 bg-white/75 p-3">
      <div className="flex items-start gap-2">
        <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
        <div className="space-y-1">
          {notes.map((note) => (
            <p key={note} className="text-xs font-bold leading-5 text-teal-900">{note}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultCtas({ action, context, data }) {
  const ctas = [];
  if (action === 'observacion') {
    ctas.push({
      label: context === 'observaciones' ? 'Usar como borrador editable' : 'Crear observacion desde sugerencia',
      enabled: false,
      note: 'Pendiente de endpoint/flujo dedicado; no se simula para no saltar confirmacion humana.',
    });
  }
  if (action === 'beneficiarios') {
    ctas.push({
      label: 'Abrir formulario BF con estos datos',
      enabled: false,
      note: 'Pendiente de formulario asistido; los BF sugeridos no se aprueban automaticamente.',
    });
  }
  if (action === 'screening' && Array.isArray(data?.coincidencias) && data.coincidencias.length) {
    ctas.push({
      label: 'Revisar coincidencias PEP/sanciones',
      enabled: false,
      note: 'Debe escalarse al Oficial; la lista local es apoyo demo, no decision final.',
    });
  }
  if (action === 'buscar') {
    ctas.push({
      label: 'Ver eventos fuente',
      enabled: false,
      note: 'La busqueda recupera contexto; el enlace profundo a auditoria queda como mejora pendiente.',
    });
  }

  if (!ctas.length) return null;

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
      <p className="text-[11px] font-black uppercase tracking-widest text-amber-700">Siguiente paso asistido</p>
      <div className="mt-2 space-y-2">
        {ctas.map((cta) => (
          <div key={cta.label} className="rounded-lg bg-white/75 p-3">
            <button
              type="button"
              disabled={!cta.enabled}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-200 px-3 py-2 text-xs font-black text-amber-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {cta.label}
            </button>
            <p className="mt-2 text-xs font-semibold leading-5 text-amber-800">{cta.note}</p>
          </div>
        ))}
      </div>
    </div>
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
