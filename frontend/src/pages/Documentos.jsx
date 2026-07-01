import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import EstadoBadge from '../components/EstadoBadge';
import ClienteSelector from '../components/ClienteSelector';
import EmptyState from '../components/EmptyState';
import PaginationControls from '../components/PaginationControls';
import AIAssistantPanel from '../components/AIAssistantPanel';
import DecisionModal from '../components/DecisionModal';
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, Paperclip, FileText, Bot, Eye, ChevronLeft, ChevronRight, X, ListChecks, Lock, RotateCcw } from 'lucide-react';
import { pageCountFor, paginate } from '../utils/pagination';
import { documentosParaTipoCliente, estadoRequisitoDocumento, etiquetaDocumento } from '../utils/documentosCatalog';

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
  const [uploadPreview, setUploadPreview] = useState({ url: '', type: '', name: '' });
  const [reemplazo, setReemplazo] = useState(null);

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
  const requisitosDocumento = useMemo(
    () => documentosParaTipoCliente(clienteSeleccionado?.tipo_cliente || 'NATURAL')
      .map((requisito) => ({ ...requisito, state: estadoRequisitoDocumento(requisito, docs) })),
    [clienteSeleccionado?.tipo_cliente, docs]
  );
  const opcionesDocumento = useMemo(
    () => requisitosDocumento.filter((requisito) => requisito.repeatable || !requisito.state.complete),
    [requisitosDocumento]
  );
  const obligatorios = useMemo(
    () => requisitosDocumento.filter((requisito) => requisito.requirement === 'OBLIGATORIO'),
    [requisitosDocumento]
  );
  const obligatoriosCubiertos = obligatorios.filter((requisito) => requisito.state.complete).length;
  const bloqueosDocumentales = requisitosDocumento.filter((requisito) => requisito.state.blocking).length;
  const docsPaginados = paginate(docs, page, pageSize);

  useEffect(() => {
    if (opcionesDocumento.length && !opcionesDocumento.some(({ value }) => value === tipo)) {
      setTipo(opcionesDocumento[0].value);
    }
  }, [clienteSeleccionado?.tipo_cliente, opcionesDocumento, tipo]);

  useEffect(() => {
    const totalPages = pageCountFor(docs, pageSize);
    if (page > totalPages) setPage(totalPages);
  }, [docs, page, pageSize]);

  useEffect(() => () => {
    if (preview.url) URL.revokeObjectURL(preview.url);
  }, [preview.url]);

  useEffect(() => () => {
    if (uploadPreview.url) URL.revokeObjectURL(uploadPreview.url);
  }, [uploadPreview.url]);

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
    formData.append('archivo', archivoSeleccionado);
    if (reemplazo?.doc) {
      if (!reemplazo.motivo?.trim()) return showError('Indique el motivo del reemplazo');
      formData.append('motivo', reemplazo.motivo.trim());
    } else {
      formData.append('tipo_documento', tipo);
    }
    try {
      setSubiendo(true);
      if (reemplazo?.doc) {
        await api.post(`/clientes/documentos/${reemplazo.doc.id_documento}/reemplazar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post(`/clientes/${clienteId}/documentos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      await cargarDocs(clienteId);
      setArchivo(null);
      setReemplazo(null);
      setUploadPreview(prev => {
        if (prev.url) URL.revokeObjectURL(prev.url);
        return { url: '', type: '', name: '' };
      });
      if (archivoInputRef.current) archivoInputRef.current.value = '';
      showMensaje(reemplazo?.doc ? 'Documento reemplazado con trazabilidad' : 'Documento subido correctamente');
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
  const tipoSeleccionadoConfig = requisitosDocumento.find((requisito) => requisito.value === tipo);
  const tipoNoRepetibleCubierto = tipoSeleccionadoConfig && !tipoSeleccionadoConfig.repeatable && tipoSeleccionadoConfig.state.complete;
  const opcionesCarga = reemplazo?.requisito ? [reemplazo.requisito] : opcionesDocumento;

  const seleccionarArchivo = (file) => {
    setArchivo(file || null);
    setUploadPreview(prev => {
      if (prev.url) URL.revokeObjectURL(prev.url);
      if (!file) return { url: '', type: '', name: '' };
      return { url: URL.createObjectURL(file), type: file.type || '', name: file.name };
    });
  };

  const seleccionarRequisito = (value) => {
    setReemplazo(null);
    setTipo(value);
    document.getElementById('document-upload-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const iniciarReemplazo = (requisito) => {
    if (!requisito?.state?.latest) return;
    setTipo(requisito.value);
    setReemplazo({ requisito, doc: requisito.state.latest, motivo: '' });
    seleccionarArchivo(null);
    if (archivoInputRef.current) archivoInputRef.current.value = '';
    document.getElementById('document-upload-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

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

      {clienteSeleccionado && (
        <section className="card" style={{ padding: 22, marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div className="label-upper" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ListChecks className="h-4 w-4 text-gold" /> Checklist documental
              </div>
              <h2 style={{ marginTop: 6, fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>
                {obligatoriosCubiertos}/{obligatorios.length} obligatorios cubiertos
              </h2>
              <p style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 13 }}>
                Primero completa los obligatorios. Los no repetibles desaparecen de la subida normal cuando ya estan cubiertos; si hace falta cambiarlos, usa reemplazo auditado.
              </p>
            </div>
            <div className={`rounded-xl border px-4 py-3 text-sm font-black ${bloqueosDocumentales ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {bloqueosDocumentales ? `${bloqueosDocumentales} bloqueo(s) documental(es)` : 'Documentacion base completa'}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {requisitosDocumento.map((requisito) => (
              <DocumentRequirementCard
                key={requisito.value}
                requisito={requisito}
                active={tipo === requisito.value}
                puedeSubir={puedeSubir}
                onSelect={() => seleccionarRequisito(requisito.value)}
                onReplace={() => iniciarReemplazo(requisito)}
                onView={() => {
                  const index = docs.findIndex((doc) => doc.id_documento === requisito.state.latest?.id_documento);
                  if (index >= 0) cargarPreview(index);
                }}
              />
            ))}
          </div>
        </section>
      )}

      {clienteSeleccionado && puedeSubir && (
        <div id="document-upload-panel" className="card" style={{ padding: 24, marginTop: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
            <div>
              <div className="label-upper">{reemplazo ? 'Reemplazo auditado' : 'Subida guiada'}</div>
              <h2 style={{ marginTop: 4, fontSize: 19, fontWeight: 900, color: 'var(--text-primary)' }}>
                {reemplazo ? 'Reemplaza el soporte sin perder trazabilidad' : 'Confirma requisito y archivo antes de cargar'}
              </h2>
              <p style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 13 }}>
                {reemplazo
                  ? 'El documento anterior quedara marcado como REEMPLAZADO y el nuevo entrara a validacion.'
                  : 'El OCR/IA comparara el tipo declarado contra el contenido. Nada queda aprobado solo por subirlo.'}
              </p>
            </div>
            {tipoSeleccionadoConfig && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" style={{ maxWidth: 420 }}>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">{tipoSeleccionadoConfig.requirement}</div>
                <div className="mt-1 font-black text-slate-950">{tipoSeleccionadoConfig.label}</div>
                <div className="mt-1 text-sm font-semibold text-slate-500">{tipoSeleccionadoConfig.description}</div>
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) minmax(260px, 1fr)', gap: 16 }}>
            <div>
              <label className="label-upper">Requisito documental</label>
              <select name="tipo_documento" value={tipo} onChange={e => setTipo(e.target.value)} disabled={!!reemplazo} className="select-field" style={{ width: '100%', opacity: reemplazo ? 0.75 : 1 }}>
                {opcionesCarga.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label} · {opcion.requirement.toLowerCase()}{opcion.repeatable ? ' · repetible' : ''}
                  </option>
                ))}
              </select>
              {tipoSeleccionadoConfig?.fills?.length > 0 && (
                <div style={{ marginTop: 10, color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>
                  Puede ayudar a prellenar: {tipoSeleccionadoConfig.fills.join(', ')}.
                </div>
              )}
              {tipoNoRepetibleCubierto && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
                  Este requisito ya esta cubierto. Para cambiarlo debe registrarse como reemplazo auditado.
                </div>
              )}
              {reemplazo && (
                <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3">
                  <div className="text-xs font-black uppercase tracking-widest text-blue-500">Documento actual</div>
                  <div className="mt-1 text-sm font-black text-blue-900">{reemplazo.doc.nombre_archivo}</div>
                  <label className="mt-3 block">
                    <span className="text-xs font-black uppercase tracking-widest text-blue-500">Motivo obligatorio</span>
                    <textarea
                      value={reemplazo.motivo}
                      onChange={(event) => setReemplazo(prev => ({ ...prev, motivo: event.target.value }))}
                      className="mt-2 min-h-24 w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                      placeholder="Ej: se subio el archivo equivocado, documento vencido, se recibio version actualizada..."
                    />
                  </label>
                  <button type="button" onClick={() => setReemplazo(null)} className="btn-secondary mt-3" style={{ padding: '7px 10px', fontSize: 12 }}>
                    Cancelar reemplazo
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="label-upper">Archivo (PDF/JPG/PNG, max 10MB)</label>
              <input ref={archivoInputRef} name="archivo_upload" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => seleccionarArchivo(e.target.files?.[0] || null)} className="input-field" style={{ padding: 10 }} />
              <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 12 }}>
                Revisa la vista previa para evitar cargar una cedula donde iba un soporte de ingresos, o viceversa.
              </p>
            </div>
          </div>

          {archivo && (
            <UploadPreviewCard
              file={archivo}
              preview={uploadPreview}
              requisito={tipoSeleccionadoConfig}
              onClear={() => {
                seleccionarArchivo(null);
                if (archivoInputRef.current) archivoInputRef.current.value = '';
              }}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
            <button
              onClick={subir}
              disabled={subiendo || !archivo || (!reemplazo && tipoNoRepetibleCubierto) || (reemplazo && !reemplazo.motivo?.trim())}
              className="btn-primary"
              style={{ padding: '12px 20px', fontSize: 14, opacity: (subiendo || !archivo || (!reemplazo && tipoNoRepetibleCubierto) || (reemplazo && !reemplazo.motivo?.trim())) ? 0.65 : 1 }}
            >
              <Upload className="h-4 w-4" /> {subiendo ? 'Procesando...' : reemplazo ? 'Confirmar reemplazo' : 'Confirmar y subir'}
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
                <td style={{ color: 'var(--text-secondary)' }}>{etiquetaDocumento(d.tipo_documento)}</td>
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

function DocumentRequirementCard({ requisito, active, puedeSubir, onSelect, onReplace, onView }) {
  const tone = {
    CUBIERTO: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    FALTANTE: 'border-amber-200 bg-amber-50 text-amber-700',
    PENDIENTE: 'border-blue-200 bg-blue-50 text-blue-700',
    OBSERVADO: 'border-violet-200 bg-violet-50 text-violet-700',
    RECHAZADO: 'border-rose-200 bg-rose-50 text-rose-700',
    DISPONIBLE: 'border-slate-200 bg-slate-50 text-slate-500',
  }[requisito.state.status] || 'border-slate-200 bg-slate-50 text-slate-500';
  const canUpload = puedeSubir && (requisito.repeatable || !requisito.state.complete);
  const canReplace = puedeSubir && !requisito.repeatable && requisito.state.complete && requisito.state.latest;

  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition ${active ? 'border-teal-300 bg-teal-50/60 ring-2 ring-teal-100' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-lg border px-2 py-1 text-[11px] font-black uppercase tracking-widest ${tone}`}>
              {requisito.state.label}
            </span>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-black uppercase tracking-widest text-slate-500">
              {requisito.requirement}
            </span>
          </div>
          <h3 className="mt-3 text-base font-black text-slate-950">{requisito.label}</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{requisito.description}</p>
        </div>
        {requisito.repeatable ? (
          <RotateCcw className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <Lock className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="text-xs font-bold text-slate-400">
          {requisito.repeatable ? `${requisito.state.docs.length} archivo(s)` : requisito.state.latest ? 'No repetible' : 'Pendiente de archivo'}
        </div>
        <div className="flex flex-wrap gap-2">
          {requisito.state.latest && (
            <button type="button" onClick={onView} className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }}>
              <Eye className="h-3.5 w-3.5" /> Ver
            </button>
          )}
          {canUpload && (
            <button type="button" onClick={onSelect} className={active ? 'btn-primary' : 'btn-secondary'} style={{ padding: '6px 10px', fontSize: 12 }}>
              {requisito.state.latest ? 'Agregar' : 'Subir'}
            </button>
          )}
          {canReplace && (
            <button type="button" onClick={onReplace} className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }}>
              Reemplazar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadPreviewCard({ file, preview, requisito, onClear }) {
  const isImage = preview.type.startsWith('image/');
  const isPdf = preview.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Previsualizacion antes de subir</p>
          <h3 className="mt-1 text-sm font-black text-slate-950">{file.name}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Se cargara como {requisito?.label || 'documento'} · {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <button type="button" onClick={onClear} className="btn-secondary" style={{ padding: '7px 10px', fontSize: 12 }}>
          Quitar archivo
        </button>
      </div>
      <div className="flex min-h-[260px] items-center justify-center p-4">
        {preview.url && isImage && (
          <img src={preview.url} alt={file.name} className="max-h-[360px] max-w-full rounded-xl bg-white object-contain shadow-sm" />
        )}
        {preview.url && isPdf && (
          <iframe title={file.name} src={preview.url} className="h-[360px] w-full rounded-xl border border-slate-200 bg-white shadow-sm" />
        )}
        {preview.url && !isImage && !isPdf && (
          <div className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm">
            Este formato se puede subir, pero no tiene vista previa integrada.
          </div>
        )}
      </div>
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
