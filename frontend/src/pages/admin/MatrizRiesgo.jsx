import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { Settings, AlertCircle, CheckCircle2, RotateCcw, BookOpen, Layers } from 'lucide-react';

export default function MatrizRiesgo() {
  const [matriz, setMatriz] = useState(null);
  const [versiones, setVersiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const fetchMatriz = async () => {
    try {
      const res = await api.get('/admin/matriz');
      setMatriz(res.data);
    } catch {
      setError('Error al cargar matriz activa');
    }
  };

  const fetchVersiones = async () => {
    try {
      const res = await api.get('/admin/matriz/versiones');
      setVersiones(res.data);
    } catch {
      setError('Error al cargar versiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatriz();
    fetchVersiones();
  }, []);

  const showMensaje = (text) => { setMensaje(text); setTimeout(() => setMensaje(''), 4000); };
  const showError = (text) => { setError(text); setTimeout(() => setError(''), 6000); };

  const actualizarFactor = async (factorId, peso) => {
    try {
      await api.patch(`/admin/factores/${factorId}`, { peso: parseInt(peso) });
      showMensaje('Factor actualizado');
      fetchMatriz();
    } catch {
      showError('Error al actualizar factor');
    }
  };

  const publicarVersion = async (versionId) => {
    if (!window.confirm('¿Publicar esta versión? Se marcarán todos los expedientes para reevaluación.')) return;
    try {
      await api.patch(`/admin/matriz/${versionId}/publicar`);
      showMensaje('Versión publicada correctamente');
      fetchMatriz();
      fetchVersiones();
    } catch {
      showError('Error al publicar versión');
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Matriz de riesgo</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Configuración de factores y versiones de la matriz de riesgo</p>
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

      {matriz && (
        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Versión activa</div>
              <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Versión {matriz.version.version_numero}
              </div>
            </div>
            <span className="badge" style={{ marginLeft: 'auto', backgroundColor: 'rgba(22,163,74,0.1)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)' }}>
              <CheckCircle2 className="h-3 w-3" /> Activa
            </span>
          </div>

          <div className="table-container" style={{ marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  <th>Factor</th>
                  <th>Descripción</th>
                  <th>Tipo</th>
                  <th>Peso</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {matriz.factores.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600 }}>{f.nombre_factor}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 300 }}>{f.descripcion}</td>
                    <td><span className="badge" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}>{f.tipo}</span></td>
                    <td>
                      <input
                        type="number"
                        defaultValue={f.peso}
                        onBlur={(e) => actualizarFactor(f.id, e.target.value)}
                        className="input-field"
                        style={{ width: 80, padding: '6px 10px', fontSize: 13 }}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge" style={{
                        backgroundColor: f.activo ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                        color: f.activo ? '#16A34A' : '#F87171',
                        border: `1px solid ${f.activo ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`
                      }}>
                        {f.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
                {matriz.factores.length === 0 && (
                  <tr><td colSpan={5} className="empty-state">Sin factores configurados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Historial</div>
            <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)' }}>Versiones publicadas</div>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Versión</th>
                <th>Descripción</th>
                <th>Publicada por</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {versiones.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 600 }}>Versión {v.version_numero}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{v.descripcion || 'Sin descripción'}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{v.publicada_por || '—'}</td>
                  <td>
                    {v.esta_activa ? (
                      <span className="badge" style={{ backgroundColor: 'rgba(22,163,74,0.1)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)' }}>
                        <CheckCircle2 className="h-3 w-3" /> Activa
                      </span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: 'rgba(90,101,120,0.1)', color: '#5A6578', border: '1px solid rgba(90,101,120,0.2)' }}>
                        Inactiva
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {!v.esta_activa && (
                      <button onClick={() => publicarVersion(v.id)} className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
                        <RotateCcw className="h-3.5 w-3.5" /> Publicar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {versiones.length === 0 && (
                <tr><td colSpan={5} className="empty-state">Sin versiones registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
