import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import RiesgoIndicador from '../components/RiesgoIndicador';
import { Shield, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { clienteOptionLabel, filtrarClientesPorTipo, tipoClienteBadgeClass, tipoClienteLabel } from '../utils/clientesUi';

export default function Riesgo() {
  const params = useParams();
  const urlId = params.id;

  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(urlId || '');
  const [tipoCliente, setTipoCliente] = useState('');
  const [riesgo, setRiesgo] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [recalculando, setRecalculando] = useState(false);

  useEffect(() => {
    api.get('/clientes/?limit=9999').then(res => setClientes(res.data || []));
  }, []);

  useEffect(() => {
    if (clienteId) consultar(clienteId);
  }, [clienteId]);

  useEffect(() => {
    if (urlId) setClienteId(urlId);
  }, [urlId]);

  const showMensaje = (text) => { setMensaje(text); setTimeout(() => setMensaje(''), 4000); };
  const showError = (text) => { setError(text); setTimeout(() => setError(''), 6000); };

  const consultar = async (id) => {
    if (!id) return;
    try {
      const res = await api.get(`/clientes/${id}/riesgo`);
      setRiesgo(res.data);
      setError('');
    } catch (err) {
      setRiesgo(null);
      if (err.response?.status === 404) {
        showError('No se ha calculado el riesgo para este cliente. Verifique que tenga ambos perfiles completos.');
      } else {
        showError('Error al consultar riesgo');
      }
    }
  };

  const recalcular = async (id) => {
    if (!id) return;
    setRecalculando(true);
    try {
      await api.post(`/clientes/${id}/riesgo/calcular`);
      showMensaje('Riesgo recalculado correctamente');
      consultar(id);
    } catch (err) {
      showError(err.response?.data?.detail || 'Error al recalcular riesgo');
    } finally {
      setRecalculando(false);
    }
  };

  const clientesFiltrados = filtrarClientesPorTipo(clientes, tipoCliente);
  const clienteSeleccionado = clientes.find(c => c.id_cliente === clienteId);

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Clasificación de riesgo</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Evaluación automática y manual de riesgo</p>
      </div>

      {mensaje && (
        <div className="success-banner" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 className="h-4 w-4" />
          {mensaje}
        </div>
      )}
      {error && (
        <div className="error-banner" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div style={{ marginBottom: 24, marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ width: 220 }}>
          <label className="label-upper">Tipo de cliente</label>
          <select value={tipoCliente} onChange={e => { setTipoCliente(e.target.value); setClienteId(''); setRiesgo(null); }} className="select-field" style={{ width: '100%' }}>
            <option value="">Todos</option>
            <option value="NATURAL">Persona natural</option>
            <option value="JURIDICA">Persona juridica</option>
          </select>
        </div>
        <div>
          <label className="label-upper">Cliente</label>
          <select value={clienteId} onChange={e => { setClienteId(e.target.value); }} className="select-field" style={{ minWidth: 320 }}>
            <option value="">Seleccione un cliente</option>
            {clientesFiltrados.map(c => <option key={c.id_cliente} value={c.id_cliente}>{clienteOptionLabel(c)}</option>)}
          </select>
        </div>
        {clienteSeleccionado && (
          <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${tipoClienteBadgeClass(clienteSeleccionado.tipo_cliente)}`}>
            {tipoClienteLabel(clienteSeleccionado.tipo_cliente)}
          </span>
        )}
      </div>

      {riesgo && (
        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>Nivel de riesgo</div>
              <RiesgoIndicador nivel={riesgo.nivel_riesgo} />
            </div>
          </div>

          <div style={{ background: 'rgba(212,175,55,0.04)', borderRadius: 10, padding: 16, marginBottom: 24, border: '1px solid rgba(212,175,55,0.1)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 6 }}>Justificación</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{riesgo.justificacion}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            <div className="card" style={{ padding: 16 }}>
              <div className="info-item-label">Fecha cálculo</div>
              <div className="info-item-value">{new Date(riesgo.fecha_calculo).toLocaleString()}</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div className="info-item-label">Automático</div>
              <div className="info-item-value">{riesgo.es_automatica ? 'Sí' : 'No'}</div>
            </div>
            {riesgo.factores_aplicados && (
              <div className="card" style={{ padding: 16 }}>
                <div className="info-item-label">Factores aplicados</div>
                <div className="info-item-value" style={{ fontSize: 12 }}>
                  {Object.entries(riesgo.factores_aplicados).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 6 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{k}:</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 24 }}>
            <button onClick={() => recalcular(clienteId)} disabled={recalculando} className="btn-primary" style={{ padding: '12px 24px' }}>
              <RefreshCw className={`h-4 w-4 ${recalculando ? 'animate-spin' : ''}`} />
              {recalculando ? 'Recalculando...' : 'Forzar recálculo'}
            </button>
          </div>
        </div>
      )}

      {!riesgo && clienteId && !error && (
        <div className="empty-state" style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(212,175,55,0.12)' }}>
          <div className="empty-state-icon"><Shield className="h-6 w-6" /></div>
          No se ha calculado el riesgo para este cliente. Verifique que tenga ambos perfiles completos.
        </div>
      )}
    </div>
  );
}
