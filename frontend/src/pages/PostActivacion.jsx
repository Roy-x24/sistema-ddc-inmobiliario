import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import EstadoBadge from '../components/EstadoBadge';
import RiesgoIndicador from '../components/RiesgoIndicador';
import EmptyState from '../components/EmptyState';
import PaginationControls from '../components/PaginationControls';
import InfoHint from '../components/InfoHint';
import AIAssistantPanel from '../components/AIAssistantPanel';
import DecisionModal from '../components/DecisionModal';
import { AlertTriangle, CheckCircle2, Lock, RotateCcw, Search, Unlock } from 'lucide-react';
import { tipoClienteBadgeClass, tipoClienteLabel } from '../utils/clientesUi';
import { pageCountFor, paginate } from '../utils/pagination';

const SEGMENTOS = [
  ['ACTIVOS', 'Activos', CheckCircle2, 'Clientes aprobados para operar. Pueden bloquearse o devolverse a revision si la activacion fue un error.'],
  ['BLOQUEADOS', 'Bloqueados', Lock, 'Clientes activos suspendidos por decision de cumplimiento. Pueden desbloquearse si el motivo queda resuelto.'],
];

export default function PostActivacion() {
  const [clientes, setClientes] = useState([]);
  const [segmento, setSegmento] = useState('ACTIVOS');
  const [tipoCliente, setTipoCliente] = useState('');
  const [riesgoFiltro, setRiesgoFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [errores, setErrores] = useState([]);
  const [clienteAsistido, setClienteAsistido] = useState(null);
  const [decision, setDecision] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const cargar = async () => {
    const res = await api.get('/clientes/?limit=9999');
    setClientes(res.data || []);
  };

  useEffect(() => { cargar(); }, []);

  const mostrarMensaje = (texto) => {
    setMensaje(texto);
    setErrores([]);
    setTimeout(() => setMensaje(''), 4000);
  };

  const mostrarError = (texto) => {
    setErrores([texto]);
    setMensaje('');
    setTimeout(() => setErrores([]), 8000);
  };

  const porFiltros = (c) => {
    if (tipoCliente && c.tipo_cliente !== tipoCliente) return false;
    if (riesgoFiltro && c.nivel_riesgo !== riesgoFiltro) return false;
    if (busqueda.trim()) {
      const texto = [c.nombre, c.identificacion, c.id_cliente, c.estado, c.nivel_riesgo].filter(Boolean).join(' ').toLowerCase();
      if (!texto.includes(busqueda.trim().toLowerCase())) return false;
    }
    return true;
  };

  const baseFiltrada = clientes.filter(porFiltros);
  const activos = baseFiltrada.filter(c => c.estado === 'ACTIVO');
  const bloqueados = baseFiltrada.filter(c => c.estado === 'BLOQUEADO');
  const lista = segmento === 'BLOQUEADOS' ? bloqueados : activos;
  const paginados = paginate(lista, page, pageSize);

  useEffect(() => {
    const totalPages = pageCountFor(lista, pageSize);
    if (page > totalPages) setPage(totalPages);
  }, [lista, page, pageSize]);

  const ejecutarBloqueo = async (cliente, motivo) => {
    try {
      await api.patch(`/clientes/${cliente.id_cliente}/bloquear?motivo=${encodeURIComponent(motivo)}`);
      mostrarMensaje('Cliente bloqueado');
      cargar();
    } catch (err) {
      mostrarError(err.response?.data?.detail || 'Error al bloquear cliente');
    }
  };

  const ejecutarDesbloqueo = async (cliente) => {
    try {
      await api.patch(`/clientes/${cliente.id_cliente}/desbloquear`);
      mostrarMensaje('Cliente desbloqueado');
      cargar();
    } catch (err) {
      mostrarError(err.response?.data?.detail || 'Error al desbloquear cliente');
    }
  };

  const ejecutarReversion = async (cliente, motivo) => {
    try {
      await api.patch(`/clientes/${cliente.id_cliente}/revertir-activacion?motivo=${encodeURIComponent(motivo)}`);
      mostrarMensaje('Activacion revertida. El expediente volvio a revision.');
      cargar();
    } catch (err) {
      mostrarError(err.response?.data?.detail || 'Error al revertir activacion');
    }
  };

  const abrirDecision = (type, cliente) => {
    const baseDetails = [
      `Cliente: ${cliente.nombre || cliente.identificacion || cliente.id_cliente}`,
      `Estado actual: ${cliente.estado}`,
      `Riesgo: ${cliente.nivel_riesgo || 'Sin calcular'}`,
    ];
    const configs = {
      bloquear: {
        title: 'Bloquear cliente activo',
        description: 'El bloqueo suspende la operación del cliente y debe estar sustentado por una alerta o corrección posterior.',
        tone: 'danger',
        actionLabel: 'Bloquear',
        requireReason: true,
        reasonLabel: 'Motivo de bloqueo',
        reasonPlaceholder: 'Ej: alerta posterior, documentación vencida, coincidencia PEP/sanciones...',
        confirmText: 'BLOQUEAR',
      },
      desbloquear: {
        title: 'Desbloquear cliente',
        description: 'Confirma que el motivo de bloqueo fue resuelto y que el cliente puede volver a operar.',
        tone: 'success',
        actionLabel: 'Desbloquear',
        confirmText: 'DESBLOQUEAR',
      },
      revertir: {
        title: 'Revertir activacion',
        description: 'Devuelve el expediente a revisión cuando una activación fue hecha por error o falta nueva validación.',
        tone: 'neutral',
        actionLabel: 'Revertir activacion',
        requireReason: true,
        reasonLabel: 'Motivo de reversion',
        reasonPlaceholder: 'Ej: activación accidental, documento observado después de activar, alerta pendiente...',
        confirmText: 'REVERTIR',
      },
    };
    setDecision({ type, cliente, details: baseDetails, ...configs[type] });
  };

  const confirmarDecision = async ({ reason }) => {
    if (!decision?.cliente) return;
    if (decision.type === 'bloquear') await ejecutarBloqueo(decision.cliente, reason);
    if (decision.type === 'desbloquear') await ejecutarDesbloqueo(decision.cliente);
    if (decision.type === 'revertir') await ejecutarReversion(decision.cliente, reason);
  };

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Post-activacion</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Gestion de clientes ya activados: bloqueos, desbloqueos y correcciones operativas auditadas.
        </p>
      </div>

      {mensaje && <div className="success-banner">{mensaje}</div>}
      {errores.length > 0 && (
        <div className="error-banner">
          <div className="error-banner-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle className="h-4 w-4" /> No se pudo completar la accion
          </div>
          {errores.map((e, i) => <div key={i} style={{ fontSize: 13 }}>{e}</div>)}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginTop: 22 }}>
        {SEGMENTOS.map(([key, label, Icon, info]) => (
          <div
            key={key}
            role="button"
            tabIndex={0}
            onClick={() => { setSegmento(key); setPage(1); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSegmento(key);
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
            <div className="info-item-value" style={{ marginTop: 8 }}>{key === 'ACTIVOS' ? activos.length : bloqueados.length}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 16, marginTop: 18, display: 'grid', gridTemplateColumns: '220px 220px minmax(260px, 1fr) auto', gap: 12, alignItems: 'end' }}>
        <div>
          <label className="label-upper">Tipo de cliente</label>
          <select value={tipoCliente} onChange={e => { setTipoCliente(e.target.value); setPage(1); }} className="select-field" style={{ width: '100%' }}>
            <option value="">Todos</option>
            <option value="NATURAL">Persona natural</option>
            <option value="JURIDICA">Persona juridica</option>
          </select>
        </div>
        <div>
          <label className="label-upper">Riesgo</label>
          <select value={riesgoFiltro} onChange={e => { setRiesgoFiltro(e.target.value); setPage(1); }} className="select-field" style={{ width: '100%' }}>
            <option value="">Todos</option>
            <option value="BAJO">Bajo</option>
            <option value="ESTANDAR">Estandar</option>
            <option value="ALTO">Alto</option>
          </select>
        </div>
        <div>
          <label className="label-upper" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Search className="h-3.5 w-3.5" /> Busqueda</label>
          <input value={busqueda} onChange={e => { setBusqueda(e.target.value); setPage(1); }} placeholder="Nombre, cedula, RUC o ID..." className="input-field" style={{ width: '100%' }} />
        </div>
        <button onClick={() => { setTipoCliente(''); setRiesgoFiltro(''); setBusqueda(''); setPage(1); }} className="btn-secondary" style={{ padding: '12px 18px' }}>Limpiar</button>
      </div>

      {clienteAsistido && (
        <div style={{ marginTop: 18 }}>
          <AIAssistantPanel
            clienteId={clienteAsistido.id_cliente}
            tipoCliente={clienteAsistido.tipo_cliente}
            actions={['resumen', 'screening', 'prioridad', 'observacion', 'buscar']}
            title={`Asistente IA post-activacion: ${clienteAsistido.nombre || clienteAsistido.identificacion}`}
          />
        </div>
      )}

      <div className="table-container" style={{ marginTop: 16 }}>
        <div style={{ padding: '16px 18px 0' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{segmento === 'ACTIVOS' ? 'Clientes activos' : 'Clientes bloqueados'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            {segmento === 'ACTIVOS' ? 'Bloquea por alerta posterior o revierte activaciones hechas por error.' : 'Desbloquea cuando el motivo de suspension haya sido resuelto.'}
          </p>
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
            {paginados.map(c => (
              <tr key={c.id_cliente}>
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
                <td style={{ textAlign: 'right' }}>
                  {c.estado === 'ACTIVO' ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => setClienteAsistido(c)} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 12 }}>
                        Asistir
                      </button>
                      <button onClick={() => abrirDecision('revertir', c)} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 12 }}>
                        <RotateCcw className="h-3.5 w-3.5" /> Revertir
                      </button>
                      <button onClick={() => abrirDecision('bloquear', c)} className="btn-danger" style={{ padding: '8px 14px', fontSize: 12 }}>
                        <Lock className="h-3.5 w-3.5" /> Bloquear
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => setClienteAsistido(c)} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 12 }}>
                        Asistir
                      </button>
                      <button onClick={() => abrirDecision('desbloquear', c)} className="btn-success" style={{ padding: '8px 14px', fontSize: 12 }}>
                        <Unlock className="h-3.5 w-3.5" /> Desbloquear
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon={segmento === 'ACTIVOS' ? CheckCircle2 : Lock} title="Sin clientes para estos filtros" message="Cambia el segmento o limpia los filtros para revisar otros clientes post-activacion." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={lista.length}
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
