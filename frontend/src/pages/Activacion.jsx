import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import EstadoBadge from '../components/EstadoBadge';
import RiesgoIndicador from '../components/RiesgoIndicador';
import { AlertTriangle, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export default function Activacion() {
  const [clientes, setClientes] = useState([]);
  const [errores, setErrores] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [confirmando, setConfirmando] = useState({});

  const cargar = async () => {
    const res = await api.get('/clientes/?limit=9999');
    setClientes(res.data || []);
  };

  useEffect(() => { cargar(); }, []);

  const mostrarErrores = (lista) => {
    setErrores(lista);
    setMensaje('');
    setTimeout(() => setErrores([]), 10000);
  };

  const mostrarMensaje = (texto) => {
    setMensaje(texto);
    setErrores([]);
    setTimeout(() => setMensaje(''), 4000);
  };

  const activar = async (id) => {
    const cliente = clientes.find(c => c.id_cliente === id);
    const necesitaConfirmacion = cliente?.nivel_riesgo === 'ALTO';
    const conf = necesitaConfirmacion ? confirmando[id] : true;

    if (necesitaConfirmacion && !conf) {
      mostrarErrores(['Riesgo ALTO: debe marcar la confirmación manual adicional para activar este cliente.']);
      return;
    }

    if (!window.confirm('¿Confirma que desea activar este cliente?')) return;
    setErrores([]);
    try {
      await api.patch(`/clientes/${id}/activar`, null, {
        params: { confirmacion_alto: conf ? true : false }
      });
      mostrarMensaje('Cliente activado exitosamente');
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
      mostrarMensaje('Cliente rechazado');
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

      {mensaje && (
        <div className="success-banner" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 className="h-4 w-4" />
          {mensaje}
        </div>
      )}

      {errores.length > 0 && (
        <div className="error-banner">
          <div className="error-banner-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle className="h-4 w-4" />
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
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                    {c.nivel_riesgo === 'ALTO' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', marginRight: 4 }}>
                        <input
                          type="checkbox"
                          checked={!!confirmando[c.id_cliente]}
                          onChange={e => setConfirmando({ ...confirmando, [c.id_cliente]: e.target.checked })}
                        />
                        Confirmar ALTO
                      </label>
                    )}
                    <button onClick={() => activar(c.id_cliente)} className="btn-success" style={{ padding: '8px 16px', fontSize: 12 }}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Activar
                    </button>
                    <button onClick={() => rechazar(c.id_cliente)} className="btn-danger" style={{ padding: '8px 16px', fontSize: 12 }}>
                      <XCircle className="h-3.5 w-3.5" /> Rechazar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pendientes.length === 0 && (
              <tr><td colSpan={5} className="empty-state">Sin clientes pendientes de activación.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
