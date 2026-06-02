import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import EstadoBadge from '../components/EstadoBadge';

export default function Documentos() {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [docs, setDocs] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [tipo, setTipo] = useState('DOCUMENTO_IDENTIDAD');

  useEffect(() => {
    api.get('/clientes/?limit=9999').then(res => setClientes(res.data || []));
  }, []);

  const cargarDocs = async (id) => {
    if (!id) return;
    const res = await api.get(`/clientes/${id}/documentos`);
    setDocs(res.data || []);
  };

  const subir = async () => {
    if (!clienteId || !archivo) return alert('Seleccione cliente y archivo');
    const formData = new FormData();
    formData.append('tipo_documento', tipo);
    formData.append('archivo', archivo);
    await api.post(`/clientes/${clienteId}/documentos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    setArchivo(null);
    cargarDocs(clienteId);
  };

  const verificar = async (docId) => {
    await api.patch(`/clientes/documentos/${docId}/verificar`);
    cargarDocs(clienteId);
  };

  const rechazar = async (docId) => {
    const motivo = prompt('Motivo de rechazo');
    if (!motivo) return;
    await api.patch(`/clientes/documentos/${docId}/rechazar?motivo=${encodeURIComponent(motivo)}`);
    cargarDocs(clienteId);
  };

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Documentos</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Gestión de documentos de expedientes</p>
      </div>

      <div className="card" style={{ padding: 24, marginTop: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Cliente</label>
            <select value={clienteId} onChange={e => { setClienteId(e.target.value); cargarDocs(e.target.value); }} className="select-field" style={{ width: '100%' }}>
              <option value="">Seleccione un cliente</option>
              {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre || c.id_cliente}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Tipo de documento</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="select-field" style={{ width: '100%' }}>
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
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Archivo (PDF/JPG/PNG, máx 10MB)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setArchivo(e.target.files[0])} className="input-field" style={{ padding: 10 }} />
          </div>
          <button onClick={subir} className="btn-primary" style={{ padding: '12px 20px', fontSize: 14 }}>Subir documento</button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Archivo</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {docs.map(d => (
              <tr key={d.id_documento}>
                <td>
                  <div style={{ fontWeight: 600 }}>{d.nombre_archivo}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{d.formato}</div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{d.tipo_documento}</td>
                <td><EstadoBadge estado={d.estado} /></td>
                <td style={{ textAlign: 'right' }}>
                  {d.estado === 'PENDIENTE_VERIFICACION' && (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => verificar(d.id_documento)} className="btn-primary" style={{ padding: '6px 14px', fontSize: 12, background: 'linear-gradient(135deg, #16A34A, #15803d)' }}>Aprobar</button>
                      <button onClick={() => rechazar(d.id_documento)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12, backgroundColor: 'rgba(220,38,38,0.1)', color: '#F87171', borderColor: 'rgba(220,38,38,0.2)' }}>Rechazar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {docs.length === 0 && <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Sin documentos.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
