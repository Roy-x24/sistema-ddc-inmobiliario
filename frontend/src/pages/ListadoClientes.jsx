import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import EstadoBadge from '../components/EstadoBadge';
import Tabla from '../components/ui/Tabla';
import Boton from '../components/ui/Boton';
import { Users, Plus, Search, Building2, User, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function ListadoClientes() {
  const [clientes, setClientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(20);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  const cargar = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (busqueda) params.append('busqueda', busqueda);
      if (tipo) params.append('tipo', tipo);
      if (estado) params.append('estado', estado);
      params.append('skip', String(skip));
      params.append('limit', String(limit));
      const res = await api.get(`/clientes/?${params.toString()}`);
      setClientes(res.data || []);
      const totalHeader = res.headers['x-total-count'];
      setTotal(totalHeader ? parseInt(totalHeader, 10) : 0);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setSkip(0);
  }, [busqueda, tipo, estado]);

  useEffect(() => {
    cargar();
  }, [busqueda, tipo, estado, skip, limit]);

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(skip / limit) + 1;

  const columns = [
    { key: 'cliente', label: 'Cliente' },
    { key: 'identificacion', label: 'Identificación' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'estado', label: 'Estado' },
    { key: 'riesgo', label: 'Riesgo' },
    { key: 'registrado_por', label: 'Registrado por' },
    { key: 'acciones', label: 'Acciones', render: (row) => (
      <div style={{ textAlign: 'right' }}>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/expediente/${row.id_cliente}`); }}
          className="btn-secondary"
          style={{ padding: '6px 14px', fontSize: 12 }}
        >
          <Eye className="h-3.5 w-3.5" /> Ver
        </button>
      </div>
    )}
  ];

  const data = clientes.map(c => ({
    id_cliente: c.id_cliente,
    cliente: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-gold">
          {c.tipo_cliente === 'NATURAL' ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.nombre || '-'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>{c.id_cliente?.slice(0, 8)}...</div>
        </div>
      </div>
    ),
    identificacion: <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)' }}>{c.identificacion || '-'}</span>,
    tipo: <span className="badge" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}>{c.tipo_cliente === 'NATURAL' ? 'Persona natural' : 'Persona jurídica'}</span>,
    estado: <EstadoBadge estado={c.estado} />,
    riesgo: c.nivel_riesgo ? <span className="badge" style={{
      backgroundColor: c.nivel_riesgo === 'ALTO' ? 'rgba(220,38,38,0.1)' : c.nivel_riesgo === 'ESTANDAR' ? 'rgba(217,119,6,0.1)' : 'rgba(22,163,74,0.1)',
      color: c.nivel_riesgo === 'ALTO' ? '#F87171' : c.nivel_riesgo === 'ESTANDAR' ? '#FBBF24' : '#4ADE80',
      border: `1px solid ${c.nivel_riesgo === 'ALTO' ? 'rgba(220,38,38,0.2)' : c.nivel_riesgo === 'ESTANDAR' ? 'rgba(217,119,6,0.2)' : 'rgba(22,163,74,0.2)'}`
    }}>{c.nivel_riesgo}</span> : '-',
    registrado_por: <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{c.registrado_por}</span>,
  }));

  return (
    <div className="animate-fade-in-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28 }}>Clientes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Expedientes registrados en el sistema</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Boton variant="primario" onClick={() => navigate('/clientes/nuevo')} style={{ padding: '12px 20px', fontSize: 14 }}>
            <User className="h-4 w-4" /> Persona natural
          </Boton>
          <Boton variant="secundario" onClick={() => navigate('/clientes/nuevo-juridica')} style={{ padding: '12px 20px', fontSize: 14 }}>
            <Building2 className="h-4 w-4" /> Persona jurídica
          </Boton>
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

      {cargando ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Cargando expedientes...
        </div>
      ) : (
        <>
          <Tabla columns={columns} data={data} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Mostrando {clientes.length} de {total} resultados
              </span>
              <select
                value={limit}
                onChange={e => { setLimit(parseInt(e.target.value, 10)); setSkip(0); }}
                className="select-field"
                style={{ width: 80, padding: '6px 10px', fontSize: 12 }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>por página</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setSkip(Math.max(0, skip - limit))}
                disabled={skip === 0}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: 12, opacity: skip === 0 ? 0.5 : 1 }}
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 80, textAlign: 'center' }}>
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setSkip(skip + limit)}
                disabled={skip + limit >= total}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: 12, opacity: skip + limit >= total ? 0.5 : 1 }}
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
