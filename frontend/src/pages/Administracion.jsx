import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

export default function Administracion() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({ nombre: '', correo: '', password: '', rol: 'empleado' });
  const [mensaje, setMensaje] = useState('');

  const cargar = async () => {
    try {
      const res = await api.get('/auth/usuarios');
      setUsuarios(res.data || []);
    } catch (e) {
      setUsuarios([]);
    }
  };

  useEffect(() => { cargar(); }, []);

  const crear = async () => {
    setMensaje('');
    try {
      await api.post('/auth/usuarios', form);
      setMensaje('Usuario creado correctamente');
      setForm({ nombre: '', correo: '', password: '', rol: 'empleado' });
      cargar();
    } catch (e) {
      setMensaje('Error: ' + (e.response?.data?.detail || e.message));
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Administración</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Gestión de usuarios y roles del sistema</p>
      </div>

      {mensaje && (
        <div style={{
          marginBottom: 20,
          marginTop: 20,
          padding: 14,
          borderRadius: 'var(--radius-sm)',
          backgroundColor: mensaje.startsWith('Error') ? 'rgba(220, 38, 38, 0.1)' : 'rgba(22, 163, 74, 0.1)',
          border: `1px solid ${mensaje.startsWith('Error') ? 'rgba(220, 38, 38, 0.2)' : 'rgba(22, 163, 74, 0.2)'}`,
          color: mensaje.startsWith('Error') ? '#F87171' : '#4ADE80',
          fontSize: 14
        }}>
          {mensaje}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24, marginTop: 24 }}>
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 18, marginBottom: 24, fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}>Crear usuario</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Nombre completo</label>
            <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="input-field" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Correo electrónico</label>
            <input type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} className="input-field" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Contraseña</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Rol</label>
            <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} className="select-field" style={{ width: '100%' }}>
              <option value="empleado">Empleado</option>
              <option value="oficial_cumplimiento">Oficial de Cumplimiento</option>
              <option value="auditor">Auditor</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
          <button onClick={crear} className="btn-primary" style={{ width: '100%' }}>Crear usuario</button>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 18, marginBottom: 24, fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}>Usuarios registrados</h3>
          <div className="table-container" style={{ boxShadow: 'none', border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Activo</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.correo}</td>
                    <td><span className="badge" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--accent-cobalt-light)', border: '1px solid rgba(59,130,246,0.2)' }}>{u.rol.replace('_', ' ')}</span></td>
                    <td>{u.activo ? <span style={{ color: '#4ADE80' }}>●</span> : <span style={{ color: 'var(--text-muted)' }}>●</span>}</td>
                  </tr>
                ))}
                {usuarios.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Sin usuarios.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
