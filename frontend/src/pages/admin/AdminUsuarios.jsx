import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../api/axiosConfig';
import Boton from '../../components/ui/Boton';
import Alerta from '../../components/ui/Alerta';
import Tabla from '../../components/ui/Tabla';
import { Users, Plus, Trash2, AlertCircle, CheckCircle2, XCircle, User, Shield, Mail, Lock, KeyRound } from 'lucide-react';

const ROLES = [
  { value: 'empleado', label: 'Empleado' },
  { value: 'oficial_cumplimiento', label: 'Oficial de Cumplimiento' },
  { value: 'auditor', label: 'Auditor' },
  { value: 'admin', label: 'Administrador' },
];

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

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

  const crear = async (data) => {
    try {
      await api.post('/auth/usuarios', data);
      reset({ nombre: '', correo: '', password: '', rol: 'empleado' });
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

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/auth/usuarios/${id}`);
      showMensaje('Usuario eliminado');
      fetchUsuarios();
    } catch (err) {
      showError(err.response?.data?.detail || 'Error al eliminar usuario');
    }
  };

  const rolBadge = (rol) => {
    const map = {
      admin: { bg: 'rgba(220,38,38,0.1)', color: '#F87171', border: 'rgba(220,38,38,0.2)' },
      oficial_cumplimiento: { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: 'rgba(59,130,246,0.2)' },
      auditor: { bg: 'rgba(124,58,237,0.1)', color: '#7C3AED', border: 'rgba(124,58,237,0.2)' },
      empleado: { bg: 'rgba(22,163,74,0.1)', color: '#16A34A', border: 'rgba(22,163,74,0.2)' },
    };
    const s = map[rol] || map.empleado;
    return <span className="badge" style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{rol.replace('_', ' ')}</span>;
  };

  const columns = [
    { key: 'usuario', label: 'Usuario' },
    { key: 'correo', label: 'Correo' },
    { key: 'rol', label: 'Rol' },
    { key: 'estado', label: 'Estado' },
    { key: 'acciones', label: 'Acciones', render: (row) => (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
        <select
          value={row.rol}
          onChange={e => cambiarRol(row.id, e.target.value)}
          className="select-field"
          style={{ width: 160, padding: '6px 10px', fontSize: 12 }}
        >
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <button onClick={() => eliminar(row.id)} className="btn-danger" style={{ padding: '6px 12px', fontSize: 12 }}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    )}
  ];

  const data = usuarios.map(u => ({
    id: u.id,
    usuario: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-gold">
          <User className="h-4 w-4" />
        </div>
        <span style={{ fontWeight: 600 }}>{u.nombre}</span>
      </div>
    ),
    correo: <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.correo}</span>,
    rol: rolBadge(u.rol),
    estado: (
      <span className="badge" style={{
        backgroundColor: u.activo ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
        color: u.activo ? '#16A34A' : '#F87171',
        border: `1px solid ${u.activo ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`
      }}>{u.activo ? 'Activo' : 'Inactivo'}</span>
    ),
  }));

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Gestión de usuarios</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Crear, editar roles y administrar accesos al sistema</p>
      </div>

      {mensaje && <div className="mb-4"><Alerta variant="exito">{mensaje}</Alerta></div>}
      {error && <div className="mb-4"><Alerta variant="error">{error}</Alerta></div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, marginTop: 24 }}>
        <Boton variant="primario" onClick={() => setMostrarForm(v => !v)}>
          {mostrarForm ? <XCircle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {mostrarForm ? 'Cancelar' : 'Nuevo usuario'}
        </Boton>
      </div>

      {mostrarForm && (
        <form onSubmit={handleSubmit(crear)} className="card" style={{ padding: 28, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 20, fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}>Crear usuario</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div>
              <label className="label-upper">Nombre completo</label>
              <input {...register('nombre', { required: 'Nombre es obligatorio' })} className="input-field" />
              {errors.nombre && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="label-upper">Correo electrónico</label>
              <input type="email" {...register('correo', { required: 'Correo es obligatorio', pattern: { value: /\S+@\S+\.\S+/, message: 'Correo inválido' } })} className="input-field" />
              {errors.correo && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors.correo.message}</p>}
            </div>
            <div>
              <label className="label-upper">Contraseña</label>
              <input type="password" {...register('password', { required: 'Contraseña es obligatoria', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })} className="input-field" />
              {errors.password && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{errors.password.message}</p>}
            </div>
            <div>
              <label className="label-upper">Rol</label>
              <select {...register('rol', { required: 'Rol es obligatorio' })} className="select-field" style={{ width: '100%' }}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <Boton type="submit" variant="primario" loading={isSubmitting}><Plus className="h-4 w-4" /> Crear usuario</Boton>
          </div>
        </form>
      )}

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Cargando usuarios...
        </div>
      ) : (
        <Tabla columns={columns} data={data} />
      )}
    </div>
  );
}
