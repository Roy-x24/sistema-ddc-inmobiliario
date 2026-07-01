import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import EstadoBadge from '../components/EstadoBadge';
import RiesgoIndicador from '../components/RiesgoIndicador';
import AIAssistantPanel from '../components/AIAssistantPanel';
import {
  FileText, FileSpreadsheet, Shield, AlertTriangle, MessageSquare,
  UserCheck, ArrowLeft, User, Mail, Phone, MapPin, Building2, Briefcase, Bot, CheckCircle2, XCircle, Clock3, LockKeyhole, ArrowRight
} from 'lucide-react';

export default function DetalleExpediente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [cliente, setCliente] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [resumenAI, setResumenAI] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    api.get(`/clientes/${id}`).then(res => {
      setCliente(res.data);
    }).catch(() => setCliente(null)).finally(() => setCargando(false));
    api.post(`/clientes/${id}/checklist`).then(res => setChecklist(res.data)).catch(() => setChecklist(null));
  }, [id]);

  const generarResumenAI = async () => {
    try {
      const res = await api.post(`/ai/clientes/${id}/resumen`);
      setResumenAI(res.data);
    } catch {
      setResumenAI(null);
    }
  };

  if (cargando) return (
    <div className="animate-fade-in-up" style={{ color: 'var(--text-muted)', padding: 40 }}>
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        Cargando expediente...
      </div>
    </div>
  );

  if (!cliente) return (
    <div className="animate-fade-in-up" style={{ color: 'var(--text-muted)', padding: 40 }}>
      Expediente no encontrado
    </div>
  );

  const detalle = cliente.detalle || {};

  const navActions = [
    { label: 'Documentos', icon: FileText, path: `/documentos/${id}`, roles: ['empleado', 'oficial_cumplimiento'] },
    { label: 'Perfiles', icon: FileSpreadsheet, path: `/perfiles/${id}`, roles: ['empleado'] },
    { label: 'Riesgo', icon: Shield, path: `/riesgo/${id}`, roles: ['oficial_cumplimiento', 'auditor'] },
    { label: 'Observaciones', icon: MessageSquare, path: `/observaciones/${id}`, roles: ['empleado', 'oficial_cumplimiento'] },
    { label: 'Beneficiarios', icon: UserCheck, path: `/beneficiarios/${id}`, roles: ['empleado', 'oficial_cumplimiento'], tipos: ['JURIDICA'] },
    { label: 'Activación', icon: AlertTriangle, path: `/activacion/${id}`, roles: ['oficial_cumplimiento'] },
  ];
  const puedeUsarIAExpediente = ['oficial_cumplimiento', 'admin', 'auditor'].includes(usuario?.rol);

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => navigate('/clientes')} className="link-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a clientes
        </button>
        <h1 style={{ fontSize: 28 }}>Expediente</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Detalle completo del cliente</p>
      </div>

      {/* Actions bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24, marginTop: 20 }}>
        {navActions.filter(a => a.roles.includes(usuario?.rol || '') && (!a.tipos || a.tipos.includes(cliente.tipo_cliente))).map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: 12 }}
          >
            <a.icon className="h-3.5 w-3.5" />
            {a.label}
          </button>
        ))}
        {puedeUsarIAExpediente && (
          <button onClick={generarResumenAI} className="btn-primary" style={{ padding: '8px 14px', fontSize: 12 }}>
            <Bot className="h-3.5 w-3.5" />
            Resumen IA
          </button>
        )}
      </div>

      {puedeUsarIAExpediente && (
        <div style={{ marginBottom: 20 }}>
          <AIAssistantPanel
            clienteId={id}
            tipoCliente={cliente.tipo_cliente}
            context="expediente"
            metadata={{
              estado: cliente.estado,
              riesgo: cliente.nivel_riesgo,
            }}
          />
        </div>
      )}

      {checklist && (
        <div className="card" style={{ padding: 22, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <div className="info-item-label">Checklist global del expediente</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>
                {checklist.ready_for_officer ? 'Expediente listo para revisión' : `${checklist.blocking_count} bloqueo(s) por resolver`}
              </h2>
              <p style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.55 }}>
                Esta checklist centraliza lo que debe estar completo antes de activar: datos, perfiles, documentos, BF, observaciones, riesgo y controles.
              </p>
            </div>
            <span className="badge" style={{ backgroundColor: checklist.ready_for_officer ? 'rgba(22,163,74,0.1)' : 'rgba(212,175,55,0.12)', color: checklist.ready_for_officer ? '#16A34A' : '#B7791F', border: '1px solid rgba(148,163,184,0.2)' }}>
              {checklist.ready_for_officer ? 'Listo' : 'En progreso'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
            {checklist.items.map((item) => (
              <ChecklistItemCard key={item.key} item={item} onNavigate={(route) => navigate(route)} />
            ))}
          </div>
        </div>
      )}

      {resumenAI && (
        <div className="card" style={{ padding: 18, marginBottom: 20, borderColor: 'rgba(20,184,166,0.25)', background: 'linear-gradient(135deg, rgba(20,184,166,0.08), rgba(255,255,255,0.96))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Bot className="h-5 w-5 text-gold" />
            <h2 style={{ fontSize: 18, fontWeight: 900 }}>Resumen asistido del expediente</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{resumenAI.titulo}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 14 }}>
            <div>
              <div className="info-item-label">Bloqueos detectados</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
                {resumenAI.bloqueos?.length ? resumenAI.bloqueos.map(b => b.message).join('; ') : 'Sin bloqueos críticos.'}
              </div>
            </div>
            <div>
              <div className="info-item-label">Eventos fuente</div>
              <div className="info-item-value">{resumenAI.eventos_fuente?.length || 0}</div>
            </div>
            <div>
              <div className="info-item-label">Guardrail</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{resumenAI.nota_guardrail}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 32, marginTop: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
          <EstadoBadge estado={cliente.estado} />
          {cliente.nivel_riesgo && <RiesgoIndicador nivel={cliente.nivel_riesgo} />}
          {cliente.es_pep && <span className="badge" style={{ backgroundColor: 'rgba(220,38,38,0.1)', color: '#F87171', border: '1px solid rgba(220,38,38,0.2)' }}>PEP</span>}
        </div>

        <div className="info-grid" style={{ marginBottom: 24 }}>
          <Info label="ID del expediente" value={cliente.id_cliente} mono />
          <Info label="Tipo de cliente" value={cliente.tipo_cliente === 'NATURAL' ? 'Persona natural' : 'Persona jurídica'} />
          <Info label="Registrado por" value={cliente.registrado_por} />
          <Info label="Fecha de registro" value={new Date(cliente.fecha_registro).toLocaleString()} />
        </div>

        <div className="ornament" style={{ margin: '24px 0' }}><span>Detalles</span></div>

        {cliente.tipo_cliente === 'NATURAL' && (
          <div className="info-grid">
            <Info label="Nombres" value={detalle.nombres} />
            <Info label="Apellidos" value={detalle.apellidos} />
            <Info label="Documento" value={`${detalle.tipo_documento || ''} ${detalle.numero_documento || ''}`} />
            <Info label="Nacionalidad" value={detalle.nacionalidad} />
            <Info label="País de residencia" value={detalle.pais_residencia} />
            <Info label="Dirección" value={detalle.direccion} icon={MapPin} />
            <Info label="Teléfono" value={detalle.telefono} icon={Phone} />
            <Info label="Correo" value={detalle.correo} icon={Mail} />
            <Info label="Ocupación" value={detalle.ocupacion} icon={Briefcase} />
          </div>
        )}

        {cliente.tipo_cliente === 'JURIDICA' && (
          <>
            <div className="info-grid">
              <Info label="Razón social" value={detalle.razon_social} icon={Building2} />
              <Info label="RUC" value={detalle.ruc} />
              <Info label="Tipo de persona jurídica" value={detalle.tipo_pj} />
              <Info label="País de constitución" value={detalle.pais_constitucion} />
              <Info label="Actividad económica" value={detalle.actividad_economica} />
              <Info label="Domicilio legal" value={detalle.domicilio_legal} icon={MapPin} />
              <Info label="Teléfono" value={detalle.telefono} icon={Phone} />
              <Info label="Correo" value={detalle.correo} icon={Mail} />
            </div>

            {detalle.representantes_legales?.length > 0 && (
              <>
                <div className="ornament" style={{ margin: '28px 0' }}><span>Representante legal</span></div>
                <div className="info-grid">
                  {detalle.representantes_legales.map((r, i) => (
                    <div key={i} className="card" style={{ padding: 16 }}>
                      <Info label="Nombre" value={r.nombre_completo} icon={User} />
                      <Info label="Identificación" value={r.numero_identificacion} />
                      <Info label="Cargo" value={r.cargo} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {detalle.beneficiarios_finales?.length > 0 && (
              <>
                <div className="ornament" style={{ margin: '28px 0' }}><span>Beneficiarios finales</span></div>
                <div className="info-grid">
                  {detalle.beneficiarios_finales.map((b, i) => (
                    <div key={i} className="card" style={{ padding: 16 }}>
                      <Info label="Nombre" value={b.nombre_completo} icon={User} />
                      <Info label="Documento" value={b.numero_documento} />
                      <Info label="Nacionalidad" value={b.nacionalidad} />
                      <Info label="Participación" value={`${b.porcentaje_participacion}%`} />
                      {b.es_pep && <span className="badge" style={{ backgroundColor: 'rgba(220,38,38,0.1)', color: '#F87171', border: '1px solid rgba(220,38,38,0.2)', marginTop: 8 }}>PEP</span>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ChecklistItemCard({ item, onNavigate }) {
  const ok = item.status === 'COMPLETO' || item.status === 'NO_APLICA';
  const pending = item.status === 'PENDIENTE';
  const Icon = ok ? CheckCircle2 : item.blocking ? LockKeyhole : pending ? Clock3 : XCircle;
  const tone = ok
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : item.blocking
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${tone}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">{item.owner || 'sistema'}</div>
            <h3 className="mt-1 text-sm font-black text-slate-950">{item.label}</h3>
          </div>
        </div>
        <span className={`rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-widest ${tone}`}>
          {item.status}
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{item.message}</p>
      {item.details?.faltantes?.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs font-bold text-amber-700">
          Faltan: {item.details.faltantes.join(', ')}
        </div>
      )}
      {item.details?.pendientes?.length > 0 && (
        <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs font-bold text-blue-700">
          Pendientes: {item.details.pendientes.join(', ')}
        </div>
      )}
      {item.action && item.action_route && (
        <button
          type="button"
          onClick={() => onNavigate(item.action_route)}
          className="btn-secondary mt-4"
          style={{ padding: '7px 10px', fontSize: 12 }}
        >
          {item.action} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function Info({ label, value, mono, icon: Icon }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        {Icon && <Icon className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />}
        <div className="info-item-label">{label}</div>
      </div>
      <div className="info-item-value" style={{ fontFamily: mono ? 'monospace' : 'var(--font-body)', fontSize: mono ? 13 : 14 }}>{value || '-'}</div>
    </div>
  );
}
