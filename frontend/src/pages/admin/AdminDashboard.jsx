import { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import { Activity, Bot, ClipboardList, Gauge, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  const [config, setConfig] = useState(null);
  const [auditoria, setAuditoria] = useState([]);

  useEffect(() => {
    api.get('/admin/ia/config').then(res => setConfig(res.data)).catch(() => setConfig(null));
    api.get('/auditoria-admin').then(res => setAuditoria(res.data || [])).catch(() => setAuditoria([]));
  }, []);

  const c = config?.config || {};

  return (
    <div className="animate-fade-in-up space-y-6">
      <section className="rounded-2xl bg-slate-950 p-7 text-white shadow-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-teal-100">
          <ShieldCheck className="h-4 w-4" /> Gobierno del sistema
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight">Dashboard Admin</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Salud de configuracion, proveedores IA y cambios sensibles recientes.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={Bot} label="Modo IA" value={c.ai_mode || '-'} />
        <Metric icon={Activity} label="LLM" value={c.llm_provider || '-'} />
        <Metric icon={Gauge} label="OCR" value={c.ocr_provider || '-'} />
        <Metric icon={ClipboardList} label="Umbral" value={c.ai_min_confidence ?? '-'} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <ClipboardList className="h-5 w-5 text-teal-700" />
          <h2 className="text-xl font-black text-slate-950">Actividad administrativa reciente</h2>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-400">
              <tr><th className="px-4 py-3">Accion</th><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Fecha</th></tr>
            </thead>
            <tbody>
              {auditoria.slice(0, 8).map((item) => (
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
