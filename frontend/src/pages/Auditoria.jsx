import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

export default function Auditoria() {
  const [registros, setRegistros] = useState([]);
  const [clienteId, setClienteId] = useState('');

  const cargar = async () => {
    try {
      const res = await api.get('/auditoria');
      setRegistros(res.data || []);
    } catch {
      setRegistros([]);
    }
  };

  const cargarPorCliente = async (id) => {
    if (!id) { cargar(); return; }
    try {
      const res = await api.get(`/clientes/${id}/auditoria`);
      setRegistros(res.data || []);
    } catch {
      setRegistros([]);
    }
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Auditoría</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Trazabilidad de acciones sobre expedientes</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, marginTop: 24, flexWrap: 'wrap' }}>
        <input placeholder="ID de cliente (opcional)" value={clienteId} onChange={e => setClienteId(e.target.value)} className="input-field" style={{ minWidth: 260 }} />
        <button onClick={() => cargarPorCliente(clienteId)} className="btn-primary" style={{ padding: '12px 20px' }}>Filtrar</button>
        <button onClick={() => { setClienteId(''); cargar(); }} className="btn-secondary" style={{ padding: '12px 20px' }}>Ver todo</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Expediente</th>
              <th>Cambio</th>
            </tr>
          </thead>
          <tbody>
            {registros.map(r => (
              <tr key={r.id_auditoria}>
                <td style={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{new Date(r.fecha).toLocaleString()}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      backgroundColor: 'rgba(201, 162, 39, 0.1)',
                      color: 'var(--accent-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700
                    }}>
                      {r.usuario.charAt(0).toUpperCase()}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{r.usuario}</span>
                  </div>
                </td>
                <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.accion.replace(/_/g, ' ')}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{r.cliente_id ? r.cliente_id.slice(0, 8) + '...' : '-'}</td>
                <td style={{ maxWidth: 260, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{r.valor_anterior || '-'}</span>
                  <span style={{ margin: '0 8px', color: 'var(--accent-gold)' }}>→</span>
                  <span>{r.valor_nuevo || '-'}</span>
                </td>
              </tr>
            ))}
            {registros.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Sin registros.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
