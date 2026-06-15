import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import EstadoBadge from '../components/EstadoBadge';
import Alerta from '../components/ui/Alerta';
import Boton from '../components/ui/Boton';
import Tabla from '../components/ui/Tabla';
import { Upload, Download, CheckCircle2, XCircle, Paperclip } from 'lucide-react';

export default function Documentos() {
  const params = useParams();
  const urlId = params.id;
  const { usuario } = useAuth();

  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(urlId || '');
  const [docs, setDocs] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [tipo, setTipo] = useState('DOCUMENTO_IDENTIDAD');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/clientes/?limit=9999').then(res => setClientes(res.data || []));
  }, []);

  useEffect(() => {
    if (clienteId) cargarDocs(clienteId);
  }, [clienteId]);

  useEffect(() => {
    if (urlId) setClienteId(urlId);
  }, [urlId]);

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

  const descargar = (docId, nombre) => {
    const base = api.defaults.baseURL || 'http://localhost:8000';
    const url = `${base}/clientes/documentos/${docId}/descargar`;
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre || 'documento';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const columns = [
    { key: 'archivo', label: 'Archivo' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'estado', label: 'Estado' },
    { key: 'acciones', label: 'Acciones', render: (row) => (
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={() => descargar(row.id_documento, row.nombre_archivo)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
          <Download className="h-3.5 w-3.5" /> Descargar
        </button>
        {(usuario?.rol === 'oficial_cumplimiento' || usuario?.rol === 'admin') && row.estado === 'PENDIENTE_VERIFICACION' && (
          <>
            <button onClick={() => verificar(row.id_documento)} className="btn-success" style={{ padding: '6px 12px', fontSize: 12 }}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
            </button>
            <button onClick={() => rechazar(row.id_documento)} className="btn-danger" style={{ padding: '6px 12px', fontSize: 12 }}>
              <XCircle className="h-3.5 w-3.5" /> Rechazar
            </button>
          </>
        )}
      </div>
    )}
  ];

  const data = docs.map(d => ({
    id_documento: d.id_documento,
    nombre_archivo: d.nombre_archivo,
    archivo: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
          <Paperclip className="h-4 w-4" />
        </div>
        <div>
          <div style={{ fontWeight: 600 }}>{d.nombre_archivo}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{d.formato}</div>
        </div>
      </div>
    ),
    tipo: <span style={{ color: 'var(--text-secondary)' }}>{d.tipo_documento}</span>,
    estado: <EstadoBadge estado={d.estado} />,
  }));

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Documentos</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Gestión de documentos de expedientes</p>
      </div>

      {mensaje && <div className="mb-4"><Alerta variant="exito">{mensaje}</Alerta></div>}
      {error && <div className="mb-4"><Alerta variant="error">{error}</Alerta></div>}

      <div className="card" style={{ padding: 24, marginTop: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label className="label-upper">Cliente</label>
            <select value={clienteId} onChange={e => { setClienteId(e.target.value); }} className="select-field" style={{ width: '100%' }}>
              <option value="">Seleccione un cliente</option>
              {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre || c.id_cliente}</option>)}
            </select>
          </div>
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
          <Boton variant="primario" onClick={subir} style={{ padding: '12px 20px', fontSize: 14 }}>
            <Upload className="h-4 w-4" /> Subir documento
          </Boton>
        </div>
      </div>

      <Tabla columns={columns} data={data} />
    </div>
  );
}
