import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import ClienteSelector from '../components/ClienteSelector';
import EmptyState from '../components/EmptyState';
import PaginationControls from '../components/PaginationControls';
import AIAssistantPanel from '../components/AIAssistantPanel';
import DecisionModal from '../components/DecisionModal';
import ExpedienteChecklistPanel from '../components/ExpedienteChecklistPanel';
import { MessageSquare, Send, Lock, Unlock, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { pageCountFor, paginate } from '../utils/pagination';

export default function Observaciones() {
  const { id: urlId } = useParams();
  const { usuario } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(urlId || '');
  const [tipoCliente, setTipoCliente] = useState('');
  const [estadoCliente, setEstadoCliente] = useState('');
  const [riesgoCliente, setRiesgoCliente] = useState('');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [estadoObservacion, setEstadoObservacion] = useState('');
  const [observaciones, setObservaciones] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [nueva, setNueva] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [decision, setDecision] = useState(null);

  const cargarClientesConObservaciones = async (tipo = tipoCliente) => {
    const params = new URLSearchParams();
    if (tipo) params.append('tipo', tipo);
    if (estadoObservacion) params.append('estado_observacion', estadoObservacion);
    const query = params.toString();
    const res = await api.get(`/clientes/con-observaciones${query ? `?${query}` : ''}`);
    const siguientes = res.data || [];
    setClientes((actuales) => {
      const seleccionadoActual = actuales.find((cliente) => cliente.id_cliente === clienteId);
      if (seleccionadoActual && !siguientes.some((cliente) => cliente.id_cliente === clienteId)) {
        return [seleccionadoActual, ...siguientes];
      }
      return siguientes;
    });
  };

  useEffect(() => {
    cargarClientesConObservaciones();
  }, []);

  useEffect(() => {
    setPage(1);
    cargarClientesConObservaciones();
  }, [estadoObservacion]);

  useEffect(() => {
    if (clienteId) fetchObs(clienteId);
  }, [clienteId]);

  useEffect(() => {
    if (urlId) setClienteId(urlId);
  }, [urlId]);

  const showMensaje = (text) => { setMensaje(text); setTimeout(() => setMensaje(''), 4000); };
  const showError = (text) => { setError(text); setTimeout(() => setError(''), 6000); };

  const fetchObs = async (cid) => {
    setLoading(true);
    try {
      const res = await api.get(`/clientes/${cid}/observaciones`);
      setObservaciones(res.data || []);
    } catch {
      setObservaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const crear = async () => {
    if (!nueva.trim()) return;
    try {
      await api.post(`/clientes/${clienteId}/observaciones`, { descripcion: nueva });
      setNueva('');
      showMensaje('Observación creada');
      cargarClientesConObservaciones();
      fetchObs(clienteId);
    } catch {
      showError('Error al crear observación');
    }
  };

  const responder = async (obsId, respuesta) => {
    try {
      await api.patch(`/clientes/observaciones/${obsId}/responder`, null, { params: { respuesta } });
      showMensaje('Respuesta registrada');
      cargarClientesConObservaciones();
      fetchObs(clienteId);
    } catch {
      showError('Error al responder observación');
    }
  };

  const cargarChecklistDecision = async () => {
    if (!clienteId) return null;
    try {
      const res = await api.post(`/clientes/${clienteId}/checklist`);
      return res.data;
    } catch {
      return null;
    }
  };

  const abrirRespuesta = async (observacion) => {
    const checklist = await cargarChecklistDecision();
    setDecision({
      type: 'responder',
      observacion,
      checklist,
      title: 'Responder observacion',
      description: 'Escribe la respuesta que quedara registrada para revision del Oficial.',
      actionLabel: 'Enviar respuesta',
      tone: 'success'
    });
  };

  const confirmarRespuesta = async ({ reason }) => {
    if (!decision) return;
    if (decision.type === 'cerrar') {
      await cerrar(decision.observacion.id);
    } else {
      await responder(decision.observacion.id, reason);
    }
    setDecision(null);
  };

  const cerrar = async (obsId) => {
    try {
      await api.patch(`/clientes/observaciones/${obsId}/cerrar`);
      showMensaje('Observación cerrada');
      cargarClientesConObservaciones();
      fetchObs(clienteId);
    } catch {
      showError('Error al cerrar observación');
    }
  };

  const abrirCierre = async (observacion) => {
    const checklist = await cargarChecklistDecision();
    setDecision({
      type: 'cerrar',
      observacion,
      checklist,
      title: 'Cerrar observacion',
      description: 'Confirma que la respuesta atiende la observacion. Si no quedan bloqueos, el expediente puede volver al flujo de revision o activacion.',
      actionLabel: 'Cerrar observacion',
      tone: 'success',
      confirmText: 'CERRAR',
      confirmHelp: 'Escribe CERRAR para confirmar que revisaste la respuesta y cierras este bloqueo.',
      requireReason: false,
    });
  };

  const clienteSeleccionado = clientes.find(c => c.id_cliente === clienteId);
  const estadoOperativoObservacion = (row) => {
    if (row.estado === 'CERRADA') return 'CERRADA';
    if (row.estado === 'ABIERTA' && row.respuesta) return 'RESPONDIDA';
    return 'SIN_RESPUESTA';
  };
  const observacionesFiltradas = observaciones.filter((row) => {
    if (estadoObservacion === 'RESPONDIDA' && estadoOperativoObservacion(row) !== 'RESPONDIDA') return false;
    if (estadoObservacion === 'SIN_RESPUESTA' && estadoOperativoObservacion(row) !== 'SIN_RESPUESTA') return false;
    if (estadoObservacion && !['RESPONDIDA', 'SIN_RESPUESTA'].includes(estadoObservacion) && row.estado !== estadoObservacion) return false;
    return true;
  });
  const observacionesPaginadas = paginate(observacionesFiltradas, page, pageSize);
  const abiertas = observaciones.filter(row => row.estado === 'ABIERTA').length;
  const cerradas = observaciones.filter(row => row.estado === 'CERRADA').length;
  const pendientesRespuesta = observaciones.filter(row => row.estado === 'ABIERTA' && !row.respuesta).length;
  const respondidas = observaciones.filter(row => row.estado === 'ABIERTA' && row.respuesta).length;

  useEffect(() => {
    const totalPages = pageCountFor(observacionesFiltradas, pageSize);
    if (page > totalPages) setPage(totalPages);
  }, [observacionesFiltradas, page, pageSize]);

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Observaciones</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Gestión de observaciones y respuestas de expedientes</p>
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

      <div className="card" style={{ padding: 16, marginTop: 22, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div>
          <div className="label-upper">Filtro de trabajo</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Encuentra expedientes por estado de sus observaciones.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setEstadoObservacion('')} className={estadoObservacion === '' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '9px 14px', fontSize: 12 }}>Todas</button>
          <button type="button" onClick={() => setEstadoObservacion('ABIERTA')} className={estadoObservacion === 'ABIERTA' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '9px 14px', fontSize: 12 }}>Abiertas</button>
          <button type="button" onClick={() => setEstadoObservacion('SIN_RESPUESTA')} className={estadoObservacion === 'SIN_RESPUESTA' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '9px 14px', fontSize: 12 }}>Sin respuesta</button>
          <button type="button" onClick={() => setEstadoObservacion('RESPONDIDA')} className={estadoObservacion === 'RESPONDIDA' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '9px 14px', fontSize: 12 }}>Respondidas</button>
          <button type="button" onClick={() => setEstadoObservacion('CERRADA')} className={estadoObservacion === 'CERRADA' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '9px 14px', fontSize: 12 }}>Cerradas</button>
        </div>
      </div>

      <ClienteSelector
        clientes={clientes}
        value={clienteId}
        onChange={(id) => { setClienteId(id); setPage(1); }}
        tipo={tipoCliente}
        onTipoChange={(valor) => { setTipoCliente(valor); setClienteId(''); setObservaciones([]); setPage(1); cargarClientesConObservaciones(valor); }}
        estado={estadoCliente}
        onEstadoChange={(valor) => { setEstadoCliente(valor); setPage(1); }}
        riesgo={riesgoCliente}
        onRiesgoChange={(valor) => { setRiesgoCliente(valor); setPage(1); }}
        busqueda={busquedaCliente}
        onBusquedaChange={(valor) => { setBusquedaCliente(valor); setPage(1); }}
        title="Seleccionar expediente observado"
        description="Busca expedientes con observaciones y filtra por tipo, estado del cliente o riesgo."
        emptyText="No hay expedientes con observaciones para esos filtros."
      />

      {clienteSeleccionado && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]" style={{ marginTop: 18 }}>
          <AIAssistantPanel
            clienteId={clienteId}
            tipoCliente={clienteSeleccionado.tipo_cliente}
            context="observaciones"
            metadata={{
              estado: clienteSeleccionado.estado,
              riesgo: clienteSeleccionado.nivel_riesgo,
            }}
            title="Asistente IA de observaciones"
          />
          <ExpedienteChecklistPanel
            clienteId={clienteId}
            title="Bloqueos por observaciones"
            compact
          />
        </div>
      )}

      {clienteSeleccionado && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 16, marginBottom: 20 }}>
          <button type="button" onClick={() => { setEstadoObservacion(''); setPage(1); }} className="card" style={{ padding: 14, textAlign: 'left', borderColor: estadoObservacion === '' ? 'rgba(20,184,166,0.45)' : undefined }}>
            <div className="info-item-label">Total</div>
            <div className="info-item-value">{observaciones.length}</div>
          </button>
          <button type="button" onClick={() => { setEstadoObservacion('ABIERTA'); setPage(1); }} className="card" style={{ padding: 14, textAlign: 'left', borderColor: estadoObservacion === 'ABIERTA' ? 'rgba(212,175,55,0.65)' : undefined }}>
            <div className="info-item-label">Abiertas</div>
            <div className="info-item-value">{abiertas}</div>
          </button>
          <button type="button" onClick={() => { setEstadoObservacion('SIN_RESPUESTA'); setPage(1); }} className="card" style={{ padding: 14, textAlign: 'left', borderColor: estadoObservacion === 'SIN_RESPUESTA' ? 'rgba(245,158,11,0.65)' : undefined }}>
            <div className="info-item-label">Sin respuesta</div>
            <div className="info-item-value">{pendientesRespuesta}</div>
          </button>
          <button type="button" onClick={() => { setEstadoObservacion('RESPONDIDA'); setPage(1); }} className="card" style={{ padding: 14, textAlign: 'left', borderColor: estadoObservacion === 'RESPONDIDA' ? 'rgba(59,130,246,0.45)' : undefined }}>
            <div className="info-item-label">Respondidas</div>
            <div className="info-item-value">{respondidas}</div>
          </button>
          <button type="button" onClick={() => { setEstadoObservacion('CERRADA'); setPage(1); }} className="card" style={{ padding: 14, textAlign: 'left', borderColor: estadoObservacion === 'CERRADA' ? 'rgba(22,163,74,0.45)' : undefined }}>
            <div className="info-item-label">Cerradas</div>
            <div className="info-item-value">{cerradas}</div>
          </button>
          <div className="card" style={{ padding: 14 }}>
            <label className="label-upper">Estado observacion</label>
            <select value={estadoObservacion} onChange={e => { setEstadoObservacion(e.target.value); setPage(1); }} className="select-field" style={{ width: '100%', marginTop: 6 }}>
              <option value="">Todas</option>
              <option value="ABIERTA">Abiertas</option>
              <option value="SIN_RESPUESTA">Sin respuesta</option>
              <option value="RESPONDIDA">Respondidas</option>
              <option value="CERRADA">Cerradas</option>
            </select>
          </div>
        </div>
      )}

      {clienteId && usuario?.rol === 'oficial_cumplimiento' && (
        <div className="card" style={{ padding: 20, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
          <MessageSquare className="h-5 w-5" style={{ color: 'var(--accent-gold)' }} />
          <input
            className="input-field"
            style={{ flex: 1 }}
            placeholder="Escriba una nueva observación..."
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && crear()}
          />
          <button onClick={crear} className="btn-primary">
            <Send className="h-4 w-4" /> Crear
          </button>
        </div>
      )}

      {loading && <p style={{ color: 'var(--text-muted)', padding: 24 }}>Cargando observaciones...</p>}

      {!clienteId && (
        <EmptyState
          icon={MessageSquare}
          title="Selecciona un expediente con observaciones"
          message="Usa el buscador superior para ver observaciones abiertas, respuestas pendientes y cierres del expediente."
        />
      )}

      {!loading && observaciones.length === 0 && clienteId && (
        <EmptyState
          icon={MessageSquare}
          title="Sin observaciones registradas"
          message={usuario?.rol === 'oficial_cumplimiento' ? 'Puedes crear la primera observacion para solicitar correcciones o aclaraciones al empleado.' : 'Este expediente no tiene observaciones pendientes por responder.'}
        />
      )}

      {!loading && observaciones.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Respuesta</th>
                <th>Estado</th>
                <th>Creada por</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {observacionesFiltradas.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={MessageSquare}
                      title="Sin observaciones para este filtro"
                      message="Cambia entre sin respuesta, respondidas, abiertas, cerradas o todas para revisar el historial completo del expediente."
                    />
                  </td>
                </tr>
              )}
              {observacionesPaginadas.map((row) => (
                (() => {
                  const estadoOperativo = estadoOperativoObservacion(row);
                  const estadoLabel = estadoOperativo === 'SIN_RESPUESTA' ? 'ABIERTA' : estadoOperativo;
                  const estadoTone = estadoOperativo === 'CERRADA'
                    ? { bg: 'rgba(22,163,74,0.1)', color: '#16A34A', border: 'rgba(22,163,74,0.2)', icon: Lock }
                    : estadoOperativo === 'RESPONDIDA'
                      ? { bg: 'rgba(59,130,246,0.1)', color: '#2563EB', border: 'rgba(59,130,246,0.22)', icon: CheckCircle2 }
                      : { bg: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: 'rgba(212,175,55,0.2)', icon: Unlock };
                  const EstadoIcon = estadoTone.icon;
                  return (
                <tr key={row.id}>
                  <td style={{ maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.descripcion}</td>
                  <td style={{ maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word', color: row.respuesta ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                    {row.respuesta || '—'}
                  </td>
                  <td>
                    <span className="badge" style={{
                      backgroundColor: estadoTone.bg,
                      color: estadoTone.color,
                      border: `1px solid ${estadoTone.border}`
                    }}>
                      <EstadoIcon className="h-3 w-3" />
                      {estadoLabel}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/10 text-gold">
                        <User className="h-3 w-3" />
                      </div>
                      <span style={{ fontSize: 13 }}>{row.creada_por}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {usuario.rol === 'empleado' && row.estado === 'ABIERTA' && !row.respuesta && (
                        <button onClick={() => abrirRespuesta(row)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                          <Send className="h-3 w-3" /> Responder
                        </button>
                      )}
                      {usuario.rol === 'oficial_cumplimiento' && row.estado === 'ABIERTA' && row.respuesta && (
                        <button onClick={() => abrirCierre(row)} className="btn-success" style={{ padding: '6px 12px', fontSize: 12 }}>
                          <CheckCircle2 className="h-3 w-3" /> Cerrar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                  );
                })()
              ))}
            </tbody>
          </table>
          <PaginationControls
            page={page}
            pageSize={pageSize}
            total={observacionesFiltradas.length}
            onPageChange={setPage}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
          />
        </div>
      )}
      <DecisionModal
        open={Boolean(decision)}
        title={decision?.title}
        description={decision?.description}
        actionLabel={decision?.actionLabel}
        tone={decision?.tone}
        requireReason={decision?.requireReason ?? true}
        reasonLabel={decision?.type === 'cerrar' ? 'Motivo' : 'Respuesta'}
        reasonPlaceholder={decision?.type === 'cerrar' ? 'Motivo opcional de cierre...' : 'Indica como se atendio la observacion...'}
        confirmText={decision?.confirmText}
        confirmHelp={decision?.confirmHelp || 'La respuesta quedara disponible para que el Oficial pueda cerrar o mantener abierta la observacion.'}
        checklist={decision?.checklist}
        details={decision?.observacion ? [
          { label: 'Observacion', value: decision.observacion.descripcion },
          { label: 'Respuesta', value: decision.observacion.respuesta || 'Pendiente' },
          { label: 'Estado actual', value: decision.observacion.estado },
          { label: 'Creada por', value: decision.observacion.creada_por }
        ] : []}
        onClose={() => setDecision(null)}
        onConfirm={confirmarRespuesta}
      />
    </div>
  );
}
