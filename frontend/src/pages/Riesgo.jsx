import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import RiesgoIndicador from '../components/RiesgoIndicador';
import ClienteSelector from '../components/ClienteSelector';
import EmptyState from '../components/EmptyState';
import AIAssistantPanel from '../components/AIAssistantPanel';
import { Shield, RefreshCw, AlertCircle, CheckCircle2, Workflow } from 'lucide-react';

export default function Riesgo() {
  const params = useParams();
  const urlId = params.id;

  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(urlId || '');
  const [tipoCliente, setTipoCliente] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [riesgoFiltro, setRiesgoFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
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
      const res = await api.post(`/clientes/${id}/riesgo/calcular`);
      const decision = res.data?.decision_automatica;
      if (decision?.accion === 'activado') {
        showMensaje('Riesgo recalculado y cliente activado automaticamente por riesgo bajo');
      } else if (decision?.accion === 'escalado') {
        showMensaje('Riesgo recalculado; expediente escalado para revision del Oficial');
      } else {
        showMensaje('Riesgo recalculado correctamente');
      }
      consultar(id);
    } catch (err) {
      showError(err.response?.data?.detail || 'Error al recalcular riesgo');
    } finally {
      setRecalculando(false);
    }
  };

  const clienteSeleccionado = clientes.find(c => c.id_cliente === clienteId);
  const factores = Array.isArray(riesgo?.factores_aplicados?.factores)
    ? riesgo.factores_aplicados.factores
    : [];
  const bloqueantes = factores.filter(f => f.tipo === 'bloqueante');
  const positivos = factores.filter(f => f.tipo === 'positivo');
  const mitigantes = factores.filter(f => f.tipo === 'mitigante');
  const decisionTexto = riesgo?.nivel_riesgo === 'BAJO'
    ? 'Autoactivable solo si documentos, perfiles, beneficiarios y observaciones estan completos.'
    : riesgo?.nivel_riesgo === 'ESTANDAR'
      ? 'Escalado al Oficial: requiere revision manual antes de activar.'
      : 'No autoactivable: riesgo alto requiere confirmacion explicita del Oficial.';

  const renderFactores = (titulo, lista) => (
    <div style={{ marginTop: 12 }}>
      <div className="info-item-label">{titulo}</div>
      {lista.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>Sin factores en esta categoria.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {lista.map((factor, index) => (
            <div key={`${factor.factor}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '9px 10px', borderRadius: 10, background: 'rgba(15,23,42,0.035)' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{String(factor.factor || '').replaceAll('_', ' ')}</span>
              <span style={{ color: factor.peso < 0 ? '#16A34A' : factor.tipo === 'bloqueante' ? '#DC2626' : '#B7791F', fontWeight: 900 }}>
                {factor.tipo === 'bloqueante' ? 'Bloqueante' : `${factor.peso > 0 ? '+' : ''}${factor.peso || 0}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

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

      <ClienteSelector
        clientes={clientes}
        value={clienteId}
        onChange={(id) => { setClienteId(id); setRiesgo(null); }}
        tipo={tipoCliente}
        onTipoChange={(value) => { setTipoCliente(value); setClienteId(''); setRiesgo(null); }}
        estado={estadoFiltro}
        onEstadoChange={(value) => { setEstadoFiltro(value); setClienteId(''); setRiesgo(null); }}
        riesgo={riesgoFiltro}
        onRiesgoChange={(value) => { setRiesgoFiltro(value); setClienteId(''); setRiesgo(null); }}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        title="Seleccionar expediente para riesgo"
        description="Busca por nombre, cedula, RUC, estado o nivel de riesgo."
      />

      {clienteSeleccionado && (
        <div style={{ marginTop: 18, marginBottom: 18 }}>
          <AIAssistantPanel
            clienteId={clienteId}
            tipoCliente={clienteSeleccionado.tipo_cliente}
            actions={['resumen', 'screening', 'prioridad', 'observacion', 'buscar']}
            title="Asistente IA de riesgo"
          />
        </div>
      )}

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

          <div style={{ background: riesgo.nivel_riesgo === 'ALTO' ? 'rgba(220,38,38,0.06)' : 'rgba(20,184,166,0.06)', borderRadius: 10, padding: 16, marginBottom: 24, border: '1px solid rgba(148,163,184,0.16)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
              <Workflow className="h-4 w-4 text-gold" />
              <div className="info-item-label">Decision del sistema</div>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{decisionTexto}</div>
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
              <div className="card" style={{ padding: 16, gridColumn: 'span 2' }}>
                <div className="info-item-label">Factores aplicados</div>
                {renderFactores('Bloqueantes', bloqueantes)}
                {renderFactores('Ponderados', positivos)}
                {renderFactores('Mitigantes', mitigantes)}
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

      {!riesgo && !clienteId && (
        <EmptyState icon={Shield} title="Selecciona un expediente" message="Usa la busqueda superior para consultar riesgo, factores aplicados y decision sugerida del sistema." />
      )}

      {!riesgo && clienteId && !error && (
        <EmptyState icon={Shield} title="Riesgo no calculado" message="Este expediente aun no tiene clasificacion. Normalmente faltan perfiles financiero/transaccional o datos transaccionales." />
      )}
    </div>
  );
}
