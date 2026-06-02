import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import RiesgoIndicador from '../components/RiesgoIndicador';

export default function Riesgo() {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [riesgo, setRiesgo] = useState(null);

  useEffect(() => {
    api.get('/clientes/?limit=9999').then(res => setClientes(res.data || []));
  }, []);

  const consultar = async (id) => {
    if (!id) return;
    try {
      const res = await api.get(`/clientes/${id}/riesgo`);
      setRiesgo(res.data);
    } catch {
      setRiesgo(null);
    }
  };

  const recalcular = async (id) => {
    if (!id) return;
    await api.post(`/clientes/${id}/riesgo/calcular`);
    consultar(id);
  };

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Clasificación de riesgo</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Evaluación automática y manual de riesgo</p>
      </div>

      <div style={{ marginBottom: 24, marginTop: 24 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Cliente</label>
        <select value={clienteId} onChange={e => { setClienteId(e.target.value); consultar(e.target.value); }} className="select-field" style={{ minWidth: 320 }}>
          <option value="">Seleccione un cliente</option>
          {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre || c.id_cliente}</option>)}
        </select>
      </div>

      {riesgo && (
        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <RiesgoIndicador nivel={riesgo.nivel_riesgo} />
            <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{riesgo.justificacion}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            <div><strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Fecha cálculo</strong>{new Date(riesgo.fecha_calculo).toLocaleString()}</div>
            <div><strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Automático</strong>{riesgo.es_automatica ? 'Sí' : 'No'}</div>
            {riesgo.recalculado_por && <div><strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Recalculado por</strong>{riesgo.recalculado_por}</div>}
          </div>
          <div style={{ marginTop: 24 }}>
            <button onClick={() => recalcular(clienteId)} className="btn-primary" style={{ padding: '12px 24px' }}>Forzar recálculo</button>
          </div>
        </div>
      )}
      {!riesgo && clienteId && (
        <div className="card" style={{ padding: 32, color: 'var(--text-muted)' }}>
          No se ha calculado el riesgo para este cliente. Verifique que tenga ambos perfiles completos.
        </div>
      )}
    </div>
  );
}
