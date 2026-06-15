import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import EstadoBadge from '../components/EstadoBadge';
import PaginationControls from '../components/PaginationControls';
import { Plus, Search, Building2, User, Eye, SlidersHorizontal, Users } from 'lucide-react';
import { pageCountFor, paginate } from '../utils/pagination';

export default function ListadoClientes() {
  const [clientes, setClientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  const cargar = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (busqueda) params.append('busqueda', busqueda);
      if (tipo) params.append('tipo', tipo);
      if (estado) params.append('estado', estado);
      params.append('skip', String((page - 1) * pageSize));
      params.append('limit', String(pageSize));
      const res = await api.get(`/clientes/?${params.toString()}`);
      setClientes(res.data || []);
      const totalHeader = res.headers['x-total-count'];
      setTotal(totalHeader ? parseInt(totalHeader, 10) : 0);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setPage(1);
    cargar();
  }, [busqueda, tipo, estado]);

  useEffect(() => {
    const totalPages = pageCountFor(clientes, pageSize);
    if (page > totalPages) setPage(totalPages);
  }, [clientes, page, pageSize]);

  const clientesPaginados = paginate(clientes, page, pageSize);

  const riesgoClass = (nivel) => {
    if (nivel === 'ALTO') return 'border-rose-200 bg-rose-50 text-rose-700';
    if (nivel === 'ESTANDAR') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-teal-700">
            <Users className="h-4 w-4" />
            Expedientes
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Clientes</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">Gestion y seguimiento de expedientes registrados.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/clientes/nuevo')} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-teal-700">
            <Plus className="h-4 w-4" />
            Persona natural
          </button>
          <button onClick={() => navigate('/clientes/nuevo-juridica')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-700">
            <Building2 className="h-4 w-4" />
            Persona juridica
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_190px_190px]">
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Search className="h-3.5 w-3.5" />
              Busqueda
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Buscar por nombre o identificacion..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-10 text-sm font-semibold text-slate-950 transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Tipo
            </label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10">
              <option value="">Todos</option>
              <option value="NATURAL">Persona natural</option>
              <option value="JURIDICA">Persona juridica</option>
            </select>
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Estado
            </label>
            <select value={estado} onChange={e => setEstado(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10">
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_REVISION">En revision</option>
              <option value="ACTIVO">Activo</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Cliente</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Identificacion</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Tipo</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Estado</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Riesgo</th>
              <th className="px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Registrado por</th>
              <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-400">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && (
              <tr><td colSpan={7} className="px-5 py-14 text-center text-sm font-semibold text-slate-500">Cargando expedientes...</td></tr>
            )}
            {!cargando && clientes.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-14 text-center text-sm font-semibold text-slate-500">Sin resultados.</td></tr>
            )}
            {clientesPaginados.map(c => (
              <tr key={c.id_cliente} className="group cursor-pointer transition hover:bg-teal-50/40" onClick={() => navigate(`/expediente/${c.id_cliente}`)}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-teal-100 group-hover:text-teal-700">
                      {c.tipo_cliente === 'NATURAL' ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-black text-slate-950">{c.nombre || '-'}</div>
                      <div className="mt-0.5 font-mono text-xs text-slate-400">{c.id_cliente?.slice(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-500">{c.identificacion || '-'}</td>
                <td className="px-5 py-4">
                  <span className="inline-flex rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                    {c.tipo_cliente === 'NATURAL' ? 'Natural' : 'Juridica'}
                  </span>
                </td>
                <td className="px-5 py-4"><EstadoBadge estado={c.estado} /></td>
                <td className="px-5 py-4">
                  {c.nivel_riesgo ? (
                    <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${riesgoClass(c.nivel_riesgo)}`}>
                      {c.nivel_riesgo}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-500">{c.registrado_por}</td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/expediente/${c.id_cliente}`); }}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:border-teal-200 hover:text-teal-700"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={clientes.length}
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
