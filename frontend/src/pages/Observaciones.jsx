import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import PaginationControls from '../components/PaginationControls';
import { MessageSquare, Send, Lock, Unlock, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { clienteOptionLabel, filtrarClientesPorTipo, tipoClienteBadgeClass, tipoClienteLabel } from '../utils/clientesUi';
import { pageCountFor, paginate } from '../utils/pagination';

export default function Observaciones() {
  const { id: urlId } = useParams();
  const { usuario } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(urlId || '');
  const [tipoCliente, setTipoCliente] = useState('');
  const [observaciones, setObservaciones] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [nueva, setNueva] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargarClientesConObservaciones = async (tipo = tipoCliente) => {
    const params = new URLSearchParams();
    if (tipo) params.append('tipo', tipo);
    const query = params.toString();
    const res = await api.get(`/clientes/con-observaciones${query ? `?${query}` : ''}`);
    setClientes(res.data || []);
  };

  useEffect(() => {
    cargarClientesConObservaciones();
  }, []);

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

  const responder = async (obsId) => {
    const resp = prompt('Respuesta:');
    if (!resp) return;
    try {
      await api.patch(`/clientes/observaciones/${obsId}/responder`, null, { params: { respuesta: resp } });
      showMensaje('Respuesta registrada');
      cargarClientesConObservaciones();
      fetchObs(clienteId);
    } catch {
      showError('Error al responder observación');
    }
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

  const clientesFiltrados = filtrarClientesPorTipo(clientes, tipoCliente);
  const clienteSeleccionado = clientes.find(c => c.id_cliente === clienteId);
  const observacionesPaginadas = paginate(observaciones, page, pageSize);

  useEffect(() => {
    const totalPages = pageCountFor(observaciones, pageSize);
    if (page > totalPages) setPage(totalPages);
  }, [observaciones, page, pageSize]);

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

      <div style={{ marginBottom: 20, marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ width: 220 }}>
          <label className="label-upper">Tipo de cliente</label>
          <select value={tipoCliente} onChange={e => { setTipoCliente(e.target.value); setClienteId(''); setObservaciones([]); setPage(1); cargarClientesConObservaciones(e.target.value); }} className="select-field" style={{ width: '100%' }}>
            <option value="">Todos</option>
            <option value="NATURAL">Persona natural</option>
            <option value="JURIDICA">Persona juridica</option>
          </select>
        </div>
        <div>
          <label className="label-upper">Cliente</label>
          <select value={clienteId} onChange={e => { setClienteId(e.target.value); setPage(1); }} className="select-field" style={{ minWidth: 320 }}>
            <option value="">Seleccione un cliente con observaciones</option>
            {clientesFiltrados.map(c => <option key={c.id_cliente} value={c.id_cliente}>{clienteOptionLabel(c)}</option>)}
          </select>
        </div>
        {clienteSeleccionado && (
          <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${tipoClienteBadgeClass(clienteSeleccionado.tipo_cliente)}`}>
            {tipoClienteLabel(clienteSeleccionado.tipo_cliente)}
          </span>
        )}
      </div>

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

      {!loading && observaciones.length === 0 && clienteId && (
        <div className="empty-state">
          <div className="empty-state-icon"><MessageSquare className="h-6 w-6" /></div>
          Sin observaciones registradas para este cliente.
        </div>
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
              {observacionesPaginadas.map((row) => (
                <tr key={row.id}>
                  <td style={{ maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.descripcion}</td>
                  <td style={{ maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word', color: row.respuesta ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                    {row.respuesta || '—'}
                  </td>
                  <td>
                    <span className="badge" style={{
                      backgroundColor: row.estado === 'ABIERTA' ? 'rgba(212,175,55,0.1)' : 'rgba(22,163,74,0.1)',
                      color: row.estado === 'ABIERTA' ? '#D4AF37' : '#16A34A',
                      border: `1px solid ${row.estado === 'ABIERTA' ? 'rgba(212,175,55,0.2)' : 'rgba(22,163,74,0.2)'}`
                    }}>
                      {row.estado === 'ABIERTA' ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {row.estado}
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
                        <button onClick={() => responder(row.id)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                          <Send className="h-3 w-3" /> Responder
                        </button>
                      )}
                      {usuario.rol === 'oficial_cumplimiento' && row.estado === 'ABIERTA' && row.respuesta && (
                        <button onClick={() => cerrar(row.id)} className="btn-success" style={{ padding: '6px 12px', fontSize: 12 }}>
                          <CheckCircle2 className="h-3 w-3" /> Cerrar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControls
            page={page}
            pageSize={pageSize}
            total={observaciones.length}
            onPageChange={setPage}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
}
