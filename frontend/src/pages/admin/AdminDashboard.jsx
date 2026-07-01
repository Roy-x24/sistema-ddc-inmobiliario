import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { Activity, Bot, ClipboardList, Gauge, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [auditoria, setAuditoria] = useState([]);

  useEffect(() => {
    api.get('/admin/ia/config').then(res => setConfig(res.data)).catch(() => setConfig(null));
    api.get('/auditoria-admin').then(res => setAuditoria(res.data || [])).catch(() => setAuditoria([]));
  }, []);

  const c = config?.config || {};
  const previewLimit = 5;

  return (
    <div className="animate-fade-in-up space-y-6">
      <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-2xl">
        <div className="relative p-7">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_20%,rgba(20,184,166,0.35),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(245,158,11,0.22),transparent_32%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-teal-100">
              <ShieldCheck className="h-4 w-4" /> Gobierno del sistema
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-white">Dashboard Admin</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Salud de configuracion, proveedores IA y cambios sensibles recientes.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={Bot} label="Modo IA" value={c.ai_mode || '-'} />
        <Metric icon={Activity} label="LLM" value={c.llm_provider || '-'} />
        <Metric icon={Gauge} label="OCR" value={c.ocr_provider || '-'} />
        <Metric icon={ClipboardList} label="Umbral" value={c.ai_min_confidence ?? '-'} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-teal-700" />
            <div>
              <h2 className="text-xl font-black text-slate-950">Actividad administrativa reciente</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Vista corta del dashboard; la auditoría completa está en su pantalla dedicada.</p>
            </div>
          </div>
          <button onClick={() => navigate('/admin/auditoria')} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12 }}>
            Ver auditoría admin
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-400">
              <tr><th className="px-4 py-3">Accion</th><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Fecha</th></tr>
            </thead>
            <tbody>
              {auditoria.slice(0, previewLimit).map((item) => (
                <tr key={item.id || item.id_auditoria || item.fecha} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-bold text-slate-900">{item.accion}</td>
                  <td className="px-4 py-3 text-slate-500">{item.usuario}</td>
                  <td className="px-4 py-3 text-slate-500">{item.fecha ? new Date(item.fecha).toLocaleString() : '-'}</td>
                </tr>
              ))}
              {!auditoria.length && <tr><td colSpan={3} className="px-4 py-8 text-center font-semibold text-slate-500">Sin actividad reciente.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Mostrando {Math.min(auditoria.length, previewLimit)} de {auditoria.length}
            {auditoria.length > previewLimit ? ` · ${auditoria.length - previewLimit} más en auditoría admin` : ''}
          </p>
          <button onClick={() => navigate('/admin/auditoria')} className="btn-primary" style={{ padding: '7px 12px', fontSize: 12 }}>
            Abrir vista completa
          </button>
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-teal-700" />
      <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
