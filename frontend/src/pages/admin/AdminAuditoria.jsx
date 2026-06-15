import { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import { Activity, Download, ShieldCheck } from 'lucide-react';

export default function AdminAuditoria() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auditoria-admin');
      setRegistros(res.data || []);
    } catch {
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const exportarCsv = async () => {
    const res = await api.get('/auditoria-admin/exportar-csv', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auditoria_admin.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-2xl">
        <div className="relative p-7">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_20%,rgba(20,184,166,0.38),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(245,158,11,0.24),transparent_32%)]" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-teal-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Auditoria administrativa
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-white">Eventos del sistema</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Trazabilidad de acciones sensibles sobre usuarios, matriz, sesiones y exportaciones.
              </p>
            </div>
            <button onClick={exportarCsv} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5">
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-teal-700">Historial</p>
            <h2 className="text-xl font-black text-slate-950">Registros recientes</h2>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Fecha</th>
                <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Usuario</th>
                <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Accion</th>
                <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="px-5 py-8 text-center text-sm font-semibold text-slate-500">Cargando auditoria...</td></tr>}
              {!loading && registros.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-sm font-semibold text-slate-500">Sin registros.</td></tr>}
              {registros.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold text-slate-500">{new Date(r.fecha).toLocaleString()}</td>
                  <td className="px-5 py-4 font-bold text-slate-950">{r.usuario}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-600">{r.accion?.replace(/_/g, ' ')}</td>
                  <td className="max-w-lg px-5 py-4 font-mono text-xs text-slate-500">{r.detalle ? JSON.stringify(r.detalle) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
