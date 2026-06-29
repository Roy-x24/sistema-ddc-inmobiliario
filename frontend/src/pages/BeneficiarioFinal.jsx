import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import ClienteSelector from '../components/ClienteSelector';
import EmptyState from '../components/EmptyState';
import PaginationControls from '../components/PaginationControls';
import { UserCheck, Plus, AlertCircle, CheckCircle2, XCircle, User, Flag } from 'lucide-react';
import { pageCountFor, paginate } from '../utils/pagination';

export default function BeneficiarioFinal() {
  const { id: urlId } = useParams();
  const { usuario } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(urlId || '');
  const [estadoCliente, setEstadoCliente] = useState('');
  const [riesgoCliente, setRiesgoCliente] = useState('');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [estadoBeneficiario, setEstadoBeneficiario] = useState('');
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nombre_completo: '',
    numero_documento: '',
    nacionalidad: '',
    porcentaje_participacion: '',
    tipo_control: 'directo',
    es_pep: false
  });

  const cargarClientes = async (estado = estadoBeneficiario) => {
    if (estado) {
      const res = await api.get(`/clientes/con-beneficiarios?estado_validacion=${estado}`);
      setClientes(res.data || []);
      return;
    }
    const res = await api.get('/clientes/?limit=9999');
    setClientes(res.data || []);
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  useEffect(() => {
    setClienteId('');
    setBeneficiarios([]);
    setPage(1);
    cargarClientes(estadoBeneficiario);
  }, [estadoBeneficiario]);

  useEffect(() => {
    if (!clienteId || clientes.length === 0) return;
    const cliente = clientes.find(c => c.id_cliente === clienteId);
    if (cliente?.tipo_cliente !== 'JURIDICA') {
      setClienteId('');
      setBeneficiarios([]);
      setPage(1);
      showError('Beneficiarios finales aplica solo para personas juridicas');
      return;
    }
    fetchBF(clienteId);
  }, [clienteId, clientes]);

  useEffect(() => {
    if (urlId) setClienteId(urlId);
  }, [urlId]);

  const showMensaje = (text) => { setMensaje(text); setTimeout(() => setMensaje(''), 4000); };
  const showError = (text) => { setError(text); setTimeout(() => setError(''), 6000); };

  const fetchBF = async (cid) => {
    setLoading(true);
    try {
      const res = await api.get(`/clientes/${cid}/beneficiarios`);
      setBeneficiarios(res.data || []);
    } catch {
      setBeneficiarios([]);
    } finally {
      setLoading(false);
    }
  };

  const agregar = async () => {
    if (!clienteId) return showError('Seleccione un cliente');
    try {
      await api.post(`/clientes/${clienteId}/beneficiarios`, {
        ...form,
        porcentaje_participacion: parseFloat(form.porcentaje_participacion)
      });
      setForm({ nombre_completo: '', numero_documento: '', nacionalidad: '', porcentaje_participacion: '', tipo_control: 'directo', es_pep: false });
      showMensaje('Beneficiario final registrado');
      fetchBF(clienteId);
    } catch (err) {
      showError(err.response?.data?.detail || 'Error al registrar beneficiario');
    }
  };

  const validar = async (bfId, accion) => {
    try {
      if (accion === 'aprobar') {
        await api.patch(`/clientes/beneficiarios/${bfId}/aprobar`);
        showMensaje('Beneficiario aprobado');
      } else {
        const motivo = prompt('Motivo de rechazo:');
        if (!motivo) return;
        await api.patch(`/clientes/beneficiarios/${bfId}/rechazar?motivo=${encodeURIComponent(motivo)}`);
        showMensaje('Beneficiario rechazado');
      }
      fetchBF(clienteId);
    } catch (err) {
      showError(err.response?.data?.detail || 'Error al validar beneficiario');
    }
  };

  const clientesJuridicos = clientes.filter(c => c.tipo_cliente === 'JURIDICA');
  const clienteSeleccionado = clientesJuridicos.find(c => c.id_cliente === clienteId);
  const beneficiariosFiltrados = beneficiarios.filter((row) => {
    if (estadoBeneficiario && row.estado_validacion !== estadoBeneficiario) return false;
    return true;
  });
  const beneficiariosPaginados = paginate(beneficiariosFiltrados, page, pageSize);
  const pendientes = beneficiarios.filter(row => row.estado_validacion === 'PENDIENTE').length;
  const aprobados = beneficiarios.filter(row => row.estado_validacion === 'APROBADO').length;
  const rechazados = beneficiarios.filter(row => row.estado_validacion === 'RECHAZADO').length;

  useEffect(() => {
    const totalPages = pageCountFor(beneficiariosFiltrados, pageSize);
    if (page > totalPages) setPage(totalPages);
  }, [beneficiariosFiltrados, page, pageSize]);

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Beneficiarios Finales</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Registro y validación de UBOs</p>
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
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Encuentra sociedades por estado de validacion de beneficiarios finales.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setEstadoBeneficiario('')} className={estadoBeneficiario === '' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '9px 14px', fontSize: 12 }}>Todos</button>
          <button type="button" onClick={() => setEstadoBeneficiario('PENDIENTE')} className={estadoBeneficiario === 'PENDIENTE' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '9px 14px', fontSize: 12 }}>Pendientes</button>
          <button type="button" onClick={() => setEstadoBeneficiario('APROBADO')} className={estadoBeneficiario === 'APROBADO' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '9px 14px', fontSize: 12 }}>Aprobados</button>
          <button type="button" onClick={() => setEstadoBeneficiario('RECHAZADO')} className={estadoBeneficiario === 'RECHAZADO' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '9px 14px', fontSize: 12 }}>Rechazados</button>
        </div>
      </div>

      <ClienteSelector
        clientes={clientesJuridicos}
        value={clienteId}
        onChange={(id) => { setClienteId(id); setPage(1); }}
        tipo=""
        onTipoChange={() => {}}
        estado={estadoCliente}
        onEstadoChange={(valor) => { setEstadoCliente(valor); setPage(1); }}
        riesgo={riesgoCliente}
        onRiesgoChange={(valor) => { setRiesgoCliente(valor); setPage(1); }}
        busqueda={busquedaCliente}
        onBusquedaChange={(valor) => { setBusquedaCliente(valor); setPage(1); }}
        title="Seleccionar expediente juridico"
        description="Busca sociedades por nombre, RUC, estado o riesgo para revisar sus beneficiarios finales."
        emptyText="No hay sociedades con esos filtros."
        showTipoFilter={false}
      />

      {clienteSeleccionado && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginTop: 16, marginBottom: 20 }}>
          <button type="button" onClick={() => { setEstadoBeneficiario(''); setPage(1); }} className="card" style={{ padding: 14, textAlign: 'left', borderColor: estadoBeneficiario === '' ? 'rgba(20,184,166,0.45)' : undefined }}>
            <div className="info-item-label">Registrados</div>
            <div className="info-item-value">{beneficiarios.length}</div>
          </button>
          <button type="button" onClick={() => { setEstadoBeneficiario('PENDIENTE'); setPage(1); }} className="card" style={{ padding: 14, textAlign: 'left', borderColor: estadoBeneficiario === 'PENDIENTE' ? 'rgba(212,175,55,0.65)' : undefined }}>
            <div className="info-item-label">Pendientes</div>
            <div className="info-item-value">{pendientes}</div>
          </button>
          <button type="button" onClick={() => { setEstadoBeneficiario('APROBADO'); setPage(1); }} className="card" style={{ padding: 14, textAlign: 'left', borderColor: estadoBeneficiario === 'APROBADO' ? 'rgba(22,163,74,0.45)' : undefined }}>
            <div className="info-item-label">Aprobados</div>
            <div className="info-item-value">{aprobados}</div>
          </button>
          <button type="button" onClick={() => { setEstadoBeneficiario('RECHAZADO'); setPage(1); }} className="card" style={{ padding: 14, textAlign: 'left', borderColor: estadoBeneficiario === 'RECHAZADO' ? 'rgba(220,38,38,0.45)' : undefined }}>
            <div className="info-item-label">Rechazados</div>
            <div className="info-item-value">{rechazados}</div>
          </button>
          <div className="card" style={{ padding: 14 }}>
            <label className="label-upper">Estado beneficiario</label>
            <select value={estadoBeneficiario} onChange={e => { setEstadoBeneficiario(e.target.value); setPage(1); }} className="select-field" style={{ width: '100%', marginTop: 6 }}>
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="APROBADO">Aprobados</option>
              <option value="RECHAZADO">Rechazados</option>
            </select>
          </div>
        </div>
      )}

      {clienteId && usuario?.rol === 'empleado' && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Nombre completo</label>
              <input value={form.nombre_completo} onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })} className="input-field" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Documento</label>
              <input value={form.numero_documento} onChange={(e) => setForm({ ...form, numero_documento: e.target.value })} className="input-field" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Nacionalidad</label>
              <input value={form.nacionalidad} onChange={(e) => setForm({ ...form, nacionalidad: e.target.value })} className="input-field" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>% Participación</label>
              <input type="number" value={form.porcentaje_participacion} onChange={(e) => setForm({ ...form, porcentaje_participacion: e.target.value })} className="input-field" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Tipo de control</label>
              <select className="select-field" style={{ width: '100%' }} value={form.tipo_control} onChange={(e) => setForm({ ...form, tipo_control: e.target.value })}>
                <option value="directo">Directo</option>
                <option value="indirecto">Indirecto</option>
                <option value="representacion">Representación</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', paddingBottom: 10 }}>
                <input type="checkbox" checked={form.es_pep} onChange={e => setForm({ ...form, es_pep: e.target.checked })} />
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Es PEP</span>
              </label>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button onClick={agregar} className="btn-primary">
              <Plus className="h-4 w-4" /> Agregar beneficiario final
            </button>
          </div>
        </div>
      )}

      {loading && <p style={{ color: 'var(--text-muted)', padding: 24 }}>Cargando beneficiarios...</p>}

      {!clienteId && (
        <EmptyState
          icon={UserCheck}
          title="Selecciona una sociedad"
          message="Usa el buscador superior para revisar, registrar o validar beneficiarios finales. Esta vista solo aplica a clientes juridicos."
        />
      )}

      {!loading && beneficiarios.length === 0 && clienteId && (
        <EmptyState
          icon={UserCheck}
          title="Sin beneficiarios finales"
          message={usuario?.rol === 'empleado' ? 'Registra el primer beneficiario final para completar el expediente juridico.' : 'Todavia no hay beneficiarios para validar en esta sociedad.'}
        />
      )}

      {!loading && beneficiarios.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>%</th>
                <th>Control</th>
                <th>PEP</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {beneficiariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={UserCheck}
                      title="Sin beneficiarios para este filtro"
                      message="Cambia entre pendientes, aprobados, rechazados o todos para revisar el expediente completo."
                    />
                  </td>
                </tr>
              )}
              {beneficiariosPaginados.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/10 text-gold">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span style={{ fontWeight: 600 }}>{row.nombre_completo}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{row.numero_documento}</td>
                  <td>{row.porcentaje_participacion}%</td>
                  <td><span className="badge" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}>{row.tipo_control}</span></td>
                  <td>{row.es_pep ? <span className="badge" style={{ backgroundColor: 'rgba(220,38,38,0.1)', color: '#F87171', border: '1px solid rgba(220,38,38,0.2)' }}><Flag className="h-3 w-3" /> PEP</span> : '—'}</td>
                  <td>
                    <span className="badge" style={{
                      backgroundColor: row.estado_validacion === 'APROBADO' ? 'rgba(22,163,74,0.1)' : row.estado_validacion === 'RECHAZADO' ? 'rgba(220,38,38,0.1)' : 'rgba(212,175,55,0.1)',
                      color: row.estado_validacion === 'APROBADO' ? '#16A34A' : row.estado_validacion === 'RECHAZADO' ? '#F87171' : '#D4AF37',
                      border: `1px solid ${row.estado_validacion === 'APROBADO' ? 'rgba(22,163,74,0.2)' : row.estado_validacion === 'RECHAZADO' ? 'rgba(220,38,38,0.2)' : 'rgba(212,175,55,0.2)'}`
                    }}>{row.estado_validacion}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {['oficial_cumplimiento', 'admin'].includes(usuario?.rol) && row.estado_validacion === 'PENDIENTE' ? (
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => validar(row.id, 'aprobar')} className="btn-success" style={{ padding: '6px 12px', fontSize: 12 }}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
                        </button>
                        <button onClick={() => validar(row.id, 'rechazar')} className="btn-danger" style={{ padding: '6px 12px', fontSize: 12 }}>
                          <XCircle className="h-3.5 w-3.5" /> Rechazar
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.validado_por || '—'}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControls
            page={page}
            pageSize={pageSize}
            total={beneficiariosFiltrados.length}
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
