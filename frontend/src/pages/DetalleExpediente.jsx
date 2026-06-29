import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import EstadoBadge from '../components/EstadoBadge';
import RiesgoIndicador from '../components/RiesgoIndicador';
import {
  FileText, FileSpreadsheet, Shield, AlertTriangle, MessageSquare,
  UserCheck, ArrowLeft, User, Mail, Phone, MapPin, Building2, Briefcase, Bot, CheckCircle2, XCircle
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
        <button onClick={generarResumenAI} className="btn-primary" style={{ padding: '8px 14px', fontSize: 12 }}>
          <Bot className="h-3.5 w-3.5" />
          Resumen IA
        </button>
      </div>

      {checklist && (
        <div className="card" style={{ padding: 18, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <div>
              <div className="info-item-label">Checklist operativo</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)' }}>
                {checklist.ready_for_officer ? 'Expediente listo para revisión' : `${checklist.blocking_count} bloqueo(s) por resolver`}
              </h2>
            </div>
            <span className="badge" style={{ backgroundColor: checklist.ready_for_officer ? 'rgba(22,163,74,0.1)' : 'rgba(212,175,55,0.12)', color: checklist.ready_for_officer ? '#16A34A' : '#B7791F', border: '1px solid rgba(148,163,184,0.2)' }}>
              {checklist.ready_for_officer ? 'Listo' : 'En progreso'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
            {checklist.items.map((item) => {
              const ok = item.status === 'COMPLETO' || item.status === 'NO_APLICA';
              return (
                <div key={item.key} className="card" style={{ padding: 14, borderColor: item.blocking ? 'rgba(220,38,38,0.22)' : undefined }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-amber-600" />}
                    <div className="info-item-label" style={{ marginBottom: 0 }}>{item.label}</div>
                  </div>
                  <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.45 }}>{item.message}</div>
                  {item.action && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: 'var(--accent-gold)' }}>{item.action}</div>}
                </div>
              );
            })}
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
