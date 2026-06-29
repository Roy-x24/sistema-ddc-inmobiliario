import { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import { Plus, ShieldAlert } from 'lucide-react';

export default function AdminScreening() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ nombre: '', documento: '', tipo: 'PEP', pais: '' });

  const cargar = () => api.get('/admin/screening/lista').then(res => setItems(res.data || [])).catch(() => setItems([]));
  useEffect(() => { cargar(); }, []);

  const crear = async () => {
    if (!form.nombre.trim()) return;
    await api.post('/admin/screening/lista', form);
    setForm({ nombre: '', documento: '', tipo: 'PEP', pais: '' });
    cargar();
  };

  const toggle = async (item) => {
    await api.patch(`/admin/screening/lista/${item.id_watchlist}`, { activo: !item.activo });
    cargar();
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <section className="rounded-2xl bg-slate-950 p-7 text-white shadow-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-teal-100">
          <ShieldAlert className="h-4 w-4" /> PEP / Sanciones
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight">Listas locales</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Lista administrable para screening demo. Una coincidencia fuerte escala el expediente al Oficial.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_160px_1fr_auto]">
          <input placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-3 font-bold" />
          <input placeholder="Documento" value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-3 font-bold" />
          <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-3 font-bold">
            <option>PEP</option><option>SANCION</option><option>ALTO_RIESGO</option>
          </select>
          <input placeholder="Pais" value={form.pais} onChange={e => setForm({ ...form, pais: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-3 font-bold" />
          <button onClick={crear} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"><Plus className="h-4 w-4" />Agregar</button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-400">
            <tr><th className="px-5 py-3">Nombre</th><th className="px-5 py-3">Documento</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id_watchlist} className="border-t border-slate-100">
                <td className="px-5 py-4 font-black text-slate-950">{item.nombre}</td>
                <td className="px-5 py-4 text-slate-500">{item.documento || '-'}</td>
                <td className="px-5 py-4"><span className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">{item.tipo}</span></td>
                <td className="px-5 py-4">{item.activo ? 'Activo' : 'Inactivo'}</td>
                <td className="px-5 py-4 text-right"><button onClick={() => toggle(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black">{item.activo ? 'Desactivar' : 'Activar'}</button></td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={5} className="px-5 py-8 text-center font-semibold text-slate-500">Sin registros en la lista.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
