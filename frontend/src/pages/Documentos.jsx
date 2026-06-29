import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import EstadoBadge from '../components/EstadoBadge';
import ClienteSelector from '../components/ClienteSelector';
import EmptyState from '../components/EmptyState';
import PaginationControls from '../components/PaginationControls';
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, Paperclip, FileText } from 'lucide-react';
import { pageCountFor, paginate } from '../utils/pagination';

const DOCUMENTOS_NATURAL = [
  ['DOCUMENTO_IDENTIDAD', 'Documento de identidad'],
  ['COMPROBANTE_INGRESOS', 'Comprobante de ingresos'],
  ['COMPROBANTE_RESIDENCIA', 'Comprobante de residencia'],
  ['CARTA_REFERENCIA_BANCARIA', 'Carta referencia bancaria'],
  ['DECLARACION_ORIGEN_FONDOS', 'Declaracion origen de fondos']
];

const DOCUMENTOS_JURIDICA = [
  ['AVISO_OPERACION', 'Aviso de operacion'],
  ['CERTIFICADO_EXISTENCIA', 'Certificado de existencia'],
  ['IDENTIFICACION_REPRESENTANTE', 'Identificacion representante'],
  ['IDENTIFICACION_BENEFICIARIOS', 'Identificacion beneficiarios'],
  ['DECLARACION_ORIGEN_FONDOS', 'Declaracion origen de fondos']
];

export default function Documentos() {
  const params = useParams();
  const urlId = params.id;
  const { usuario } = useAuth();

  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(urlId || '');
  const [tipoCliente, setTipoCliente] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [riesgoFiltro, setRiesgoFiltro] = useState('');
  const [estadoDocumentoTrabajo, setEstadoDocumentoTrabajo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [docs, setDocs] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [tipo, setTipo] = useState('DOCUMENTO_IDENTIDAD');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargarClientes = async (estadoDocumento = estadoDocumentoTrabajo, tipo = tipoCliente) => {
    if (estadoDocumento) {
      const params = new URLSearchParams();
      params.append('estado_documento', estadoDocumento);
      if (tipo) params.append('tipo', tipo);
      const res = await api.get(`/clientes/con-documentos?${params.toString()}`);
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
    setDocs([]);
    setPage(1);
    cargarClientes(estadoDocumentoTrabajo, tipoCliente);
  }, [estadoDocumentoTrabajo]);

  useEffect(() => {
    if (clienteId) cargarDocs(clienteId);
  }, [clienteId]);

  useEffect(() => {
    if (urlId) setClienteId(urlId);
  }, [urlId]);

  const clienteSeleccionado = clientes.find(c => c.id_cliente === clienteId);
  const opcionesDocumento = clienteSeleccionado?.tipo_cliente === 'JURIDICA' ? DOCUMENTOS_JURIDICA : DOCUMENTOS_NATURAL;
  const docsPaginados = paginate(docs, page, pageSize);

  useEffect(() => {
    if (!opcionesDocumento.some(([value]) => value === tipo)) {
      setTipo(opcionesDocumento[0][0]);
    }
  }, [clienteSeleccionado?.tipo_cliente, opcionesDocumento, tipo]);

  useEffect(() => {
    const totalPages = pageCountFor(docs, pageSize);
    if (page > totalPages) setPage(totalPages);
  }, [docs, page, pageSize]);

  const showMensaje = (text) => { setMensaje(text); setTimeout(() => setMensaje(''), 4000); };
  const showError = (text) => { setError(text); setTimeout(() => setError(''), 6000); };

  const cargarDocs = async (id) => {
    if (!id) return;
    try {
      const res = await api.get(`/clientes/${id}/documentos`);
      setDocs(res.data || []);
    } catch {
      setDocs([]);
    }
  };

  const subir = async () => {
    if (!clienteId || !archivo) return showError('Seleccione cliente y archivo');
    const formData = new FormData();
    formData.append('tipo_documento', tipo);
    formData.append('archivo', archivo);
    try {
      await api.post(`/clientes/${clienteId}/documentos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setArchivo(null);
      showMensaje('Documento subido correctamente');
      cargarDocs(clienteId);
    } catch (err) {
      showError(err.response?.data?.detail || 'Error al subir documento');
    }
  };

  const verificar = async (docId) => {
    try {
      await api.patch(`/clientes/documentos/${docId}/verificar`);
      showMensaje('Documento verificado');
      cargarDocs(clienteId);
    } catch {
      showError('Error al verificar documento');
    }
  };

  const rechazar = async (docId) => {
    const motivo = prompt('Motivo de rechazo');
    if (!motivo) return;
    try {
      await api.patch(`/clientes/documentos/${docId}/rechazar?motivo=${encodeURIComponent(motivo)}`);
      showMensaje('Documento rechazado');
      cargarDocs(clienteId);
    } catch {
      showError('Error al rechazar documento');
    }
  };

  const descargar = async (docId, nombre) => {
    try {
      const res = await api.get(`/clientes/documentos/${docId}/descargar`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre || 'documento';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      showError('Error al descargar documento');
    }
  };

  const puedeVerificar = ['oficial_cumplimiento', 'admin'].includes(usuario?.rol);
  const puedeSubir = ['empleado', 'admin'].includes(usuario?.rol);

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Documentos</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Gestión de documentos de expedientes</p>
      </div>

      {mensaje && (
        <div className="success-banner" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <AlertCircle className="h-4 w-4" />
          {mensaje}
        </div>
      )}
      {error && (
        <div className="error-banner" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="card" style={{ padding: 16, marginTop: 22, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div>
          <div className="label-upper">Filtro de trabajo</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Encuentra expedientes por estado de sus documentos.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setEstadoDocumentoTrabajo('')} className={estadoDocumentoTrabajo === '' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '9px 14px', fontSize: 12 }}>Todos</button>
          <button type="button" onClick={() => setEstadoDocumentoTrabajo('PENDIENTE_VERIFICACION')} className={estadoDocumentoTrabajo === 'PENDIENTE_VERIFICACION' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '9px 14px', fontSize: 12 }}>Pendientes</button>
          <button type="button" onClick={() => setEstadoDocumentoTrabajo('OBSERVADO')} className={estadoDocumentoTrabajo === 'OBSERVADO' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '9px 14px', fontSize: 12 }}>Observados</button>
          <button type="button" onClick={() => setEstadoDocumentoTrabajo('RECHAZADO')} className={estadoDocumentoTrabajo === 'RECHAZADO' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '9px 14px', fontSize: 12 }}>Rechazados</button>
          <button type="button" onClick={() => setEstadoDocumentoTrabajo('VALIDADO_AUTOMATICO')} className={estadoDocumentoTrabajo === 'VALIDADO_AUTOMATICO' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '9px 14px', fontSize: 12 }}>Validados</button>
        </div>
      </div>

      <ClienteSelector
        clientes={clientes}
        value={clienteId}
        onChange={(id) => { setClienteId(id); setDocs([]); setPage(1); }}
        tipo={tipoCliente}
        onTipoChange={(value) => { setTipoCliente(value); setClienteId(''); setDocs([]); setPage(1); cargarClientes(estadoDocumentoTrabajo, value); }}
        estado={estadoFiltro}
        onEstadoChange={(value) => { setEstadoFiltro(value); setClienteId(''); setDocs([]); setPage(1); }}
        riesgo={riesgoFiltro}
        onRiesgoChange={(value) => { setRiesgoFiltro(value); setClienteId(''); setDocs([]); setPage(1); }}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        title={puedeSubir ? 'Seleccionar expediente para carga documental' : 'Seleccionar expediente para revision documental'}
        description={puedeSubir ? 'Busca el cliente y sube documentos para iniciar validacion automatica.' : 'Busca casos por estado o riesgo para revisar documentos observados o pendientes.'}
      />

      {clienteSeleccionado && puedeSubir && (
        <div className="card" style={{ padding: 24, marginTop: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="label-upper">Tipo de documento</label>
            <select name="tipo_documento" value={tipo} onChange={e => setTipo(e.target.value)} className="select-field" style={{ width: '100%' }}>
              <option value="DOCUMENTO_IDENTIDAD">Documento de identidad</option>
              <option value="COMPROBANTE_INGRESOS">Comprobante de ingresos</option>
              <option value="COMPROBANTE_RESIDENCIA">Comprobante de residencia</option>
              <option value="CARTA_REFERENCIA_BANCARIA">Carta referencia bancaria</option>
              <option value="DECLARACION_ORIGEN_FONDOS">Declaración origen de fondos</option>
              <option value="AVISO_OPERACION">Aviso de operación</option>
              <option value="CERTIFICADO_EXISTENCIA">Certificado de existencia</option>
              <option value="IDENTIFICACION_REPRESENTANTE">Identificación representante</option>
              <option value="IDENTIFICACION_BENEFICIARIOS">Identificación beneficiarios</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="label-upper">Archivo (PDF/JPG/PNG, máx 10MB)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setArchivo(e.target.files[0])} className="input-field" style={{ padding: 10 }} />
          </div>
          <button onClick={subir} className="btn-primary" style={{ padding: '12px 20px', fontSize: 14 }}>
            <Upload className="h-4 w-4" /> Subir documento
          </button>
          </div>
        </div>
      )}

      {!clienteId && (
        <EmptyState
          icon={FileText}
          title={puedeSubir ? 'Selecciona un expediente para cargar documentos' : 'Selecciona un expediente para revisar documentos'}
          message={puedeSubir ? 'La carga documental inicia el motor de reglas y deja trazabilidad automatica.' : 'El Oficial solo debe revisar documentos observados, pendientes o rechazados.'}
        />
      )}

      {clienteId && (
      <div className="table-container" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>Archivo</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Validacion</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {docsPaginados.map(d => (
              <tr key={d.id_documento}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
                      <Paperclip className="h-4 w-4" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{d.nombre_archivo}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{d.formato}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{d.tipo_documento}</td>
                <td><EstadoBadge estado={d.estado} /></td>
                <td style={{ maxWidth: 260 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{d.confianza_validacion || 'Pendiente'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {d.resumen_validacion || 'Sin evaluacion automatica registrada'}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => descargar(d.id_documento, d.nombre_archivo)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                      <Download className="h-3.5 w-3.5" /> Descargar
                    </button>
                    {puedeVerificar && ['PENDIENTE_VERIFICACION', 'OBSERVADO'].includes(d.estado) && (
                      <>
                        <button onClick={() => verificar(d.id_documento)} className="btn-success" style={{ padding: '6px 12px', fontSize: 12 }}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
                        </button>
                        <button onClick={() => rechazar(d.id_documento)} className="btn-danger" style={{ padding: '6px 12px', fontSize: 12 }}>
                          <XCircle className="h-3.5 w-3.5" /> Rechazar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={FileText}
                    title="Sin documentos registrados"
                    message={puedeSubir ? 'Este expediente aun no tiene documentos. Sube el primero para iniciar la validacion automatica.' : 'Este expediente aun no tiene documentos cargados. No hay nada que validar.'}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={docs.length}
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
