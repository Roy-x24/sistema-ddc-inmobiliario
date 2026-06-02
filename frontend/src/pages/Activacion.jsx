import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import EstadoBadge from '../components/EstadoBadge';
import RiesgoIndicador from '../components/RiesgoIndicador';

export default function Activacion() {
  const [clientes, setClientes] = useState([]);
  const [errores, setErrores] = useState([]);

  const cargar = async () => {
    const res = await api.get('/clientes/?limit=9999');
    setClientes(res.data || []);
  };

  useEffect(() => { cargar(); }, []);

  const mostrarErrores = (lista) => {
    setErrores(lista);
    setTimeout(() => setErrores([]), 8000);
  };

  const activar = async (id) => {
    if (!window.confirm('¿Confirma que desea activar este cliente?')) return;
    setErrores([]);
    try {
      await api.patch(`/clientes/${id}/activar`);
      cargar();
    } catch (err) {
      console.error('Error al activar:', err);
      const res = err.response;
      if (res && res.status === 400) {
        const detail = res.data?.detail;
        if (detail && detail.requisitos_faltantes) {
          mostrarErrores(detail.requisitos_faltantes);
        } else if (typeof detail === 'string') {
          mostrarErrores([detail]);
        } else {
          mostrarErrores(['Error desconocido del servidor']);
        }
      } else {
        mostrarErrores(['Error de conexión con el servidor']);
      }
    }
  };

  const rechazar = async (id) => {
    const motivo = window.prompt('Motivo de rechazo obligatorio');
    if (!motivo) return;
    setErrores([]);
    try {
      await api.patch(`/clientes/${id}/rechazar?motivo=${encodeURIComponent(motivo)}`);
      cargar();
    } catch (err) {
      console.error('Error al rechazar:', err);
      const detail = err.response?.data?.detail;
      mostrarErrores([typeof detail === 'string' ? detail : 'Error al rechazar cliente']);
    }
  };

  const pendientes = clientes.filter(c => c.estado !== 'ACTIVO' && c.estado !== 'RECHAZADO');

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Activación de clientes</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Gestión de aprobación y rechazo de expedientes</p>
      </div>

      {errores.length > 0 && (
        <div style={{
          marginTop: 20,
          marginBottom: 20,
          padding: 20,
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(220, 38, 38, 0.08)',
          border: '1px solid rgba(220, 38, 38, 0.25)',
          color: '#F87171'
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            No se puede activar — Requisitos pendientes
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
            {errores.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <div className="table-container" style={{ marginTop: 24 }}>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Identificación</th>
              <th>Estado</th>
              <th>Riesgo</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pendientes.map(c => (
              <tr key={c.id_cliente}>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.nombre || '-'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.id_cliente?.slice(0, 8)}...</div>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)' }}>{c.identificacion || '-'}</td>
                <td><EstadoBadge estado={c.estado} /></td>
                <td>{c.nivel_riesgo ? <RiesgoIndicador nivel={c.nivel_riesgo} /> : '-'}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => activar(c.id_cliente)} className="btn-primary" style={{ padding: '8px 16px', fontSize: 12, background: 'linear-gradient(135deg, #16A34A, #15803d)' }}>Activar</button>
                    <button onClick={() => rechazar(c.id_cliente)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 12, backgroundColor: 'rgba(220,38,38,0.1)', color: '#F87171', borderColor: 'rgba(220,38,38,0.2)' }}>Rechazar</button>
                  </div>
                </td>
              </tr>
            ))}
            {pendientes.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Sin clientes pendientes de activación.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
