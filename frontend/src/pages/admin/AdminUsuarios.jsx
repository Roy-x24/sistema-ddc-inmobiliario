import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import DecisionModal from '../../components/DecisionModal';
import {
  Users,
  Plus,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  User,
  Shield,
  Mail,
  Lock,
  Unlock,
  KeyRound,
  UserCog,
} from 'lucide-react';

const ROLES = [
  { value: 'empleado', label: 'Empleado' },
  { value: 'oficial_cumplimiento', label: 'Oficial de Cumplimiento' },
  { value: 'auditor', label: 'Auditor' },
  { value: 'admin', label: 'Administrador' },
];

const roleClasses = {
  admin: 'border-rose-200 bg-rose-50 text-rose-700',
  oficial_cumplimiento: 'border-sky-200 bg-sky-50 text-sky-700',
  auditor: 'border-violet-200 bg-violet-50 text-violet-700',
  empleado: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export default function AdminUsuarios() {
  const { usuario: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', correo: '', password: '', rol: 'empleado' });
  const [editandoId, setEditandoId] = useState('');
  const [editForm, setEditForm] = useState({ nombre: '', correo: '', password: '', activo: true });
  const [decision, setDecision] = useState(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/usuarios');
      setUsuarios(res.data || []);
    } catch {
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const showMensaje = (text) => { setMensaje(text); setTimeout(() => setMensaje(''), 4000); };
  const showError = (text) => { setError(text); setTimeout(() => setError(''), 6000); };

  const crear = async () => {
    try {
      await api.post('/auth/usuarios', form);
      setForm({ nombre: '', correo: '', password: '', rol: 'empleado' });
      setMostrarForm(false);
      showMensaje('Usuario creado correctamente');
      fetchUsuarios();
    } catch (err) {
      showError(err.response?.data?.detail || 'Error al crear usuario');
    }
  };

  const cambiarRol = async (id, nuevoRol) => {
    try {
      await api.patch(`/auth/usuarios/${id}/rol`, { rol: nuevoRol });
      showMensaje('Rol actualizado');
      fetchUsuarios();
    } catch (err) {
      showError(err.response?.data?.detail || 'Error al cambiar rol');
    }
  };

  const iniciarEdicion = (usuario) => {
    setEditandoId(usuario.id);
    setEditForm({ nombre: usuario.nombre, correo: usuario.correo, password: '', activo: usuario.activo });
  };

  const guardarEdicion = async (id) => {
    try {
      const payload = {
        nombre: editForm.nombre,
        correo: editForm.correo,
        activo: editForm.activo,
      };
      if (editForm.password) payload.password = editForm.password;
      await api.patch(`/auth/usuarios/${id}`, payload);
      setEditandoId('');
      showMensaje('Usuario actualizado');
      fetchUsuarios();
    } catch (err) {
      showError(err.response?.data?.detail || 'Error al actualizar usuario');
    }
  };

  const cambiarEstado = async (usuario, activo) => {
    try {
      await api.patch(`/auth/usuarios/${usuario.id}`, { activo });
      showMensaje(activo ? 'Usuario desbloqueado' : 'Usuario bloqueado');
      fetchUsuarios();
    } catch (err) {
      showError(err.response?.data?.detail || `Error al ${activo ? 'desbloquear' : 'bloquear'} usuario`);
    }
  };

  const eliminar = async (id) => {
    try {
      await api.delete(`/auth/usuarios/${id}`);
      showMensaje('Usuario eliminado');
      fetchUsuarios();
    } catch (err) {
      showError(err.response?.data?.detail || 'Error al eliminar usuario');
    }
  };

  const abrirEstado = (usuario, activo) => {
    const accion = activo ? 'desbloquear' : 'bloquear';
    setDecision({
      tipo: 'estado',
      usuario,
      activo,
      title: activo ? 'Desbloquear usuario' : 'Bloquear usuario',
      description: activo
        ? 'El usuario recuperara acceso al sistema con su rol actual.'
        : 'El usuario perdera acceso hasta que un administrador lo desbloquee.',
      actionLabel: activo ? 'Desbloquear' : 'Bloquear',
      tone: activo ? 'success' : 'danger',
      confirmText: accion.toUpperCase(),
      details: [
        { label: 'Usuario', value: usuario.nombre },
        { label: 'Correo', value: usuario.correo },
        { label: 'Rol', value: usuario.rol.replace('_', ' ') }
      ]
    });
  };

  const abrirEliminar = (usuario) => {
    setDecision({
      tipo: 'eliminar',
      usuario,
      title: 'Eliminar usuario',
      description: 'Esta accion elimina el usuario del sistema. Usa bloqueo si solo quieres retirar acceso temporalmente.',
      actionLabel: 'Eliminar usuario',
      tone: 'danger',
      confirmText: 'ELIMINAR',
      details: [
        { label: 'Usuario', value: usuario.nombre },
        { label: 'Correo', value: usuario.correo },
        { label: 'Rol', value: usuario.rol.replace('_', ' ') }
      ]
    });
  };

  const confirmarDecision = async () => {
    if (!decision) return;
    if (decision.tipo === 'estado') {
      await cambiarEstado(decision.usuario, decision.activo);
    } else {
      await eliminar(decision.usuario.id);
    }
    setDecision(null);
  };

  const rolBadge = (rol) => (
    <span className={`inline-flex max-w-full truncate rounded-lg border px-2.5 py-1 text-xs font-bold capitalize ${roleClasses[rol] || roleClasses.empleado}`}>
      {rol.replace('_', ' ')}
    </span>
  );

  const activos = usuarios.filter((u) => u.activo).length;
  const bloqueados = usuarios.filter((u) => !u.activo).length;
  const admins = usuarios.filter((u) => u.rol === 'admin').length;
  const oficiales = usuarios.filter((u) => u.rol === 'oficial_cumplimiento').length;

  return (
    <div className="animate-fade-in-up space-y-6">
      <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-2xl">
        <div className="relative p-7">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_20%,rgba(20,184,166,0.38),transparent_34%),radial-gradient(circle_at_85%_70%,rgba(245,158,11,0.24),transparent_32%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_420px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-teal-100">
                <UserCog className="h-3.5 w-3.5" />
                Control de accesos
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-white">Gestion de usuarios</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Crea usuarios, ajusta roles y administra accesos del sistema desde un panel operativo.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Usuarios</p>
                <p className="mt-3 text-3xl font-black">{loading ? '-' : usuarios.length}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Activos</p>
                <p className="mt-3 text-3xl font-black">{loading ? '-' : activos}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Bloqueados</p>
                <p className="mt-3 text-3xl font-black">{loading ? '-' : bloqueados}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Admins</p>
                <p className="mt-3 text-3xl font-black">{loading ? '-' : admins}</p>
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

      <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-teal-700">Directorio</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Usuarios registrados</h2>
            </div>
            <button
              onClick={() => setMostrarForm((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 ${
                mostrarForm
                  ? 'border border-slate-200 bg-white text-slate-800 hover:border-rose-200 hover:text-rose-700'
                  : 'bg-slate-950 text-white hover:bg-teal-700'
              }`}
            >
              {mostrarForm ? <XCircle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {mostrarForm ? 'Cancelar' : 'Nuevo usuario'}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[24%]" />
                <col className="w-[16%]" />
                <col className="w-[14%]" />
                <col className="w-[22%]" />
              </colgroup>
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-3 text-xs font-black uppercase tracking-widest text-slate-400 sm:px-5">Usuario</th>
                  <th className="px-3 py-3 text-xs font-black uppercase tracking-widest text-slate-400 sm:px-5">Correo</th>
                  <th className="px-3 py-3 text-xs font-black uppercase tracking-widest text-slate-400 sm:px-5">Rol</th>
                  <th className="px-3 py-3 text-xs font-black uppercase tracking-widest text-slate-400 sm:px-5">Estado</th>
                  <th className="px-3 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-400 sm:px-5">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={5} className="px-5 py-8 text-center text-sm font-semibold text-slate-500">Cargando usuarios...</td></tr>}
                {!loading && usuarios.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-sm font-semibold text-slate-500">Sin usuarios registrados.</td></tr>}
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                    <td className="px-3 py-4 sm:px-5">
                      <div className="flex items-center gap-3">
                        <div className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 sm:flex">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          {editandoId === u.id ? (
                            <input value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950" />
                          ) : (
                            <div className="truncate font-black text-slate-950">{u.nombre}</div>
                          )}
                          <div className="truncate text-xs font-semibold text-slate-400">ID {String(u.id).slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm font-semibold text-slate-500 sm:px-5">
                      {editandoId === u.id ? (
                        <div className="space-y-2">
                          <input value={editForm.correo} onChange={(e) => setEditForm({ ...editForm, correo: e.target.value })} className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700" />
                          <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Nueva contrasena" className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700" />
                        </div>
                      ) : <span className="block truncate">{u.correo}</span>}
                    </td>
                    <td className="px-3 py-4 sm:px-5">{rolBadge(u.rol)}</td>
                    <td className="px-3 py-4 sm:px-5">
                      {editandoId === u.id ? (
                        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600">
                          <input type="checkbox" checked={editForm.activo} onChange={(e) => setEditForm({ ...editForm, activo: e.target.checked })} />
                          Activo
                        </label>
                      ) : (
                        <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${u.activo ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-right sm:px-5">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <select
                          value={u.rol}
                          onChange={(e) => cambiarRol(u.id, e.target.value)}
                          className="min-w-0 max-w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-bold text-slate-700 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                        >
                          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        {editandoId === u.id ? (
                          <button onClick={() => guardarEdicion(u.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100">
                            <Save className="h-4 w-4" />
                          </button>
                        ) : (
                          <button onClick={() => iniciarEdicion(u)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50">
                            <UserCog className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => abrirEstado(u, !u.activo)}
                          disabled={u.correo === usuarioActual?.correo}
                          title={u.activo ? 'Bloquear usuario' : 'Desbloquear usuario'}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                            u.activo
                              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          } disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300`}
                        >
                          {u.activo ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => abrirEliminar(u)}
                          disabled={u.correo === usuarioActual?.correo}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          {mostrarForm && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-teal-700">Nuevo acceso</p>
                  <h3 className="text-lg font-black text-slate-950">Crear usuario</h3>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <User className="h-3.5 w-3.5" />
                    Nombre completo
                  </label>
                  <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10" />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <Mail className="h-3.5 w-3.5" />
                    Correo electronico
                  </label>
                  <input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10" />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <Lock className="h-3.5 w-3.5" />
                    Contrasena
                  </label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10" />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <KeyRound className="h-3.5 w-3.5" />
                    Rol
                  </label>
                  <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10">
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <button onClick={crear} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-teal-700">
                  <Plus className="h-4 w-4" />
                  Crear usuario
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-amber-700">Bloqueo de usuarios</p>
                <h3 className="text-lg font-black text-slate-950">{loading ? '-' : bloqueados} bloqueados</h3>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {usuarios.filter((u) => !u.activo).slice(0, 4).map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{u.nombre}</p>
                    <p className="truncate text-xs font-semibold text-slate-400">{u.correo}</p>
                  </div>
                  <button
                    onClick={() => cambiarEstado(u, true)}
                    className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                    title="Desbloquear usuario"
                  >
                    <Unlock className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {!loading && bloqueados === 0 && (
                <p className="rounded-xl border border-amber-200 bg-white px-3 py-3 text-sm font-bold text-slate-500">
                  No hay usuarios bloqueados.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-teal-700">Resumen de roles</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">Distribucion</h3>
            <div className="mt-5 space-y-4">
              {[
                ['Administradores', admins],
                ['Oficiales', oficiales],
                ['Otros roles', Math.max(usuarios.length - admins - oficiales, 0)],
              ].map(([label, value]) => {
                const width = usuarios.length ? Math.max(4, Math.round((value / usuarios.length) * 100)) : 4;
                return (
                  <div key={label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-700">{label}</span>
                      <span className="font-black text-slate-950">{loading ? '-' : value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-teal-500" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </section>
      <DecisionModal
        open={Boolean(decision)}
        title={decision?.title}
        description={decision?.description}
        actionLabel={decision?.actionLabel}
        tone={decision?.tone}
        confirmText={decision?.confirmText}
        confirmHelp={`Escribe ${decision?.confirmText || ''} para confirmar esta accion administrativa.`}
        details={decision?.details || []}
        onClose={() => setDecision(null)}
        onConfirm={confirmarDecision}
      />
    </div>
  );
}
