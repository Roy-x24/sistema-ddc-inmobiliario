import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function RegistroJuridica() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    razon_social: '', ruc: '', tipo_pj: 'SA', pais_constitucion: '', actividad_economica: '',
    domicilio_legal: '', telefono: '', correo: '', proposito_adquisicion: '',
    representante_legal: { nombre_completo: '', numero_identificacion: '', cargo: '', poderes_otorgados: '' },
    beneficiarios_finales: [{ nombre_completo: '', numero_documento: '', nacionalidad: '', porcentaje_participacion: '', tipo_control: 'directo', es_pep: false }],
    es_pep: false, fuente_ingresos: '', rango_ingresos: '', origen_fondos: '', monto_estimado: ''
  });
  const [guardando, setGuardando] = useState(false);
  const navigate = useNavigate();

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updateRL = (field, value) => setForm(prev => ({ ...prev, representante_legal: { ...prev.representante_legal, [field]: value } }));
  const updateBF = (idx, field, value) => {
    const bfs = [...form.beneficiarios_finales];
    bfs[idx] = { ...bfs[idx], [field]: value };
    setForm(prev => ({ ...prev, beneficiarios_finales: bfs }));
  };

  const agregarBF = () => {
    setForm(prev => ({ ...prev, beneficiarios_finales: [...prev.beneficiarios_finales, { nombre_completo: '', numero_documento: '', nacionalidad: '', porcentaje_participacion: '', tipo_control: 'directo', es_pep: false }] }));
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const payload = {
        ...form,
        monto_estimado: parseFloat(form.monto_estimado),
        beneficiarios_finales: form.beneficiarios_finales.map(b => ({ ...b, porcentaje_participacion: parseFloat(b.porcentaje_participacion) }))
      };
      await api.post('/clientes/juridica', payload);
      navigate('/clientes');
    } catch (e) {
      alert('Error al registrar: ' + (e.response?.data?.detail || e.message));
    } finally {
      setGuardando(false);
    }
  };

  const input = (label, field, type = 'text', value, onChange) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} className="input-field" />
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 22 }}>Persona jurídica</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Registro de empresa o entidad</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, marginTop: 16 }}>
        <div style={{
          padding: '8px 16px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: step === 1 ? 'rgba(201, 162, 39, 0.12)' : 'transparent',
          color: step === 1 ? 'var(--accent-gold)' : 'var(--text-muted)',
          fontWeight: 700,
          fontSize: 12,
          border: `1px solid ${step === 1 ? 'rgba(201, 162, 39, 0.3)' : 'var(--border-subtle)'}`
        }}>1. Datos de la empresa</div>
        <div style={{
          padding: '8px 16px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: step === 2 ? 'rgba(201, 162, 39, 0.12)' : 'transparent',
          color: step === 2 ? 'var(--accent-gold)' : 'var(--text-muted)',
          fontWeight: 700,
          fontSize: 12,
          border: `1px solid ${step === 2 ? 'rgba(201, 162, 39, 0.3)' : 'var(--border-subtle)'}`
        }}>2. Representantes, beneficiarios y transacción</div>
      </div>

      <div className="card" style={{ padding: 28 }}>
        {step === 1 && (
          <>
            {input('Razón social', 'razon_social', 'text', form.razon_social, e => update('razon_social', e.target.value))}
            {input('RUC o número de registro', 'ruc', 'text', form.ruc, e => update('ruc', e.target.value))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>Tipo de persona jurídica</label>
              <select value={form.tipo_pj} onChange={e => update('tipo_pj', e.target.value)} className="select-field" style={{ width: '100%' }}>
                <option value="SA">Sociedad Anónima (SA)</option>
                <option value="SRL">Sociedad de Responsabilidad Limitada (SRL)</option>
                <option value="fideicomiso">Fideicomiso</option>
                <option value="fundacion">Fundación</option>
                <option value="otra">Otra</option>
              </select>
            </div>
            {input('País de constitución', 'pais_constitucion', 'text', form.pais_constitucion, e => update('pais_constitucion', e.target.value))}
            {input('Actividad económica principal', 'actividad_economica', 'text', form.actividad_economica, e => update('actividad_economica', e.target.value))}
            {input('Domicilio legal', 'domicilio_legal', 'text', form.domicilio_legal, e => update('domicilio_legal', e.target.value))}
            {input('Teléfono', 'telefono', 'text', form.telefono, e => update('telefono', e.target.value))}
            {input('Correo oficial', 'correo', 'email', form.correo, e => update('correo', e.target.value))}
            {input('Propósito de la adquisición', 'proposito_adquisicion', 'text', form.proposito_adquisicion, e => update('proposito_adquisicion', e.target.value))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button onClick={() => setStep(2)} className="btn-primary" style={{ padding: '12px 28px' }}>Siguiente</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 style={{ fontSize: 14, color: 'var(--accent-gold)', fontFamily: 'var(--font-display)', marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>Representante legal</h3>
            {input('Nombre completo', 'rl_nombre', 'text', form.representante_legal.nombre_completo, e => updateRL('nombre_completo', e.target.value))}
            {input('Número de identificación', 'rl_id', 'text', form.representante_legal.numero_identificacion, e => updateRL('numero_identificacion', e.target.value))}
            {input('Cargo', 'rl_cargo', 'text', form.representante_legal.cargo, e => updateRL('cargo', e.target.value))}
            {input('Poderes otorgados', 'rl_poderes', 'text', form.representante_legal.poderes_otorgados, e => updateRL('poderes_otorgados', e.target.value))}

            <h3 style={{ fontSize: 14, color: 'var(--accent-gold)', fontFamily: 'var(--font-display)', margin: '24px 0 16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>Beneficiarios finales</h3>
            {form.beneficiarios_finales.map((b, i) => (
              <div key={i} className="card" style={{ padding: 20, marginBottom: 12, backgroundColor: 'var(--bg-elevated)' }}>
                {input('Nombre completo', `bf_${i}_nombre`, 'text', b.nombre_completo, e => updateBF(i, 'nombre_completo', e.target.value))}
                {input('Número de documento', `bf_${i}_doc`, 'text', b.numero_documento, e => updateBF(i, 'numero_documento', e.target.value))}
                {input('Nacionalidad', `bf_${i}_nac`, 'text', b.nacionalidad, e => updateBF(i, 'nacionalidad', e.target.value))}
                {input('Porcentaje de participación (≥25%)', `bf_${i}_pct`, 'number', b.porcentaje_participacion, e => updateBF(i, 'porcentaje_participacion', e.target.value))}
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={b.es_pep} onChange={e => updateBF(i, 'es_pep', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent-gold)' }} />
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>¿Es PEP?</span>
                </label>
              </div>
            ))}
            <button onClick={agregarBF} className="btn-secondary" style={{ marginBottom: 24 }}>+ Agregar beneficiario</button>

            <h3 style={{ fontSize: 14, color: 'var(--accent-gold)', fontFamily: 'var(--font-display)', margin: '24px 0 16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>Perfil y transacción</h3>
            {input('Fuente de ingresos', 'fuente_ingresos', 'text', form.fuente_ingresos, e => update('fuente_ingresos', e.target.value))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>Rango de ingresos mensuales</label>
              <select value={form.rango_ingresos} onChange={e => update('rango_ingresos', e.target.value)} className="select-field" style={{ width: '100%' }}>
                <option value="">Seleccione</option>
                <option value="<1000">&lt; $1,000</option>
                <option value="1001-5000">$1,001 - $5,000</option>
                <option value="5001-15000">$5,001 - $15,000</option>
                <option value=">15000">&gt; $15,000</option>
              </select>
            </div>
            {input('Origen de los fondos', 'origen_fondos', 'text', form.origen_fondos, e => update('origen_fondos', e.target.value))}
            {input('Monto estimado (USD)', 'monto_estimado', 'number', form.monto_estimado, e => update('monto_estimado', e.target.value))}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button onClick={() => setStep(1)} className="btn-secondary" style={{ padding: '12px 28px' }}>Atrás</button>
              <button onClick={guardar} disabled={guardando} className="btn-primary" style={{ padding: '12px 28px', opacity: guardando ? 0.7 : 1 }}>
                {guardando ? 'Guardando...' : 'Guardar cliente'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
