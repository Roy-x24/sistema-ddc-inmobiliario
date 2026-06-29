import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import EstadoBadge from '../components/EstadoBadge';
import RiesgoIndicador from '../components/RiesgoIndicador';
import EmptyState from '../components/EmptyState';
import PaginationControls from '../components/PaginationControls';
import InfoHint from '../components/InfoHint';
import AIAssistantPanel from '../components/AIAssistantPanel';
import DecisionModal from '../components/DecisionModal';
import { AlertTriangle, CheckCircle2, Search, XCircle, ShieldCheck, Workflow } from 'lucide-react';
import { tipoClienteBadgeClass, tipoClienteLabel } from '../utils/clientesUi';
import { pageCountFor, paginate } from '../utils/pagination';

const ESTADOS = [
  ['PENDIENTE', 'Pendiente'],
  ['PENDIENTE_BF', 'Pendiente BF'],
  ['EN_REVISION', 'En revision'],
  ['OBSERVADO', 'Observado'],
  ['RECHAZADO', 'Rechazado'],
];

const SEGMENTOS = [
  ['SISTEMA', 'Para sistema', Workflow, 'Casos de riesgo bajo o sin riesgo calculado todavia. Si cumplen todo, el sistema puede activarlos automaticamente.'],
  ['OFICIAL', 'Para Oficial', ShieldCheck, 'Casos con riesgo estandar/alto o excepciones que requieren decision humana antes de activar.'],
  ['ALTO', 'Alto riesgo', AlertTriangle, 'Casos de riesgo alto. Requieren confirmacion manual adicional y no deben autoactivarse.'],
];

export default function Activacion() {
  const { id: urlId } = useParams();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [tipoCliente, setTipoCliente] = useState('');
  const [riesgoFiltro, setRiesgoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [segmento, setSegmento] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [errores, setErrores] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [clienteAsistido, setClienteAsistido] = useState(null);
  const [decision, setDecision] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const ejecutarActivacion = async (cliente) => {
    const id = cliente.id_cliente;
    const necesitaConfirmacion = cliente?.nivel_riesgo === 'ALTO';

    if (cliente?.estado !== 'EN_REVISION') {
      mostrarErrores(['El expediente debe estar en EN_REVISION para poder activarse.']);
      return;
    }
    setErrores([]);
    try {
      await api.patch(`/clientes/${id}/activar`, null, {
        params: { confirmacion_alto: necesitaConfirmacion ? true : false }
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

  const activar = (cliente) => {
    if (cliente?.estado !== 'EN_REVISION') {
      mostrarErrores(['El expediente debe estar en EN_REVISION para poder activarse.']);
      return;
    }
    setDecision({
      type: 'activar',
      cliente,
      title: cliente.nivel_riesgo === 'ALTO' ? 'Aprobar activacion de alto riesgo' : 'Aprobar activacion',
      description: cliente.nivel_riesgo === 'ALTO'
        ? 'Esta activacion requiere criterio humano reforzado. Confirma que revisaste documentos, riesgo, BF y observaciones antes de aprobar.'
        : 'Confirma que el expediente fue revisado y cumple las reglas para activacion manual.',
      tone: 'success',
      actionLabel: 'Aprobar activacion',
      confirmText: cliente.nivel_riesgo === 'ALTO' ? 'APROBAR' : '',
      details: [
        `Cliente: ${cliente.nombre || cliente.identificacion || cliente.id_cliente}`,
        `Estado actual: ${cliente.estado}`,
        `Riesgo: ${cliente.nivel_riesgo || 'Sin calcular'}`,
      ],
    });
  };

  const puedeActivar = (c) => c.estado === 'EN_REVISION';
  const puedeRechazar = (c) => ['PENDIENTE', 'PENDIENTE_BF', 'EN_REVISION', 'OBSERVADO'].includes(c.estado);

  const accionResolucion = (c) => {
    if (c.estado === 'PENDIENTE_BF') {
      return { label: 'Validar BF', path: `/beneficiarios/${c.id_cliente}` };
    }
    if (c.estado === 'OBSERVADO') {
      return { label: 'Resolver observaciones', path: `/observaciones/${c.id_cliente}` };
    }
    if (c.estado === 'PENDIENTE') {
      return { label: 'Completar requisitos', path: `/documentos/${c.id_cliente}` };
    }
    return { label: 'Ver expediente', path: `/expediente/${c.id_cliente}` };
  };

  const detalleEstado = (c) => {
    if (c.estado === 'PENDIENTE_BF') return 'Faltan BF relevantes aprobados';
    if (c.estado === 'OBSERVADO') return 'Tiene observaciones o excepciones abiertas';
    if (c.estado === 'PENDIENTE') return 'Faltan documentos, perfiles o datos requeridos';
    if (c.estado === 'EN_REVISION' && c.nivel_riesgo === 'ALTO') return 'Listo para decision manual de alto riesgo';
    if (c.estado === 'EN_REVISION') return 'Listo para decision del Oficial';
    if (c.estado === 'RECHAZADO') return 'Expediente rechazado; se conserva como historial de decision';
    return 'Revisar expediente';
  };

  const ejecutarRechazo = async (cliente, motivo) => {
    const id = cliente.id_cliente;
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

  const rechazar = (cliente) => {
    setDecision({
      type: 'rechazar',
      cliente,
      title: 'Rechazar expediente',
      description: 'El rechazo cierra el expediente para decision de cumplimiento y debe quedar sustentado con un motivo claro.',
      tone: 'danger',
      actionLabel: 'Rechazar',
      requireReason: true,
      reasonLabel: 'Motivo de rechazo',
      reasonPlaceholder: 'Ej: documentos inconsistentes, origen de fondos no verificable, alerta no mitigada...',
      confirmText: 'RECHAZAR',
      details: [
        `Cliente: ${cliente.nombre || cliente.identificacion || cliente.id_cliente}`,
        `Estado actual: ${cliente.estado}`,
        `Riesgo: ${cliente.nivel_riesgo || 'Sin calcular'}`,
      ],
    });
  };

  const confirmarDecision = async ({ reason }) => {
    if (!decision?.cliente) return;
    if (decision.type === 'activar') {
      await ejecutarActivacion(decision.cliente);
    }
    if (decision.type === 'rechazar') {
      await ejecutarRechazo(decision.cliente, reason);
    }
  };

  const porFiltros = (c) => {
    if (tipoCliente && c.tipo_cliente !== tipoCliente) return false;
    if (riesgoFiltro && c.nivel_riesgo !== riesgoFiltro) return false;
    if (estadoFiltro && c.estado !== estadoFiltro) return false;
    if (urlId && c.id_cliente !== urlId) return false;
    if (busqueda.trim()) {
      const texto = [c.nombre, c.identificacion, c.id_cliente, c.estado, c.nivel_riesgo].filter(Boolean).join(' ').toLowerCase();
      if (!texto.includes(busqueda.trim().toLowerCase())) return false;
    }
    return true;
  };
  const baseFiltrada = clientes.filter(porFiltros);
  const esPendienteDecision = (c) => !['ACTIVO', 'BLOQUEADO', 'RECHAZADO'].includes(c.estado);
  const esParaSistema = (c) => esPendienteDecision(c) && (!c.nivel_riesgo || c.nivel_riesgo === 'BAJO');
  const esParaOficial = (c) => esPendienteDecision(c) && (['ESTANDAR', 'ALTO'].includes(c.nivel_riesgo) || c.estado === 'OBSERVADO' || c.estado === 'PENDIENTE_BF');

  const sistemaLista = baseFiltrada.filter(esParaSistema);
  const oficialLista = baseFiltrada.filter(esParaOficial);
  const altoLista = baseFiltrada.filter(c => esPendienteDecision(c) && c.nivel_riesgo === 'ALTO');
  const rechazadosLista = baseFiltrada.filter(c => c.estado === 'RECHAZADO');

  const pendientesBase = baseFiltrada.filter(esPendienteDecision);
  const pendientes = segmento === 'SISTEMA'
    ? sistemaLista
    : segmento === 'OFICIAL'
      ? oficialLista
      : segmento === 'ALTO'
        ? altoLista
        : estadoFiltro === 'RECHAZADO'
          ? rechazadosLista
          : pendientesBase;
  const casosSistema = sistemaLista.length;
  const casosOficial = oficialLista.length;
  const altoPendiente = altoLista.length;
  const pendientesPaginados = paginate(pendientes, page, pageSize);
  const conteosSegmento = {
    SISTEMA: casosSistema,
    OFICIAL: casosOficial,
    ALTO: altoPendiente,
  };

  useEffect(() => {
    const totalPages = pageCountFor(pendientes, pageSize);
    if (page > totalPages) setPage(totalPages);
  }, [pendientes, page, pageSize]);

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
            <div style={{ fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Decision automatica basada en riesgo
              <InfoHint label="Regla de activacion automatica" side="bottom">
                Solo riesgo BAJO puede activarse automaticamente, si documentos, perfiles, observaciones y BF relevantes cumplen las reglas.
              </InfoHint>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>
              Riesgo BAJO con documentos verificados, perfiles completos, sin observaciones y BF relevantes aprobados se activa automaticamente. Riesgo ESTANDAR o ALTO permanece en esta bandeja para revision, muestreo o decision manual.
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginTop: 22 }}>
        {SEGMENTOS.map(([key, label, Icon, info]) => (
          <div
            key={key}
            role="button"
            tabIndex={0}
            onClick={() => { setSegmento(segmento === key ? '' : key); setPage(1); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSegmento(segmento === key ? '' : key);
                setPage(1);
              }
            }}
            className="card"
            style={{ padding: 16, textAlign: 'left', borderColor: segmento === key ? 'rgba(212,175,55,0.6)' : undefined, cursor: 'pointer' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '22px minmax(0, auto) 18px', alignItems: 'center', columnGap: 10 }}>
              <Icon className="h-4 w-4 text-gold" />
              <span className="info-item-label" style={{ marginBottom: 0 }}>{label}</span>
              <InfoHint label={`Que significa ${label}`} side="bottom">{info}</InfoHint>
            </div>
            <div className="info-item-value" style={{ marginTop: 8 }}>{conteosSegmento[key] || 0}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 16, marginTop: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ width: 220 }}>
            <label className="label-upper">Tipo de cliente</label>
            <select value={tipoCliente} onChange={e => { setTipoCliente(e.target.value); setPage(1); }} className="select-field" style={{ width: '100%' }}>
              <option value="">Todos</option>
              <option value="NATURAL">Persona natural</option>
              <option value="JURIDICA">Persona juridica</option>
            </select>
          </div>
          <div style={{ width: 220 }}>
            <label className="label-upper label-with-hint">
              Riesgo
              <InfoHint label="Filtro de riesgo">Nivel calculado por el motor de riesgo. No equivale al estado de activacion.</InfoHint>
            </label>
            <select value={riesgoFiltro} onChange={e => { setRiesgoFiltro(e.target.value); setPage(1); }} className="select-field" style={{ width: '100%' }}>
              <option value="">Todos</option>
              <option value="BAJO">Bajo</option>
              <option value="ESTANDAR">Estandar</option>
              <option value="ALTO">Alto</option>
            </select>
          </div>
          <div style={{ width: 220 }}>
            <label className="label-upper label-with-hint">
              Estado
              <InfoHint label="Filtro de estado">Estado general del expediente. Un cliente puede estar observado por documentos, BF u observaciones abiertas.</InfoHint>
            </label>
            <select value={estadoFiltro} onChange={e => { setEstadoFiltro(e.target.value); setPage(1); }} className="select-field" style={{ width: '100%' }}>
              <option value="">Todos</option>
              {ESTADOS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 260, flex: 1 }}>
            <label className="label-upper" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Search className="h-3.5 w-3.5" /> Busqueda</label>
            <input value={busqueda} onChange={e => { setBusqueda(e.target.value); setPage(1); }} placeholder="Nombre, cedula, RUC o ID..." className="input-field" style={{ width: '100%' }} />
          </div>
          <button
            onClick={() => {
              setTipoCliente('');
              setRiesgoFiltro('');
              setEstadoFiltro('');
              setSegmento('');
              setBusqueda('');
              setPage(1);
            }}
            className="btn-secondary"
            style={{ padding: '12px 18px' }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {clienteAsistido && (
        <div style={{ marginTop: 18 }}>
          <AIAssistantPanel
            clienteId={clienteAsistido.id_cliente}
            tipoCliente={clienteAsistido.tipo_cliente}
            actions={['resumen', 'screening', 'prioridad', 'observacion', 'buscar']}
            title={`Asistente IA para activar: ${clienteAsistido.nombre || clienteAsistido.identificacion || 'expediente'}`}
          />
        </div>
      )}

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
              <th>
                <span className="label-with-hint">
                  Estado
                  <InfoHint label="Estado de expediente" side="bottom">Fase general del expediente dentro del flujo de cumplimiento.</InfoHint>
                </span>
              </th>
              <th>
                <span className="label-with-hint">
                  Riesgo
                  <InfoHint label="Riesgo de activacion" side="bottom">Nivel de riesgo calculado. Alto exige confirmacion manual antes de activar.</InfoHint>
                </span>
              </th>
              <th>Condicion</th>
              <th style={{ textAlign: 'right', minWidth: 270 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pendientesPaginados.map(c => (
              <tr key={c.id_cliente}>
                {renderInfoCliente(c)}
                <td style={{ maxWidth: 260, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.45 }}>
                  {detalleEstado(c)}
                </td>
                <td style={{ textAlign: 'right', minWidth: 270 }}>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'nowrap' }}>
                    <button onClick={() => setClienteAsistido(c)} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12, minWidth: 92, whiteSpace: 'nowrap' }}>
                      Asistir
                    </button>
                    {puedeActivar(c) ? (
                      <button onClick={() => activar(c)} className="btn-success" style={{ padding: '8px 16px', fontSize: 12, minWidth: 108, whiteSpace: 'nowrap' }}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Activar
                      </button>
                    ) : (
                      <button onClick={() => navigate(accionResolucion(c).path)} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 12, minWidth: 142, whiteSpace: 'nowrap' }}>
                        {accionResolucion(c).label}
                      </button>
                    )}
                    {puedeRechazar(c) && (
                      <button onClick={() => rechazar(c)} className="btn-danger" style={{ padding: '8px 16px', fontSize: 12, minWidth: 108, whiteSpace: 'nowrap' }}>
                        <XCircle className="h-3.5 w-3.5" /> Rechazar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {pendientes.length === 0 && (
              <tr><td colSpan={7}><EmptyState icon={ShieldCheck} title="Sin decisiones pendientes" message="No hay expedientes con estos filtros. Los casos bajo riesgo completos salen de esta lista al activarse automaticamente." /></td></tr>
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
    </div>
  );
}
