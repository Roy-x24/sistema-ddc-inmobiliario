import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

export default function RegistroNatural() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nombres: '', apellidos: '', tipo_documento: 'CEDULA', numero_documento: '', fecha_nacimiento: '',
    nacionalidad: '', pais_residencia: '', direccion: '', telefono: '', correo: '', ocupacion: '',
    es_pep: false, fuente_ingresos: '', rango_ingresos: '', proposito_transaccion: '',
    origen_fondos: '', monto_estimado: ''
  });
  const [guardando, setGuardando] = useState(false);
  const navigate = useNavigate();

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const guardar = async () => {
    setGuardando(true);
    try {
      const payload = { ...form, monto_estimado: parseFloat(form.monto_estimado), fecha_nacimiento: form.fecha_nacimiento };
      await api.post('/clientes/natural', payload);
      navigate('/clientes');
    } catch (e) {
      alert('Error al registrar: ' + (e.response?.data?.detail || e.message));
    } finally {
      setGuardando(false);
    }
  };

  const input = (label, field, type = 'text', opts = {}) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</label>
      {type === 'select' ? (
        <select value={form[field]} onChange={e => update(field, e.target.value)} className="select-field" style={{ width: '100%' }}>
          {opts.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={form[field]} onChange={e => update(field, e.target.value)} className="input-field" />
      )}
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 22 }}>Persona natural</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Registro de cliente individual</p>
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
        }}>1. Datos personales</div>
        <div style={{
          padding: '8px 16px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: step === 2 ? 'rgba(201, 162, 39, 0.12)' : 'transparent',
          color: step === 2 ? 'var(--accent-gold)' : 'var(--text-muted)',
          fontWeight: 700,
          fontSize: 12,
          border: `1px solid ${step === 2 ? 'rgba(201, 162, 39, 0.3)' : 'var(--border-subtle)'}`
        }}>2. Perfil y transacción</div>
      </div>

      <div className="card" style={{ padding: 28 }}>
        {step === 1 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {input('Nombres', 'nombres')}
              {input('Apellidos', 'apellidos')}
            </div>
            {input('Tipo de documento', 'tipo_documento', 'select', { options: [{ value: 'CEDULA', label: 'Cédula' }, { value: 'PASAPORTE', label: 'Pasaporte' }] })}
            {input('Número de documento', 'numero_documento')}
            {input('Fecha de nacimiento', 'fecha_nacimiento', 'date')}
            {input('Nacionalidad', 'nacionalidad')}
            {input('País de residencia', 'pais_residencia')}
            {input('Dirección completa', 'direccion')}
            {input('Teléfono', 'telefono')}
            {input('Correo electrónico', 'correo', 'email')}
            {input('Ocupación / actividad económica', 'ocupacion')}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.es_pep} onChange={e => update('es_pep', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent-gold)' }} />
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>¿Es persona expuesta políticamente (PEP)?</span>
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button onClick={() => setStep(2)} className="btn-primary" style={{ padding: '12px 28px' }}>Siguiente</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {input('Fuente de ingresos', 'fuente_ingresos')}
            {input('Rango de ingresos mensuales', 'rango_ingresos', 'select', { options: [
              { value: '<1000', label: '< $1,000' },
              { value: '1001-5000', label: '$1,001 - $5,000' },
              { value: '5001-15000', label: '$5,001 - $15,000' },
              { value: '>15000', label: '> $15,000' }
            ] })}
            {input('Origen de los fondos', 'origen_fondos')}
            {input('Propósito de la transacción', 'proposito_transaccion')}
            {input('Monto estimado (USD)', 'monto_estimado', 'number')}
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
