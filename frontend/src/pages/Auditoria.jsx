import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { Download, CheckCircle2, AlertCircle, Bot, ClipboardList } from 'lucide-react';

export default function Auditoria() {
  const { usuario } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [modelRuns, setModelRuns] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [exportando, setExportando] = useState(false);
  const [exportandoAdmin, setExportandoAdmin] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const showMensaje = (text) => { setMensaje(text); setTimeout(() => setMensaje(''), 4000); };
  const showError = (text) => { setError(text); setTimeout(() => setError(''), 6000); };

  const cargar = async () => {
    try {
      const [res, runs] = await Promise.all([
        api.get('/auditoria'),
        api.get('/ai/model-runs'),
      ]);
      setRegistros(res.data || []);
      setModelRuns(runs.data || []);
    } catch {
      setRegistros([]);
      setModelRuns([]);
    }
  };

  const cargarPorCliente = async (id) => {
    if (!id) { cargar(); return; }
    try {
      const [res, runs] = await Promise.all([
        api.get(`/clientes/${id}/auditoria`),
        api.get(`/ai/model-runs?cliente_id=${encodeURIComponent(id)}`),
      ]);
      setRegistros(res.data || []);
      setModelRuns(runs.data || []);
    } catch {
      setRegistros([]);
      setModelRuns([]);
    }
  };

  const exportarCSV = async () => {
    setExportando(true);
    try {
      const response = await api.get('/auditoria/exportar-csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `auditoria_expediente_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showMensaje('CSV exportado correctamente');
    } catch (err) {
      showError('Error al exportar CSV');
    } finally {
      setExportando(false);
    }
  };

  const exportarCSVAdmin = async () => {
    setExportandoAdmin(true);
    try {
      const response = await api.get('/auditoria-admin/exportar-csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `auditoria_admin_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showMensaje('CSV administrativo exportado correctamente');
    } catch (err) {
      showError('Error al exportar CSV administrativo');
    } finally {
      setExportandoAdmin(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Auditoría</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Trazabilidad de acciones sobre expedientes</p>
      </div>

      {mensaje && (
        <div className="success-banner" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <CheckCircle2 className="h-4 w-4" />
          {mensaje}
        </div>
      )}
      {error && (
        <div className="error-banner" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, marginTop: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="ID de cliente (opcional)" value={clienteId} onChange={e => setClienteId(e.target.value)} className="input-field" style={{ minWidth: 260 }} />
        <button onClick={() => cargarPorCliente(clienteId)} className="btn-primary" style={{ padding: '12px 20px' }}>Filtrar</button>
        <button onClick={() => { setClienteId(''); cargar(); }} className="btn-secondary" style={{ padding: '12px 20px' }}>Ver todo</button>

        {(usuario?.rol === 'auditor' || usuario?.rol === 'admin') && (
          <button
            onClick={exportarCSV}
            className="btn-secondary"
            style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}
            disabled={exportando}
          >
            <Download className="h-4 w-4" />
            {exportando ? 'Exportando...' : 'Exportar CSV'}
          </button>
        )}

        {usuario?.rol === 'admin' && (
          <button
            onClick={exportarCSVAdmin}
            className="btn-secondary"
            style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}
            disabled={exportandoAdmin}
          >
            <Download className="h-4 w-4" />
            {exportandoAdmin ? 'Exportando...' : 'Exportar CSV Admin'}
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 20, borderColor: 'rgba(20,184,166,0.22)', background: 'linear-gradient(135deg, rgba(20,184,166,0.06), rgba(255,255,255,0.98))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Bot className="h-5 w-5 text-gold" />
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>Auditoría técnica IA</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Corridas de modelos, proveedores, confianza y errores asociados.</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
          {modelRuns.slice(0, 6).map((run) => (
            <div key={run.id_run} className="card" style={{ padding: 14, background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList className="h-4 w-4 text-gold" />
                <div className="info-item-label" style={{ marginBottom: 0 }}>{run.purpose?.replaceAll('_', ' ')}</div>
              </div>
              <div className="info-item-value" style={{ marginTop: 8 }}>{run.provider} · {run.model}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
                Estado {run.status} · Confianza {Math.round((run.confidence || 0) * 100)}%
              </div>
              {run.errors?.length > 0 && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>{run.errors.join(', ')}</div>}
            </div>
          ))}
          {modelRuns.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin corridas IA registradas para este filtro.</div>}
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Origen</th>
              <th>Expediente</th>
              <th>Cambio</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {registros.map(r => (
              <tr key={r.id_auditoria}>
                <td style={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{new Date(r.fecha).toLocaleString()}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      backgroundColor: 'rgba(201, 162, 39, 0.1)',
                      color: 'var(--accent-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700
                    }}>
                      {r.usuario.charAt(0).toUpperCase()}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{r.usuario}</span>
                  </div>
                </td>
                <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.accion.replace(/_/g, ' ')}</td>
                <td>
                  <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${
                    r.origen === 'sistema'
                      ? 'border-green-500/20 bg-green-500/10 text-green-300'
                      : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300'
                  }`}>
                    {r.origen || 'humano'}
                  </span>
                  {r.severidad && (
                    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>{r.severidad}</div>
                  )}
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{r.cliente_id ? r.cliente_id.slice(0, 8) + '...' : '-'}</td>
                <td style={{ maxWidth: 260, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{r.valor_anterior || '-'}</span>
                  <span style={{ margin: '0 8px', color: 'var(--accent-gold)' }}>→</span>
                  <span>{r.valor_nuevo || '-'}</span>
                </td>
                <td style={{ maxWidth: 280, fontSize: 12, color: 'var(--text-muted)' }}>
                  {r.version_regla && <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{r.version_regla}</div>}
                  <div style={{ whiteSpace: 'normal', lineHeight: 1.45 }}>
                    {r.detalle ? JSON.stringify(r.detalle) : '-'}
                  </div>
                </td>
              </tr>
            ))}
            {registros.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Sin registros.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
