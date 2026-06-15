import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import {
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  Layers,
  Gauge,
  Activity,
} from 'lucide-react';

export default function MatrizRiesgo() {
  const [matriz, setMatriz] = useState(null);
  const [versiones, setVersiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const fetchMatriz = async () => {
    try {
      const res = await api.get('/admin/matriz');
      setMatriz(res.data);
    } catch {
      setError('Error al cargar matriz activa');
    }
  };

  const fetchVersiones = async () => {
    try {
      const res = await api.get('/admin/matriz/versiones');
      setVersiones(res.data);
    } catch {
      setError('Error al cargar versiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatriz();
    fetchVersiones();
  }, []);

  const showMensaje = (text) => { setMensaje(text); setTimeout(() => setMensaje(''), 4000); };
  const showError = (text) => { setError(text); setTimeout(() => setError(''), 6000); };

  const actualizarFactor = async (factorId, peso) => {
    try {
      await api.patch(`/admin/factores/${factorId}`, { peso: parseInt(peso) });
      showMensaje('Factor actualizado');
      fetchMatriz();
    } catch {
      showError('Error al actualizar factor');
    }
  };

  const publicarVersion = async (versionId) => {
    if (!window.confirm('Publicar esta version? Se marcaran todos los expedientes para reevaluacion.')) return;
    try {
      await api.patch(`/admin/matriz/${versionId}/publicar`);
      showMensaje('Version publicada correctamente');
      fetchMatriz();
      fetchVersiones();
    } catch {
      showError('Error al publicar version');
    }
  };

  const crearVersion = async () => {
    const descripcion = window.prompt('Descripcion de la nueva version');
    if (descripcion === null) return;
    try {
      await api.post('/admin/matriz', { descripcion });
      showMensaje('Version creada correctamente');
      fetchVersiones();
    } catch {
      showError('Error al crear version');
    }
  };

  const totalFactores = matriz?.factores?.length || 0;
  const factoresActivos = matriz?.factores?.filter((f) => f.activo).length || 0;
  const pesoTotal = matriz?.factores?.reduce((acc, f) => acc + Number(f.peso || 0), 0) || 0;

  return (
    <div className="animate-fade-in-up space-y-6">
      <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-2xl">
        <div className="relative p-7">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_20%,rgba(20,184,166,0.38),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(245,158,11,0.24),transparent_32%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_420px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-teal-100">
                <Gauge className="h-3.5 w-3.5" />
                Configuracion de riesgo
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-white">Matriz de riesgo</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Ajusta factores, pesos y versiones publicadas para mantener la evaluacion operativa alineada.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Factores</p>
                <p className="mt-3 text-3xl font-black">{loading ? '-' : totalFactores}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Activos</p>
                <p className="mt-3 text-3xl font-black">{loading ? '-' : factoresActivos}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Peso</p>
                <p className="mt-3 text-3xl font-black">{loading ? '-' : pesoTotal}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {mensaje && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {mensaje}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {matriz && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-teal-700">Version activa</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Version {matriz.version.version_numero}</h2>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Activa
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Factor</th>
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Descripcion</th>
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Tipo</th>
                  <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Peso</th>
                  <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-400">Estado</th>
                </tr>
              </thead>
              <tbody>
                {matriz.factores.map((f) => (
                  <tr key={f.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                    <td className="px-5 py-4 font-black text-slate-950">{f.nombre_factor}</td>
                    <td className="max-w-md px-5 py-4 text-sm font-semibold text-slate-500">{f.descripcion}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">{f.tipo}</span>
                    </td>
                    <td className="px-5 py-4">
                      <input
                        type="number"
                        defaultValue={f.peso}
                        onBlur={(e) => actualizarFactor(f.id, e.target.value)}
                        className="w-20 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-950 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                      />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${f.activo ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                        {f.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
                {matriz.factores.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-sm font-semibold text-slate-500">Sin factores configurados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-teal-700">Historial</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Versiones publicadas</h2>
          </div>
          <Activity className="ml-auto h-5 w-5 text-slate-400" />
          <button onClick={crearVersion} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-teal-700">
            Crear nueva version
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Version</th>
                <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Descripcion</th>
                <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Publicada por</th>
                <th className="px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-400">Estado</th>
                <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {versiones.map((v) => (
                <tr key={v.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                  <td className="px-5 py-4 font-black text-slate-950">Version {v.version_numero}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-500">{v.descripcion || 'Sin descripcion'}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-500">{v.publicada_por || '-'}</td>
                  <td className="px-5 py-4">
                    {v.esta_activa ? (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> Activa
                      </span>
                    ) : (
                      <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                        Inactiva
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {!v.esta_activa && (
                      <button onClick={() => publicarVersion(v.id)} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-teal-700">
                        <RotateCcw className="h-3.5 w-3.5" /> Publicar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {versiones.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm font-semibold text-slate-500">Sin versiones registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
