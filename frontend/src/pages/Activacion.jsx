import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import EstadoBadge from '../components/EstadoBadge';
import RiesgoIndicador from '../components/RiesgoIndicador';
import EmptyState from '../components/EmptyState';
import PaginationControls from '../components/PaginationControls';
import { AlertTriangle, CheckCircle2, Search, XCircle, Lock, Unlock, ShieldCheck, Workflow } from 'lucide-react';
import { tipoClienteBadgeClass, tipoClienteLabel } from '../utils/clientesUi';
import { pageCountFor, paginate } from '../utils/pagination';

export default function Activacion() {
  const { id: urlId } = useParams();
  const [clientes, setClientes] = useState([]);
  const [tipoCliente, setTipoCliente] = useState('');
  const [riesgoFiltro, setRiesgoFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [errores, setErrores] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [confirmando, setConfirmando] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [bloqueoPage, setBloqueoPage] = useState(1);
  const [bloqueoPageSize, setBloqueoPageSize] = useState(10);

  const cargar = async () => {
    const res = await api.get('/clientes/?limit=9999');
    setClientes(res.data || []);
  };

  useEffect(() => { cargar(); }, []);

  const mostrarErrores = (lista) => {
    setErrores(lista);
    setMensaje('');
    setTimeout(() => setErrores([]), 10000);
  };

  const mostrarMensaje = (texto) => {
    setMensaje(texto);
    setErrores([]);
    setTimeout(() => setMensaje(''), 4000);
  };

  const activar = async (id) => {
    const cliente = clientes.find(c => c.id_cliente === id);
    const necesitaConfirmacion = cliente?.nivel_riesgo === 'ALTO';
    const conf = necesitaConfirmacion ? confirmando[id] : true;

    if (necesitaConfirmacion && !conf) {
      mostrarErrores(['Riesgo ALTO: debe marcar la confirmacion manual adicional para activar este cliente.']);
      return;
    }

    if (!window.confirm('Confirma que desea activar este cliente?')) return;
    setErrores([]);
    try {
      await api.patch(`/clientes/${id}/activar`, null, {
        params: { confirmacion_alto: conf ? true : false }
      });
      mostrarMensaje('Cliente activado exitosamente');
      cargar();
    } catch (err) {
      const res = err.response;
      if (res && res.status === 400) {
        const detail = res.data?.detail;
        if (detail && detail.requisitos_faltantes) {
          mostrarErrores(detail.requisitos_faltantes);
        } else if (typeof detail === 'string') {
          mostrarErrores([detail]);
        } else {
          mostrarErrores(['Error desconocido del servidor']);
        }
      } else {
        mostrarErrores(['Error de conexion con el servidor']);
      }
    }
  };

  const rechazar = async (id) => {
    const motivo = window.prompt('Motivo de rechazo obligatorio');
    if (!motivo) return;
    setErrores([]);
    try {
      await api.patch(`/clientes/${id}/rechazar?motivo=${encodeURIComponent(motivo)}`);
      mostrarMensaje('Cliente rechazado');
      cargar();
    } catch (err) {
      const detail = err.response?.data?.detail;
      mostrarErrores([typeof detail === 'string' ? detail : 'Error al rechazar cliente']);
    }
  };

  const bloquear = async (id) => {
    const motivo = window.prompt('Motivo de bloqueo obligatorio');
    if (!motivo) return;
    setErrores([]);
    try {
      await api.patch(`/clientes/${id}/bloquear?motivo=${encodeURIComponent(motivo)}`);
      mostrarMensaje('Cliente bloqueado');
      cargar();
    } catch (err) {
      const detail = err.response?.data?.detail;
      mostrarErrores([typeof detail === 'string' ? detail : 'Error al bloquear cliente']);
    }
  };

  const desbloquear = async (id) => {
    if (!window.confirm('Confirma que desea desbloquear este cliente?')) return;
    setErrores([]);
    try {
      await api.patch(`/clientes/${id}/desbloquear`);
      mostrarMensaje('Cliente desbloqueado');
      cargar();
    } catch (err) {
      const detail = err.response?.data?.detail;
      mostrarErrores([typeof detail === 'string' ? detail : 'Error al desbloquear cliente']);
    }
  };

  const porFiltros = (c) => {
    if (tipoCliente && c.tipo_cliente !== tipoCliente) return false;
    if (riesgoFiltro && c.nivel_riesgo !== riesgoFiltro) return false;
    if (urlId && c.id_cliente !== urlId) return false;
    if (busqueda.trim()) {
      const texto = [c.nombre, c.identificacion, c.id_cliente, c.estado, c.nivel_riesgo].filter(Boolean).join(' ').toLowerCase();
      if (!texto.includes(busqueda.trim().toLowerCase())) return false;
    }
    return true;
  };
  const pendientes = clientes.filter(c => !['ACTIVO', 'BLOQUEADO', 'RECHAZADO'].includes(c.estado) && porFiltros(c));
  const casosSistema = pendientes.filter(c => !c.nivel_riesgo || c.nivel_riesgo === 'BAJO').length;
  const casosOficial = pendientes.filter(c => ['ESTANDAR', 'ALTO'].includes(c.nivel_riesgo) || c.estado === 'OBSERVADO' || c.estado === 'PENDIENTE_BF').length;
  const altoPendiente = pendientes.filter(c => c.nivel_riesgo === 'ALTO').length;
  const pendientesPaginados = paginate(pendientes, page, pageSize);
  const gestionBloqueo = clientes.filter(c => ['ACTIVO', 'BLOQUEADO'].includes(c.estado) && porFiltros(c));
  const gestionBloqueoPaginados = paginate(gestionBloqueo, bloqueoPage, bloqueoPageSize);
  const activos = clientes.filter(c => c.estado === 'ACTIVO').length;
  const bloqueados = clientes.filter(c => c.estado === 'BLOQUEADO').length;

  useEffect(() => {
    const totalPages = pageCountFor(pendientes, pageSize);
    if (page > totalPages) setPage(totalPages);
  }, [pendientes, page, pageSize]);

  useEffect(() => {
    const totalPages = pageCountFor(gestionBloqueo, bloqueoPageSize);
    if (bloqueoPage > totalPages) setBloqueoPage(totalPages);
  }, [gestionBloqueo, bloqueoPage, bloqueoPageSize]);

  const renderInfoCliente = (c) => (
    <>
      <td>
        <div style={{ fontWeight: 600 }}>{c.nombre || '-'}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.id_cliente?.slice(0, 8)}...</div>
      </td>
      <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)' }}>{c.identificacion || '-'}</td>
      <td>
        <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${tipoClienteBadgeClass(c.tipo_cliente)}`}>
          {tipoClienteLabel(c.tipo_cliente)}
        </span>
      </td>
      <td><EstadoBadge estado={c.estado} /></td>
      <td>{c.nivel_riesgo ? <RiesgoIndicador nivel={c.nivel_riesgo} /> : '-'}</td>
    </>
  );

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Activacion de clientes</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Bandeja inteligente: el sistema activa riesgo bajo completo y escala excepciones al Oficial.</p>
      </div>

      <div className="card" style={{ padding: 18, marginTop: 18, borderColor: 'rgba(34,197,94,0.25)', background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(212,175,55,0.04))' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
            <Workflow className="h-5 w-5" />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Decision automatica basada en riesgo</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>
              Riesgo BAJO con documentos verificados, perfiles completos, sin observaciones y BF aprobado se activa automaticamente. Riesgo ESTANDAR o ALTO permanece en esta bandeja para revision, muestreo o decision manual.
            </div>
          </div>
        </div>
      </div>

      {mensaje && (
        <div className="success-banner" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 className="h-4 w-4" />
          {mensaje}
        </div>
      )}

      {errores.length > 0 && (
        <div className="error-banner">
          <div className="error-banner-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle className="h-4 w-4" />
            No se pudo completar la accion
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
            {errores.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <div className="card" style={{ padding: 16, marginTop: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ width: 220 }}>
            <label className="label-upper">Tipo de cliente</label>
            <select value={tipoCliente} onChange={e => { setTipoCliente(e.target.value); setPage(1); setBloqueoPage(1); }} className="select-field" style={{ width: '100%' }}>
              <option value="">Todos</option>
              <option value="NATURAL">Persona natural</option>
              <option value="JURIDICA">Persona juridica</option>
            </select>
          </div>
          <div style={{ width: 220 }}>
            <label className="label-upper">Riesgo</label>
            <select value={riesgoFiltro} onChange={e => { setRiesgoFiltro(e.target.value); setPage(1); setBloqueoPage(1); }} className="select-field" style={{ width: '100%' }}>
              <option value="">Todos</option>
              <option value="BAJO">Bajo</option>
              <option value="ESTANDAR">Estandar</option>
              <option value="ALTO">Alto</option>
            </select>
          </div>
          <div style={{ minWidth: 260, flex: 1 }}>
            <label className="label-upper" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Search className="h-3.5 w-3.5" /> Busqueda</label>
            <input value={busqueda} onChange={e => { setBusqueda(e.target.value); setPage(1); setBloqueoPage(1); }} placeholder="Nombre, cedula, RUC o ID..." className="input-field" style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: '10px 14px', minWidth: 120 }}>
              <div className="info-item-label">Activos</div>
              <div className="info-item-value">{activos}</div>
            </div>
            <div className="card" style={{ padding: '10px 14px', minWidth: 120 }}>
              <div className="info-item-label">Bloqueados</div>
              <div className="info-item-value">{bloqueados}</div>
            </div>
            <div className="card" style={{ padding: '10px 14px', minWidth: 150 }}>
              <div className="info-item-label">Para sistema</div>
              <div className="info-item-value">{casosSistema}</div>
            </div>
            <div className="card" style={{ padding: '10px 14px', minWidth: 150 }}>
              <div className="info-item-label">Para Oficial</div>
              <div className="info-item-value">{casosOficial}</div>
            </div>
            <div className="card" style={{ padding: '10px 14px', minWidth: 150 }}>
              <div className="info-item-label">Alto riesgo</div>
              <div className="info-item-value">{altoPendiente}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="table-container" style={{ marginTop: 16 }}>
        <div style={{ padding: '16px 18px 0' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Revision del Oficial</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Los casos BAJO completos salen solos de esta lista; aqui quedan pendientes, excepciones y riesgos que necesitan criterio humano.</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Identificacion</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Riesgo</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pendientesPaginados.map(c => (
              <tr key={c.id_cliente}>
                {renderInfoCliente(c)}
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                    {c.nivel_riesgo === 'BAJO' && (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-300">
                        <ShieldCheck className="h-3.5 w-3.5" /> Autoactivable si cumple
                      </span>
                    )}
                    {c.nivel_riesgo === 'ALTO' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', marginRight: 4 }}>
                        <input
                          type="checkbox"
                          checked={!!confirmando[c.id_cliente]}
                          onChange={e => setConfirmando({ ...confirmando, [c.id_cliente]: e.target.checked })}
                        />
                        Confirmar ALTO
                      </label>
                    )}
                    <button onClick={() => activar(c.id_cliente)} className="btn-success" style={{ padding: '8px 16px', fontSize: 12 }}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> {c.nivel_riesgo === 'ALTO' ? 'Activar alto' : c.nivel_riesgo === 'ESTANDAR' ? 'Aprobar manual' : 'Activar'}
                    </button>
                    <button onClick={() => rechazar(c.id_cliente)} className="btn-danger" style={{ padding: '8px 16px', fontSize: 12 }}>
                      <XCircle className="h-3.5 w-3.5" /> Rechazar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pendientes.length === 0 && (
              <tr><td colSpan={6}><EmptyState icon={ShieldCheck} title="Sin decisiones pendientes" message="No hay expedientes con estos filtros. Los casos bajo riesgo completos salen de esta lista al activarse automaticamente." /></td></tr>
            )}
          </tbody>
        </table>
        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={pendientes.length}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
        />
      </div>

      <div className="table-container" style={{ marginTop: 24 }}>
        <div style={{ padding: '16px 18px 0' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Bloqueo de clientes</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Bloquea clientes activos o desbloquea clientes suspendidos.</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Identificacion</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Riesgo</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gestionBloqueoPaginados.map(c => (
              <tr key={c.id_cliente}>
                {renderInfoCliente(c)}
                <td style={{ textAlign: 'right' }}>
                  {c.estado === 'ACTIVO' ? (
                    <button onClick={() => bloquear(c.id_cliente)} className="btn-danger" style={{ padding: '8px 16px', fontSize: 12 }}>
                      <Lock className="h-3.5 w-3.5" /> Bloquear
                    </button>
                  ) : (
                    <button onClick={() => desbloquear(c.id_cliente)} className="btn-success" style={{ padding: '8px 16px', fontSize: 12 }}>
                      <Unlock className="h-3.5 w-3.5" /> Desbloquear
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {gestionBloqueo.length === 0 && (
              <tr><td colSpan={6}><EmptyState icon={Lock} title="Sin casos de bloqueo" message="No hay clientes activos o bloqueados con estos filtros." /></td></tr>
            )}
          </tbody>
        </table>
        <PaginationControls
          page={bloqueoPage}
          pageSize={bloqueoPageSize}
          total={gestionBloqueo.length}
          onPageChange={setBloqueoPage}
          onPageSizeChange={(value) => {
            setBloqueoPageSize(value);
            setBloqueoPage(1);
          }}
        />
      </div>
    </div>
  );
}
