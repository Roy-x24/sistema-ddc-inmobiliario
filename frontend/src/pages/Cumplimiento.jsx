import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import EstadoBadge from '../components/EstadoBadge';
import RiesgoIndicador from '../components/RiesgoIndicador';
import EmptyState from '../components/EmptyState';
import PaginationControls from '../components/PaginationControls';
import { AlertTriangle, Bot, CheckCircle2, FileWarning, Search, ShieldCheck, UserCheck } from 'lucide-react';
import { pageCountFor, paginate } from '../utils/pagination';
import { tipoClienteBadgeClass, tipoClienteLabel } from '../utils/clientesUi';

const COLAS = [
  ['LISTOS_AUTOACTIVACION', 'Listos auto'],
  ['REVISION_OFICIAL', 'Revision oficial'],
  ['OBSERVADOS_DOCUMENTOS', 'Observados'],
  ['ALTO_RIESGO', 'Alto riesgo'],
  ['PENDIENTES_INFORMACION', 'Pendientes'],
];

const iconos = {
  LISTOS_AUTOACTIVACION: ShieldCheck,
  REVISION_OFICIAL: UserCheck,
  OBSERVADOS_DOCUMENTOS: FileWarning,
  ALTO_RIESGO: AlertTriangle,
  PENDIENTES_INFORMACION: Bot,
};

const prioridad = {
  ALTO_RIESGO: 1,
  OBSERVADOS_DOCUMENTOS: 2,
  REVISION_OFICIAL: 3,
  PENDIENTES_INFORMACION: 4,
  LISTOS_AUTOACTIVACION: 5,
};

export default function Cumplimiento() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [resumen, setResumen] = useState({});
  const [cola, setCola] = useState('');
  const [tipo, setTipo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const cargar = async () => {
    const params = new URLSearchParams();
    if (cola) params.append('cola', cola);
    if (tipo) params.append('tipo', tipo);
    const [bandejaRes, resumenRes] = await Promise.all([
      api.get(`/cumplimiento/bandeja${params.toString() ? `?${params.toString()}` : ''}`),
      api.get('/cumplimiento/resumen'),
    ]);
    setItems(bandejaRes.data || []);
    setResumen(resumenRes.data || {});
  };

  useEffect(() => {
    cargar().catch(() => setError('No se pudo cargar la bandeja de cumplimiento'));
  }, [cola, tipo]);

  useEffect(() => {
    const totalPages = pageCountFor(items, pageSize);
    if (page > totalPages) setPage(totalPages);
  }, [items, page, pageSize]);

  const evaluar = async (id) => {
    try {
      const res = await api.post(`/cumplimiento/clientes/${id}/evaluar-automatizacion`);
      const accion = res.data?.accion || 'sin_accion';
      setMensaje(`Evaluacion ejecutada: ${accion}`);
      cargar();
    } catch {
      setError('No se pudo evaluar la automatizacion');
    }
  };

  const itemsFiltrados = items
    .filter((item) => {
      if (!busqueda.trim()) return true;
      const texto = [item.nombre, item.identificacion, item.estado, item.nivel_riesgo, item.motivo_principal, item.accion_sugerida]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return texto.includes(busqueda.trim().toLowerCase());
    })
    .sort((a, b) => (prioridad[a.cola] || 99) - (prioridad[b.cola] || 99));

  const paginados = paginate(itemsFiltrados, page, pageSize);

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Bandeja de cumplimiento</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Cola inteligente para que el Oficial revise excepciones, no expedientes completos.
        </p>
      </div>

      {mensaje && <div className="success-banner">{mensaje}</div>}
      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginTop: 22 }}>
        {COLAS.map(([key, label]) => {
          const Icon = iconos[key];
          return (
            <button key={key} onClick={() => { setCola(key); setPage(1); }} className="card" style={{ padding: 16, textAlign: 'left', borderColor: cola === key ? 'rgba(212,175,55,0.6)' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon className="h-4 w-4 text-gold" />
                <span className="info-item-label">{label}</span>
              </div>
              <div className="info-item-value" style={{ marginTop: 8 }}>{resumen[key] || 0}</div>
            </button>
          );
        })}
      </div>

      <div className="card" style={{ padding: 16, marginTop: 18, display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) 220px 220px auto', gap: 12, alignItems: 'end' }}>
        <div>
          <label className="label-upper" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Search className="h-3.5 w-3.5" /> Busqueda</label>
          <input value={busqueda} onChange={e => { setBusqueda(e.target.value); setPage(1); }} placeholder="Cliente, identificacion, motivo..." className="input-field" style={{ width: '100%' }} />
        </div>
        <div style={{ width: 220 }}>
          <label className="label-upper">Cola</label>
          <select value={cola} onChange={e => { setCola(e.target.value); setPage(1); }} className="select-field" style={{ width: '100%' }}>
            <option value="">Todas</option>
            {COLAS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </div>
        <div style={{ width: 220 }}>
          <label className="label-upper">Tipo de cliente</label>
          <select value={tipo} onChange={e => { setTipo(e.target.value); setPage(1); }} className="select-field" style={{ width: '100%' }}>
            <option value="">Todos</option>
            <option value="NATURAL">Persona natural</option>
            <option value="JURIDICA">Persona juridica</option>
          </select>
        </div>
        <button onClick={() => { setCola(''); setTipo(''); setBusqueda(''); }} className="btn-secondary" style={{ padding: '12px 18px' }}>Limpiar</button>
      </div>

      <div className="table-container" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Riesgo</th>
              <th>Completitud</th>
              <th>Motivo</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginados.map(item => (
              <tr key={item.id_cliente}>
                <td>
                  <div style={{ fontWeight: 700 }}>{item.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.identificacion}</div>
                  <span className={`mt-2 inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${tipoClienteBadgeClass(item.tipo_cliente)}`}>
                    {tipoClienteLabel(item.tipo_cliente)}
                  </span>
                </td>
                <td><EstadoBadge estado={item.estado} /></td>
                <td>{item.nivel_riesgo ? <RiesgoIndicador nivel={item.nivel_riesgo} /> : '-'}</td>
                <td>
                  <div style={{ fontWeight: 800 }}>{item.completitud_documental}%</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {item.documentos.verificados}/{item.documentos.obligatorios} obligatorios
                  </div>
                </td>
                <td style={{ maxWidth: 320 }}>
                  <div style={{ fontWeight: 700 }}>{item.accion_sugerida}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.motivo_principal}</div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate(item.cola === 'OBSERVADOS_DOCUMENTOS' ? `/documentos/${item.id_cliente}` : `/expediente/${item.id_cliente}`)} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12 }}>
                      {item.cola === 'OBSERVADOS_DOCUMENTOS' ? 'Ver documentos' : 'Ver expediente'}
                    </button>
                    {['REVISION_OFICIAL', 'ALTO_RIESGO', 'LISTOS_AUTOACTIVACION'].includes(item.cola) && (
                      <button onClick={() => navigate(`/activacion/${item.id_cliente}`)} className="btn-success" style={{ padding: '8px 12px', fontSize: 12 }}>Ir a activacion</button>
                    )}
                    <button onClick={() => evaluar(item.id_cliente)} className="btn-primary" style={{ padding: '8px 12px', fontSize: 12 }}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Evaluar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {itemsFiltrados.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon={ShieldCheck} title="Sin casos para estos filtros" message="Cambia la cola, limpia la busqueda o revisa otra prioridad. Si la cola esta vacia, el Oficial no tiene excepciones pendientes ahi." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={itemsFiltrados.length}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
