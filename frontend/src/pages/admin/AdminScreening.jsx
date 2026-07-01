import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axiosConfig';
import PaginationControls from '../../components/PaginationControls';
import { pageCountFor, paginate } from '../../utils/pagination';
import { Plus, Search, ShieldAlert } from 'lucide-react';

export default function AdminScreening() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ nombre: '', documento: '', tipo: 'PEP', pais: '' });
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const filtrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    return items.filter((item) => {
      if (tipoFiltro && item.tipo !== tipoFiltro) return false;
      if (estadoFiltro === 'ACTIVO' && !item.activo) return false;
      if (estadoFiltro === 'INACTIVO' && item.activo) return false;
      if (!query) return true;
      return [item.nombre, item.documento, item.tipo, item.pais].filter(Boolean).join(' ').toLowerCase().includes(query);
    });
  }, [busqueda, estadoFiltro, items, tipoFiltro]);

  useEffect(() => {
    const totalPages = pageCountFor(filtrados, pageSize);
    if (page > totalPages) setPage(totalPages);
  }, [filtrados, page, pageSize]);

  const paginados = paginate(filtrados, page, pageSize);

  return (
    <div className="animate-fade-in-up space-y-6">
      <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-2xl">
        <div className="relative p-7">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_20%,rgba(20,184,166,0.35),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(245,158,11,0.22),transparent_32%)]" />
          <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-teal-100">
          <ShieldAlert className="h-4 w-4" /> PEP / Sanciones
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-white">Listas locales</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Lista administrable para screening demo. Una coincidencia fuerte escala el expediente al Oficial.
        </p>
          </div>
        </div>
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_180px]">
          <div>
            <label className="label-upper inline-flex items-center gap-2"><Search className="h-3.5 w-3.5" />Busqueda</label>
            <input
              value={busqueda}
              onChange={(event) => { setBusqueda(event.target.value); setPage(1); }}
              placeholder="Nombre, documento, país o tipo..."
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-bold"
            />
          </div>
          <div>
            <label className="label-upper">Tipo</label>
            <select value={tipoFiltro} onChange={(event) => { setTipoFiltro(event.target.value); setPage(1); }} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-bold">
              <option value="">Todos</option>
              <option value="PEP">PEP</option>
              <option value="SANCION">Sanción</option>
              <option value="ALTO_RIESGO">Alto riesgo</option>
            </select>
          </div>
          <div>
            <label className="label-upper">Estado</label>
            <select value={estadoFiltro} onChange={(event) => { setEstadoFiltro(event.target.value); setPage(1); }} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-bold">
              <option value="">Todos</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-400">
            <tr><th className="px-5 py-3">Nombre</th><th className="px-5 py-3">Documento</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr>
          </thead>
          <tbody>
            {paginados.map(item => (
              <tr key={item.id_watchlist} className="border-t border-slate-100">
                <td className="px-5 py-4 font-black text-slate-950">{item.nombre}</td>
                <td className="px-5 py-4 text-slate-500">{item.documento || '-'}</td>
                <td className="px-5 py-4"><span className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">{item.tipo}</span></td>
                <td className="px-5 py-4">{item.activo ? 'Activo' : 'Inactivo'}</td>
                <td className="px-5 py-4 text-right"><button onClick={() => toggle(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black">{item.activo ? 'Desactivar' : 'Activar'}</button></td>
              </tr>
            ))}
            {!paginados.length && <tr><td colSpan={5} className="px-5 py-8 text-center font-semibold text-slate-500">Sin registros para estos filtros.</td></tr>}
          </tbody>
        </table>
        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={filtrados.length}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
        />
      </section>
    </div>
  );
}
