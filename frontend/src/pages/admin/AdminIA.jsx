import { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import { Bot, CheckCircle2, PlugZap, Save, ShieldAlert, SlidersHorizontal, WifiOff } from 'lucide-react';

const PRESETS = {
  mock: {
    label: 'Demo segura',
    description: 'Sin API keys ni dependencias externas. Ideal para probar UX, estados y auditoria.',
    values: {
      ai_mode: 'mock',
      ocr_provider: 'mock',
      llm_provider: 'none',
      embeddings_provider: 'mock',
      auto_validate_low_risk_documents: false,
      screening_enabled: true,
    },
  },
  groq_ollama: {
    label: 'Groq + Ollama',
    description: 'Groq para resumenes rapidos, OCR local y embeddings por Ollama con fallback seguro.',
    values: {
      ai_mode: 'groq',
      ocr_provider: 'local',
      llm_provider: 'groq',
      embeddings_provider: 'local',
      ollama_base_url: 'http://host.docker.internal:11434',
      ollama_llm_model: 'gemma3:4b',
      ollama_embedding_model: 'nomic-embed-text',
      auto_validate_low_risk_documents: true,
      screening_enabled: true,
    },
  },
  local: {
    label: 'Local / Offline',
    description: 'OCR local, resumenes y embeddings por Ollama. Bueno para demo sin enviar datos a proveedores.',
    values: {
      ai_mode: 'local',
      ocr_provider: 'local',
      llm_provider: 'local',
      embeddings_provider: 'local',
      ollama_base_url: 'http://host.docker.internal:11434',
      ollama_llm_model: 'gemma3:4b',
      ollama_embedding_model: 'nomic-embed-text',
      auto_validate_low_risk_documents: false,
      screening_enabled: true,
    },
  },
  google: {
    label: 'Google completo',
    description: 'Ruta para OCR/vision, resumenes y embeddings con Google si hay presupuesto/API key.',
    values: {
      ai_mode: 'google',
      ocr_provider: 'google',
      llm_provider: 'google',
      embeddings_provider: 'google',
      google_model: 'gemini-1.5-flash',
      google_embedding_model: 'text-embedding-004',
      auto_validate_low_risk_documents: true,
      screening_enabled: true,
    },
  },
};

export default function AdminIA() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [test, setTest] = useState(null);

  const cargar = async () => {
    const res = await api.get('/admin/ia/config');
    setConfig(res.data);
    setForm(res.data.config || {});
  };

  useEffect(() => { cargar().catch(() => {}); }, []);

  const guardar = async () => {
    const payload = {
      ai_mode: form.ai_mode,
      ocr_provider: form.ocr_provider,
      llm_provider: form.llm_provider,
      embeddings_provider: form.embeddings_provider,
      ai_strict_mode: !!form.ai_strict_mode,
      ai_min_confidence: Number(form.ai_min_confidence),
      auto_validate_low_risk_documents: !!form.auto_validate_low_risk_documents,
      critical_difference_threshold: Number(form.critical_difference_threshold),
      screening_enabled: !!form.screening_enabled,
      groq_model: form.groq_model,
      groq_vision_model: form.groq_vision_model,
      google_model: form.google_model,
      google_embedding_model: form.google_embedding_model,
      ollama_llm_model: form.ollama_llm_model,
      ollama_embedding_model: form.ollama_embedding_model,
      ollama_base_url: form.ollama_base_url,
    };
    await api.patch('/admin/ia/config', payload);
    setMensaje('Configuracion IA guardada');
    setTimeout(() => setMensaje(''), 3500);
    cargar();
  };

  const probar = async (proveedor) => {
    const res = await api.post('/admin/ia/probar', { proveedor });
    setTest(res.data);
  };

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const applyPreset = (preset) => setForm(prev => ({ ...prev, ...PRESETS[preset].values }));
  const warnings = buildWarnings(form, config?.secrets || {});

  return (
    <div className="animate-fade-in-up space-y-6">
      <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-2xl">
        <div className="relative p-7">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_20%,rgba(20,184,166,0.35),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(245,158,11,0.22),transparent_32%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-teal-100">
              <Bot className="h-4 w-4" /> Proveedores y reglas IA
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-white">Configuracion IA</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Controla proveedores, modelos y umbrales sin tocar codigo. Las API keys se mantienen en variables de entorno.
            </p>
          </div>
        </div>
      </section>

      {mensaje && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"><CheckCircle2 className="mr-2 inline h-4 w-4" />{mensaje}</div>}

      <section className="grid gap-3 md:grid-cols-4">
        {Object.entries(PRESETS).map(([key, preset]) => (
          <button
            key={key}
            type="button"
            onClick={() => applyPreset(key)}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50 hover:shadow-md"
          >
            <div className="flex items-center gap-2 text-sm font-black text-slate-950">
              <SlidersHorizontal className="h-4 w-4 text-teal-700" />
              {preset.label}
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{preset.description}</p>
          </button>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <Select label="Modo IA" value={form.ai_mode || 'mock'} onChange={v => update('ai_mode', v)} options={['mock', 'local', 'groq', 'google']} />
          <Select label="OCR" value={form.ocr_provider || 'mock'} onChange={v => update('ocr_provider', v)} options={['mock', 'local', 'groq_vision', 'google']} />
          <Select label="LLM" value={form.llm_provider || 'none'} onChange={v => update('llm_provider', v)} options={['none', 'local', 'groq', 'google']} />
          <Select label="Embeddings" value={form.embeddings_provider || 'mock'} onChange={v => update('embeddings_provider', v)} options={['mock', 'local', 'google']} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Input label="Confianza minima" type="number" step="0.01" value={form.ai_min_confidence ?? 0.82} onChange={v => update('ai_min_confidence', v)} />
          <Input label="Umbral diferencia critica" type="number" step="0.01" value={form.critical_difference_threshold ?? 0.82} onChange={v => update('critical_difference_threshold', v)} />
          <Input label="Ollama URL" value={form.ollama_base_url || ''} onChange={v => update('ollama_base_url', v)} />
          <Input label="Modelo Groq" value={form.groq_model || ''} onChange={v => update('groq_model', v)} />
          <Input label="Groq vision" value={form.groq_vision_model || ''} onChange={v => update('groq_vision_model', v)} />
          <Input label="Modelo Google" value={form.google_model || ''} onChange={v => update('google_model', v)} />
          <Input label="Google embeddings" value={form.google_embedding_model || ''} onChange={v => update('google_embedding_model', v)} />
          <Input label="Ollama LLM" value={form.ollama_llm_model || ''} onChange={v => update('ollama_llm_model', v)} />
          <Input label="Ollama embeddings" value={form.ollama_embedding_model || ''} onChange={v => update('ollama_embedding_model', v)} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Toggle label="Modo estricto: JSON/schema obligatorio" checked={!!form.ai_strict_mode} onChange={v => update('ai_strict_mode', v)} />
          <Toggle label="Auto-validar documentos simples de bajo riesgo" checked={!!form.auto_validate_low_risk_documents} onChange={v => update('auto_validate_low_risk_documents', v)} />
          <Toggle label="Screening local PEP/sanciones activo" checked={!!form.screening_enabled} onChange={v => update('screening_enabled', v)} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={guardar} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700"><Save className="h-4 w-4" />Guardar configuracion</button>
          <button onClick={() => probar('groq')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50"><PlugZap className="h-4 w-4" />Probar Groq</button>
          <button onClick={() => probar('ollama')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50"><PlugZap className="h-4 w-4" />Probar Ollama</button>
          <button onClick={() => probar('google')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50"><PlugZap className="h-4 w-4" />Probar Google</button>
        </div>
      </section>

      {warnings.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
            <WifiOff className="h-4 w-4" />
            Advertencias de configuracion
          </div>
          <ul className="mt-3 space-y-2 text-sm font-bold leading-6">
            {warnings.map((warning) => <li key={warning}>- {warning}</li>)}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          Secretos: Groq {config?.secrets?.groq_api_key_set ? 'configurado' : 'sin API key'} · Google {config?.secrets?.google_api_key_set ? 'configurado' : 'sin API key'}
        </div>
        {test && <pre className="mt-4 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-teal-100">{JSON.stringify(test, null, 2)}</pre>}
      </section>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return <label className="block"><span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span><select value={value} onChange={e => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-bold text-slate-900">{options.map(o => <option key={o} value={o}>{o}</option>)}</select></label>;
}

function Input({ label, value, onChange, ...props }) {
  return <label className="block"><span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span><input {...props} value={value} onChange={e => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-bold text-slate-900" /></label>;
}

function Toggle({ label, checked, onChange }) {
  return <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800"><span>{label}</span><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-5 w-5" /></label>;
}

function buildWarnings(form, secrets) {
  const warnings = [];
  if (form.llm_provider === 'groq' && !secrets.groq_api_key_set) {
    warnings.push('LLM está en Groq pero no hay GROQ_API_KEY; el backend intentará Ollama y luego fallback determinístico.');
  }
  if ((form.ai_mode === 'google' || form.llm_provider === 'google' || form.ocr_provider === 'google' || form.embeddings_provider === 'google') && !secrets.google_api_key_set) {
    warnings.push('Google está seleccionado pero no hay GOOGLE_API_KEY; no funcionará hasta configurar la llave.');
  }
  if ((form.llm_provider === 'local' || form.embeddings_provider === 'local') && !form.ollama_base_url) {
    warnings.push('Ollama local necesita OLLAMA_BASE_URL o una URL configurada.');
  }
  if (Number(form.ai_min_confidence) < 0.7) {
    warnings.push('La confianza mínima está baja; para cumplimiento conviene mantenerla cerca de 0.82 o más.');
  }
  if (form.auto_validate_low_risk_documents && Number(form.ai_min_confidence) < 0.8) {
    warnings.push('Auto-validación con confianza baja puede generar aprobaciones débiles; sube el umbral o desactiva auto-validación.');
  }
  return warnings;
}
