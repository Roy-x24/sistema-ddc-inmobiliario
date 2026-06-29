import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import Boton from '../components/ui/Boton';

export default function RegistroNatural() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const steps = ['Datos básicos', 'Perfil y transacción', 'Revisión'];

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        monto_estimado: parseFloat(data.monto_estimado),
        fecha_nacimiento: data.fecha_nacimiento,
        es_pep: data.es_pep === 'true' || data.es_pep === true
      };
      await api.post('/clientes/natural', payload);
      navigate('/clientes');
    } catch (e) {
      alert('Error al registrar: ' + (e.response?.data?.detail || e.message));
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 22 }}>Persona natural</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Registro de cliente individual</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card" style={{ padding: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 22 }}>
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              disabled={index > step}
              className={step === index ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '9px 10px', fontSize: 12 }}
            >
              {index + 1}. {label}
            </button>
          ))}
        </div>

        {step === 0 && (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Nombres" error={errors.nombres?.message}>
            <Input {...register('nombres', { required: 'Nombres es obligatorio' })} />
          </FormField>
          <FormField label="Apellidos" error={errors.apellidos?.message}>
            <Input {...register('apellidos', { required: 'Apellidos es obligatorio' })} />
          </FormField>
        </div>
        <FormField label="Tipo de documento" error={errors.tipo_documento?.message}>
          <select {...register('tipo_documento', { required: 'Tipo de documento es obligatorio' })} className="select-field" style={{ width: '100%' }}>
            <option value="CEDULA">Cédula</option>
            <option value="PASAPORTE">Pasaporte</option>
          </select>
        </FormField>
        <FormField label="Número de documento" error={errors.numero_documento?.message}>
          <Input {...register('numero_documento', { required: 'Número de documento es obligatorio' })} />
        </FormField>
        <FormField label="Fecha de nacimiento" error={errors.fecha_nacimiento?.message}>
          <Input type="date" {...register('fecha_nacimiento', { required: 'Fecha de nacimiento es obligatoria' })} />
        </FormField>
        <FormField label="Nacionalidad" error={errors.nacionalidad?.message}>
          <Input {...register('nacionalidad', { required: 'Nacionalidad es obligatoria' })} />
        </FormField>
        <FormField label="País de residencia" error={errors.pais_residencia?.message}>
          <Input {...register('pais_residencia', { required: 'País de residencia es obligatorio' })} />
        </FormField>
        <FormField label="Dirección completa" error={errors.direccion?.message}>
          <Input {...register('direccion', { required: 'Dirección es obligatoria' })} />
        </FormField>
        <FormField label="Teléfono" error={errors.telefono?.message}>
          <Input {...register('telefono', { required: 'Teléfono es obligatorio' })} />
        </FormField>
        <FormField label="Correo electrónico" error={errors.correo?.message}>
          <Input type="email" {...register('correo', { required: 'Correo es obligatorio', pattern: { value: /\S+@\S+\.\S+/, message: 'Correo inválido' } })} />
        </FormField>
        <FormField label="Ocupación / actividad económica" error={errors.ocupacion?.message}>
          <Input {...register('ocupacion', { required: 'Ocupación es obligatoria' })} />
        </FormField>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 16, cursor: 'pointer' }}>
          <input type="checkbox" {...register('es_pep')} style={{ width: 18, height: 18, accentColor: 'var(--accent-gold)' }} />
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>¿Es persona expuesta políticamente (PEP)?</span>
        </label>
        </>
        )}

        {step === 1 && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '20px 0', paddingTop: 20 }}>
          <h3 style={{ fontSize: 14, color: 'var(--accent-gold)', fontFamily: 'var(--font-display)', marginBottom: 16 }}>Perfil y transacción</h3>
          <FormField label="Fuente de ingresos" error={errors.fuente_ingresos?.message}>
            <Input {...register('fuente_ingresos', { required: 'Fuente de ingresos es obligatoria' })} />
          </FormField>
          <FormField label="Rango de ingresos mensuales" error={errors.rango_ingresos?.message}>
            <select {...register('rango_ingresos', { required: 'Rango de ingresos es obligatorio' })} className="select-field" style={{ width: '100%' }}>
              <option value="">Seleccione</option>
              <option value="<1000">&lt; $1,000</option>
              <option value="1001-5000">$1,001 - $5,000</option>
              <option value="5001-15000">$5,001 - $15,000</option>
              <option value=">15000">&gt; $15,000</option>
            </select>
          </FormField>
          <FormField label="Origen de los fondos" error={errors.origen_fondos?.message}>
            <Input {...register('origen_fondos', { required: 'Origen de fondos es obligatorio' })} />
          </FormField>
          <FormField label="Propósito de la transacción" error={errors.proposito_transaccion?.message}>
            <Input {...register('proposito_transaccion', { required: 'Propósito es obligatorio' })} />
          </FormField>
          <FormField label="Monto estimado (USD)" error={errors.monto_estimado?.message}>
            <Input type="number" {...register('monto_estimado', { required: 'Monto estimado es obligatorio', min: { value: 0, message: 'Monto debe ser positivo' } })} />
          </FormField>
        </div>
        )}

        {step === 2 && (
          <div className="card" style={{ padding: 20, backgroundColor: 'var(--bg-elevated)', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>Revisión final</h3>
            <p style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
              Confirma que los datos básicos, perfil financiero y transacción fueron capturados. Al guardar, el expediente se creará en estado pendiente y el empleado podrá cargar documentos obligatorios.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 24 }}>
          <Boton type="button" variant="secundario" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            Atrás
          </Boton>
          {step < 2 ? (
            <Boton type="button" variant="primario" onClick={() => setStep(Math.min(2, step + 1))} style={{ padding: '12px 28px' }}>
              Continuar
            </Boton>
          ) : (
            <Boton type="submit" variant="primario" loading={isSubmitting} style={{ padding: '12px 28px' }}>
              {isSubmitting ? 'Guardando...' : 'Guardar cliente'}
            </Boton>
          )}
        </div>
      </form>
    </div>
  );
}
