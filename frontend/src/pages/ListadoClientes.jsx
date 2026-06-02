import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import EstadoBadge from '../components/EstadoBadge';
import { Users, Plus, Search, Filter, Building2, User, ChevronRight, Eye } from 'lucide-react';

export default function ListadoClientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  const cargar = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (busqueda) params.append('busqueda', busqueda);
      if (tipo) params.append('tipo', tipo);
      if (estado) params.append('estado', estado);
      params.append('limit', '50');
      const res = await api.get(`/clientes/?${params.toString()}`);
      setClientes(res.data || []);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [busqueda, tipo, estado]);

  return (
    <div className="animate-fade-in-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Clientes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Expedientes registrados en el sistema</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/clientes/nuevo')} className="btn-primary" style={{ padding: '12px 20px', fontSize: 14 }}>
            <User className="h-4 w-4" /> Persona natural
          </button>
          <button onClick={() => navigate('/clientes/nuevo-juridica')} className="btn-secondary" style={{ padding: '12px 20px', fontSize: 14 }}>
            <Building2 className="h-4 w-4" /> Persona jurídica
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <label className="label-upper">Búsqueda</label>
            <div style={{ position: 'relative' }}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                placeholder="Buscar por nombre o identificación..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="input-field"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>
          <div style={{ minWidth: 180 }}>
            <label className="label-upper">Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="select-field" style={{ width: '100%' }}>
              <option value="">Todos los tipos</option>
              <option value="NATURAL">Persona natural</option>
              <option value="JURIDICA">Persona jurídica</option>
            </select>
          </div>
          <div style={{ minWidth: 180 }}>
            <label className="label-upper">Estado</label>
            <select value={estado} onChange={e => setEstado(e.target.value)} className="select-field" style={{ width: '100%' }}>
              <option value="">Todos los estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_REVISION">En revisión</option>
              <option value="ACTIVO">Activo</option>
              <option value="RECHAZADO">Rechazado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Identificación</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Riesgo</th>
              <th>Registrado por</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr><td colSpan={7} className="empty-state">Cargando expedientes...</td></tr>
            )}
            {!cargando && clientes.length === 0 && (
              <tr><td colSpan={7} className="empty-state">Sin resultados.</td></tr>
            )}
            {clientes.map(c => (
              <tr key={c.id_cliente} className="group" style={{ cursor: 'pointer' }} onClick={() => navigate(`/expediente/${c.id_cliente}`)}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-gold">
                      {c.tipo_cliente === 'NATURAL' ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.nombre || '-'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>{c.id_cliente?.slice(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)' }}>{c.identificacion || '-'}</td>
                <td><span className="badge" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}>{c.tipo_cliente === 'NATURAL' ? 'Persona natural' : 'Persona jurídica'}</span></td>
                <td><EstadoBadge estado={c.estado} /></td>
                <td>{c.nivel_riesgo ? <span className="badge" style={{
                  backgroundColor: c.nivel_riesgo === 'ALTO' ? 'rgba(220,38,38,0.1)' : c.nivel_riesgo === 'ESTANDAR' ? 'rgba(217,119,6,0.1)' : 'rgba(22,163,74,0.1)',
                  color: c.nivel_riesgo === 'ALTO' ? '#F87171' : c.nivel_riesgo === 'ESTANDAR' ? '#FBBF24' : '#4ADE80',
                  border: `1px solid ${c.nivel_riesgo === 'ALTO' ? 'rgba(220,38,38,0.2)' : c.nivel_riesgo === 'ESTANDAR' ? 'rgba(217,119,6,0.2)' : 'rgba(22,163,74,0.2)'}`
                }}>{c.nivel_riesgo}</span> : '-'}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{c.registrado_por}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/expediente/${c.id_cliente}`); }}
                    className="btn-secondary"
                    style={{ padding: '6px 14px', fontSize: 12 }}
                  >
                    <Eye className="h-3.5 w-3.5" /> Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
