import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import EstadoBadge from '../components/EstadoBadge';
import RiesgoIndicador from '../components/RiesgoIndicador';
import {
  FileText, FileSpreadsheet, Shield, AlertTriangle, MessageSquare,
  UserCheck, ArrowLeft, Clock, User, Mail, Phone, MapPin, Building2, Briefcase
} from 'lucide-react';

export default function DetalleExpediente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    api.get(`/clientes/${id}`).then(res => {
      setCliente(res.data);
    }).catch(() => setCliente(null)).finally(() => setCargando(false));
  }, [id]);

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
    { label: 'Beneficiarios', icon: UserCheck, path: `/beneficiarios/${id}`, roles: ['empleado', 'oficial_cumplimiento'] },
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
        {navActions.filter(a => a.roles.includes(usuario?.rol || '')).map((a) => (
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
      </div>

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
