import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import EstadoBadge from '../components/EstadoBadge';
import RiesgoIndicador from '../components/RiesgoIndicador';

export default function DetalleExpediente() {
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get(`/clientes/${id}`).then(res => {
      setCliente(res.data);
    }).finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <div style={{ color: 'var(--text-muted)', padding: 40 }}>Cargando expediente...</div>;
  if (!cliente) return <div style={{ color: 'var(--text-muted)', padding: 40 }}>Expediente no encontrado</div>;

  const detalle = cliente.detalle || {};

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Expediente</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Detalle completo del cliente</p>
      </div>

      <div className="card" style={{ padding: 32, marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
          <EstadoBadge estado={cliente.estado} />
          {cliente.nivel_riesgo && <RiesgoIndicador nivel={cliente.nivel_riesgo} />}
          {cliente.es_pep && <span className="badge" style={{ backgroundColor: 'rgba(220,38,38,0.1)', color: '#F87171', border: '1px solid rgba(220,38,38,0.2)' }}>PEP</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, fontSize: 14 }}>
          <Info label="ID del expediente" value={cliente.id_cliente} mono />
          <Info label="Tipo de cliente" value={cliente.tipo_cliente} />
          <Info label="Registrado por" value={cliente.registrado_por} />
          <Info label="Fecha de registro" value={new Date(cliente.fecha_registro).toLocaleString()} />
        </div>

        <hr style={{ margin: '28px 0', border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

        {cliente.tipo_cliente === 'NATURAL' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, fontSize: 14 }}>
            <Info label="Nombres" value={detalle.nombres} />
            <Info label="Apellidos" value={detalle.apellidos} />
            <Info label="Documento" value={`${detalle.tipo_documento} ${detalle.numero_documento}`} />
            <Info label="Nacionalidad" value={detalle.nacionalidad} />
            <Info label="País de residencia" value={detalle.pais_residencia} />
            <Info label="Dirección" value={detalle.direccion} />
            <Info label="Teléfono" value={detalle.telefono} />
            <Info label="Correo" value={detalle.correo} />
            <Info label="Ocupación" value={detalle.ocupacion} />
          </div>
        )}

        {cliente.tipo_cliente === 'JURIDICA' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, fontSize: 14 }}>
              <Info label="Razón social" value={detalle.razon_social} />
              <Info label="RUC" value={detalle.ruc} />
              <Info label="Tipo" value={detalle.tipo_pj} />
              <Info label="País de constitución" value={detalle.pais_constitucion} />
              <Info label="Actividad económica" value={detalle.actividad_economica} />
              <Info label="Domicilio legal" value={detalle.domicilio_legal} />
              <Info label="Teléfono" value={detalle.telefono} />
              <Info label="Correo" value={detalle.correo} />
            </div>
            <div style={{ marginTop: 28 }}>
              <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--accent-gold)', fontFamily: 'var(--font-display)' }}>Representante legal</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {detalle.representantes_legales?.map((r, i) => (
                  <div key={i} className="card" style={{ padding: 16 }}>
                    <Info label="Nombre" value={r.nombre_completo} />
                    <Info label="Identificación" value={r.numero_identificacion} />
                    <Info label="Cargo" value={r.cargo} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 28 }}>
              <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--accent-gold)', fontFamily: 'var(--font-display)' }}>Beneficiarios finales</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {detalle.beneficiarios_finales?.map((b, i) => (
                  <div key={i} className="card" style={{ padding: 16 }}>
                    <Info label="Nombre" value={b.nombre_completo} />
                    <Info label="Documento" value={b.numero_documento} />
                    <Info label="Nacionalidad" value={b.nacionalidad} />
                    <Info label="Participación" value={`${b.porcentaje_participacion}%`} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Info({ label, value, mono }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: mono ? 'monospace' : 'var(--font-body)', fontSize: mono ? 13 : 14, wordBreak: 'break-word' }}>{value || '-'}</div>
    </div>
  );
}
