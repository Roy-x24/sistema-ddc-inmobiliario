import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import EstadoBadge from '../components/EstadoBadge';
import ClienteSelector from '../components/ClienteSelector';
import EmptyState from '../components/EmptyState';
import PaginationControls from '../components/PaginationControls';
import AIAssistantPanel from '../components/AIAssistantPanel';
import DecisionModal from '../components/DecisionModal';
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, Paperclip, FileText, Bot, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
  const [extracciones, setExtracciones] = useState({});
  const [archivo, setArchivo] = useState(null);
  const archivoInputRef = useRef(null);
  const [tipo, setTipo] = useState('DOCUMENTO_IDENTIDAD');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [decision, setDecision] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [preview, setPreview] = useState({ open: false, index: 0, url: '', type: '', loading: false, error: '' });

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

  useEffect(() => () => {
    if (preview.url) URL.revokeObjectURL(preview.url);
  }, [preview.url]);

  const showMensaje = (text) => { setMensaje(text); setTimeout(() => setMensaje(''), 4000); };
  const showError = (text) => { setError(text); setTimeout(() => setError(''), 6000); };

  const cargarDocs = async (id) => {
    if (!id) return;
    try {
      const res = await api.get(`/clientes/${id}/documentos`);
      const lista = res.data || [];
      setDocs(lista);
      const pares = await Promise.all(lista.map(async (doc) => {
        try {
          const ext = await api.get(`/ai/documentos/${doc.id_documento}/extraccion`);
          return [doc.id_documento, ext.data];
        } catch {
          return [doc.id_documento, null];
        }
      }));
      setExtracciones(Object.fromEntries(pares.filter(([, value]) => value)));
    } catch {
      setDocs([]);
      setExtracciones({});
    }
  };

  const subir = async () => {
    const inputArchivo = archivoInputRef.current || document.querySelector('input[name="archivo_upload"]');
    const archivoSeleccionado = archivo || inputArchivo?.files?.[0];
    if (subiendo) return;
    if (!clienteId || !archivoSeleccionado) return showError('Seleccione cliente y archivo');
    const formData = new FormData();
    formData.append('tipo_documento', tipo);
    formData.append('archivo', archivoSeleccionado);
    try {
      setSubiendo(true);
      await api.post(`/clientes/${clienteId}/documentos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await cargarDocs(clienteId);
      setArchivo(null);
      if (archivoInputRef.current) archivoInputRef.current.value = '';
      showMensaje('Documento subido correctamente');
    } catch (err) {
      showError(err.response?.data?.detail || 'Error al subir documento');
    } finally {
      setSubiendo(false);
    }
  };

  const verificarDocumento = async (docId) => {
    try {
      await api.patch(`/clientes/documentos/${docId}/verificar`);
      showMensaje('Documento verificado');
      cargarDocs(clienteId);
    } catch {
      showError('Error al verificar documento');
    }
  };

  const rechazarDocumento = async (docId, motivo) => {
    try {
      await api.patch(`/clientes/documentos/${docId}/rechazar?motivo=${encodeURIComponent(motivo)}`);
      showMensaje('Documento rechazado');
      cargarDocs(clienteId);
    } catch {
      showError('Error al rechazar documento');
    }
  };

  const abrirDecisionDocumento = (type, doc) => {
    const baseDetails = [
      `Archivo: ${doc.nombre_archivo}`,
      `Tipo: ${doc.tipo_documento}`,
      `Estado actual: ${doc.estado}`,
      `Validacion: ${doc.confianza_validacion || 'Pendiente'}`,
    ];
    if (type === 'aprobar') {
      setDecision({
        type,
        doc,
        title: 'Aprobar documento',
        description: 'Confirma que revisaste el archivo y que la evidencia es legible, vigente y coincide con el expediente.',
        tone: 'success',
        actionLabel: 'Aprobar',
        confirmText: 'APROBAR',
        confirmHelp: 'Escribe APROBAR para dejar trazabilidad de la verificacion manual.',
        details: [
          ...baseDetails,
          `Efecto esperado: el documento quedara VERIFICADO_MANUAL y podra desbloquear requisitos del expediente.`,
        ],
      });
      return;
    }
    setDecision({
      type,
      doc,
      title: 'Rechazar documento',
      description: 'El rechazo debe explicar por que el documento no puede sustentar el expediente.',
      tone: 'danger',
      actionLabel: 'Rechazar',
      requireReason: true,
      reasonLabel: 'Motivo de rechazo',
      reasonPlaceholder: 'Ej: ilegible, vencido, datos no coinciden, documento incorrecto...',
      confirmText: 'RECHAZAR',
      confirmHelp: 'Escribe RECHAZAR para confirmar una decision que bloquea el requisito documental.',
      details: [
        ...baseDetails,
        `Efecto esperado: el documento quedara RECHAZADO y el expediente seguira bloqueado hasta correccion.`,
      ],
    });
  };

  const confirmarDecision = async ({ reason }) => {
    if (!decision?.doc) return;
    if (decision.type === 'aprobar') await verificarDocumento(decision.doc.id_documento);
    if (decision.type === 'rechazar') await rechazarDocumento(decision.doc.id_documento, reason);
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

  const cargarPreview = async (index) => {
    const doc = docs[index];
    if (!doc) return;
    setPreview(prev => {
      if (prev.url) URL.revokeObjectURL(prev.url);
      return { open: true, index, url: '', type: '', loading: true, error: '' };
    });
    try {
      const res = await api.get(`/clientes/documentos/${doc.id_documento}/ver`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      setPreview({ open: true, index, url, type: res.data.type || '', loading: false, error: '' });
    } catch {
      setPreview({ open: true, index, url: '', type: '', loading: false, error: 'No se pudo cargar la vista previa del documento.' });
    }
  };

  const cerrarPreview = () => {
    setPreview(prev => {
      if (prev.url) URL.revokeObjectURL(prev.url);
      return { open: false, index: 0, url: '', type: '', loading: false, error: '' };
    });
  };

  const moverPreview = (delta) => {
    if (!docs.length) return;
    const nextIndex = (preview.index + delta + docs.length) % docs.length;
    cargarPreview(nextIndex);
  };

  const extraerAI = async (docId) => {
    try {
      const res = await api.post(`/ai/documentos/${docId}/extraer`);
      setExtracciones(prev => ({ ...prev, [docId]: res.data }));
      showMensaje('Extracción OCR/IA actualizada');
    } catch {
      showError('No se pudo ejecutar la extracción IA');
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
            <input ref={archivoInputRef} name="archivo_upload" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setArchivo(e.target.files?.[0] || null)} className="input-field" style={{ padding: 10 }} />
          </div>
          <button onClick={subir} disabled={subiendo} className="btn-primary" style={{ padding: '12px 20px', fontSize: 14, opacity: subiendo ? 0.65 : 1 }}>
            <Upload className="h-4 w-4" /> {subiendo ? 'Subiendo...' : 'Subir documento'}
          </button>
          </div>
        </div>
      )}

      {clienteSeleccionado && puedeVerificar && (
        <div style={{ marginTop: 18 }}>
          <AIAssistantPanel
            clienteId={clienteId}
            tipoCliente={clienteSeleccionado.tipo_cliente}
            context="documentos"
            metadata={{
              estado: clienteSeleccionado.estado,
              riesgo: clienteSeleccionado.nivel_riesgo,
            }}
            title="Asistente IA documental"
          />
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
                  {extracciones[d.id_documento] && (
                    <div style={{ marginTop: 8, padding: 8, borderRadius: 10, background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.14)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontSize: 12, fontWeight: 900 }}>
                        <Bot className="h-3.5 w-3.5 text-gold" />
                        OCR/IA {Math.round((extracciones[d.id_documento].confidence || 0) * 100)}%
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                        {extracciones[d.id_documento].decision_suggestion?.reason}
                      </div>
                      <div style={{ display: 'grid', gap: 4, marginTop: 8 }}>
                        {(extracciones[d.id_documento].comparisons || []).slice(0, 3).map((item) => (
                          <div key={item.field} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11 }}>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 800 }}>{item.field}</span>
                            <span style={{ color: item.match ? '#16A34A' : '#DC2626', fontWeight: 900 }}>{item.match ? 'Coincide' : 'Revisar'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button onClick={() => cargarPreview(docs.findIndex(doc => doc.id_documento === d.id_documento))} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                      <Eye className="h-3.5 w-3.5" /> Ver
                    </button>
                    <button onClick={() => extraerAI(d.id_documento)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                      <Bot className="h-3.5 w-3.5" /> OCR/IA
                    </button>
                    <button onClick={() => descargar(d.id_documento, d.nombre_archivo)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                      <Download className="h-3.5 w-3.5" /> Descargar
                    </button>
                    {puedeVerificar && ['PENDIENTE_VERIFICACION', 'OBSERVADO'].includes(d.estado) && (
                      <>
                        <button onClick={() => abrirDecisionDocumento('aprobar', d)} className="btn-success" style={{ padding: '6px 12px', fontSize: 12 }}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
                        </button>
                        <button onClick={() => abrirDecisionDocumento('rechazar', d)} className="btn-danger" style={{ padding: '6px 12px', fontSize: 12 }}>
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
      <DecisionModal
        open={!!decision}
        title={decision?.title}
        description={decision?.description}
        actionLabel={decision?.actionLabel}
        tone={decision?.tone}
        requireReason={decision?.requireReason}
        reasonLabel={decision?.reasonLabel}
        reasonPlaceholder={decision?.reasonPlaceholder}
        confirmText={decision?.confirmText}
        details={decision?.details || []}
        onClose={() => setDecision(null)}
        onConfirm={confirmarDecision}
      />
      <DocumentPreviewModal
        preview={preview}
        docs={docs}
        onClose={cerrarPreview}
        onPrev={() => moverPreview(-1)}
        onNext={() => moverPreview(1)}
        onDownload={descargar}
      />
    </div>
  );
}

function DocumentPreviewModal({ preview, docs, onClose, onPrev, onNext, onDownload }) {
  if (!preview.open) return null;
  const doc = docs[preview.index];
  const isImage = preview.type.startsWith('image/');
  const isPdf = preview.type === 'application/pdf' || doc?.formato === 'PDF';
  const total = docs.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Vista previa de documento</p>
            <h2 className="mt-1 truncate text-lg font-black text-slate-950">{doc?.nombre_archivo || 'Documento'}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {doc?.tipo_documento || '-'} · {preview.index + 1} de {total}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {doc && (
              <button
                type="button"
                onClick={() => onDownload(doc.id_documento, doc.nombre_archivo)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 shadow-sm hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> Descargar
              </button>
            )}
            <button type="button" onClick={onClose} className="rounded-xl bg-slate-950 p-2 text-white hover:bg-slate-800" aria-label="Cerrar vista previa">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[44px_minmax(0,1fr)_44px] bg-slate-100">
          <button type="button" onClick={onPrev} disabled={total <= 1} className="flex items-center justify-center text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30" aria-label="Documento anterior">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex min-h-[62vh] items-center justify-center overflow-auto p-4">
            {preview.loading && <div className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm">Cargando vista previa...</div>}
            {preview.error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{preview.error}</div>}
            {!preview.loading && !preview.error && preview.url && isImage && (
              <img src={preview.url} alt={doc?.nombre_archivo || 'Documento'} className="max-h-[70vh] max-w-full rounded-xl bg-white object-contain shadow-lg" />
            )}
            {!preview.loading && !preview.error && preview.url && isPdf && (
              <iframe title={doc?.nombre_archivo || 'PDF'} src={preview.url} className="h-[70vh] w-full rounded-xl border border-slate-200 bg-white shadow-lg" />
            )}
            {!preview.loading && !preview.error && preview.url && !isImage && !isPdf && (
              <div className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm">
                Este formato no tiene vista previa integrada. Puedes descargarlo para revisarlo.
              </div>
            )}
          </div>
          <button type="button" onClick={onNext} disabled={total <= 1} className="flex items-center justify-center text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30" aria-label="Documento siguiente">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
