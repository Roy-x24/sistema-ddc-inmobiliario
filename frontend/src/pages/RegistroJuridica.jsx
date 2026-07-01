import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import Boton from '../components/ui/Boton';
import AssistedDocumentAnalyzer from '../components/AssistedDocumentAnalyzer';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const apiErrorMessage = (error, fallback) => {
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((item) => item.msg || item.message || JSON.stringify(item)).join('; ');
  if (detail && typeof detail === 'object') return detail.message || detail.error || JSON.stringify(detail);
  return error.message || fallback;
};

export default function RegistroJuridica() {
  const { register, control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      tipo_pj: 'SA',
      representante_legal: { nombre_completo: '', numero_identificacion: '', cargo: '', poderes_otorgados: '' },
      beneficiarios_finales: [{ nombre_completo: '', numero_documento: '', nacionalidad: '', porcentaje_participacion: '', tipo_control: 'directo', es_pep: false }],
      es_pep: false
    }
  });
  const { fields, append } = useFieldArray({ control, name: 'beneficiarios_finales' });
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [archivoAI, setArchivoAI] = useState(null);
  const [tipoDocumentoAI, setTipoDocumentoAI] = useState('CERTIFICADO_EXISTENCIA');
  const [prefill, setPrefill] = useState(null);
  const [analizando, setAnalizando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const valoresActuales = watch();
  const steps = ['Sociedad', 'Representante', 'Beneficiarios', 'Perfil', 'Revisión'];

  const analizarDocumento = async () => {
    if (!archivoAI) return;
    setAnalizando(true);
    const formData = new FormData();
    formData.append('archivo', archivoAI);
    formData.append('tipo_documento_declarado', tipoDocumentoAI);
    try {
      const res = await api.post('/ai/prellenar/juridica', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPrefill(res.data);
    } catch {
      setPrefill({ error: 'No se pudo analizar el documento', fields: {}, confidence: 0 });
      setError('No se pudo analizar el documento. Puedes continuar manualmente.');
    } finally {
      setAnalizando(false);
    }
  };

  const usarDetectado = (key, value) => {
    setValue(key, value, { shouldDirty: true, shouldValidate: true });
    setMensaje(`Campo actualizado desde OCR: ${key.replaceAll('_', ' ')}`);
    setError('');
  };

  const usarDetectados = () => {
    Object.entries(prefill?.fields || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') setValue(key, value, { shouldDirty: true, shouldValidate: true });
    });
    setMensaje('Datos detectados aplicados. Revisa sociedad, representante y BF antes de guardar.');
    setError('');
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        monto_estimado: parseFloat(data.monto_estimado),
        beneficiarios_finales: data.beneficiarios_finales.map(b => ({
          ...b,
          porcentaje_participacion: parseFloat(b.porcentaje_participacion),
          es_pep: b.es_pep === true || b.es_pep === 'true'
        }))
      };
      const res = await api.post('/clientes/juridica', payload);
      navigate(`/expediente/${res.data.id_cliente}`);
    } catch (e) {
      setError(`Error al registrar: ${apiErrorMessage(e, 'No se pudo crear el expediente')}`);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 22 }}>Persona jurídica</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Registro de empresa o entidad</p>
      </div>

      {mensaje && (
        <div className="success-banner" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle2 className="h-4 w-4" />
          {mensaje}
        </div>
      )}
      {error && (
        <div className="error-banner" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="card" style={{ padding: 28 }}>
        <AssistedDocumentAnalyzer
          tipoCliente="JURIDICA"
          title="Prellenado asistido de persona jurídica"
          description="Selecciona certificado, aviso, representante o BF. Revisa la vista previa para confirmar que el soporte legal corresponde antes de aplicar datos."
          archivo={archivoAI}
          onArchivoChange={setArchivoAI}
          tipoDocumento={tipoDocumentoAI}
          onTipoDocumentoChange={setTipoDocumentoAI}
          analizando={analizando}
          onAnalyze={analizarDocumento}
          result={prefill}
          currentValues={valoresActuales}
          onApplyField={usarDetectado}
          onApplyAll={usarDetectados}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 22 }}>
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
        <FormField label="Razón social" error={errors.razon_social?.message}>
          <Input {...register('razon_social', { required: 'Razón social es obligatoria' })} />
        </FormField>
        <FormField label="RUC o número de registro" error={errors.ruc?.message}>
          <Input {...register('ruc', { required: 'RUC es obligatorio' })} />
        </FormField>
        <FormField label="Tipo de persona jurídica" error={errors.tipo_pj?.message}>
          <select {...register('tipo_pj', { required: 'Tipo es obligatorio' })} className="select-field" style={{ width: '100%' }}>
            <option value="SA">Sociedad Anónima (SA)</option>
            <option value="SRL">Sociedad de Responsabilidad Limitada (SRL)</option>
            <option value="fideicomiso">Fideicomiso</option>
            <option value="fundacion">Fundación</option>
            <option value="otra">Otra</option>
          </select>
        </FormField>
        <FormField label="País de constitución" error={errors.pais_constitucion?.message}>
          <Input {...register('pais_constitucion', { required: 'País de constitución es obligatorio' })} />
        </FormField>
        <FormField label="Actividad económica principal" error={errors.actividad_economica?.message}>
          <Input {...register('actividad_economica', { required: 'Actividad económica es obligatoria' })} />
        </FormField>
        <FormField label="Domicilio legal" error={errors.domicilio_legal?.message}>
          <Input {...register('domicilio_legal', { required: 'Domicilio legal es obligatorio' })} />
        </FormField>
        <FormField label="Teléfono" error={errors.telefono?.message}>
          <Input {...register('telefono', { required: 'Teléfono es obligatorio' })} />
        </FormField>
        <FormField label="Correo oficial" error={errors.correo?.message}>
          <Input type="email" {...register('correo', { required: 'Correo es obligatorio', pattern: { value: /\S+@\S+\.\S+/, message: 'Correo inválido' } })} />
        </FormField>
        <FormField label="Propósito de la adquisición" error={errors.proposito_adquisicion?.message}>
          <Input {...register('proposito_adquisicion', { required: 'Propósito es obligatorio' })} />
        </FormField>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 16, cursor: 'pointer' }}>
          <input type="checkbox" {...register('es_pep')} style={{ width: 18, height: 18, accentColor: 'var(--accent-gold)' }} />
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>¿Es PEP?</span>
        </label>
        </>
        )}

        {step === 1 && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '20px 0', paddingTop: 20 }}>
          <h3 style={{ fontSize: 14, color: 'var(--accent-gold)', fontFamily: 'var(--font-display)', marginBottom: 16 }}>Representante legal</h3>
          <FormField label="Nombre completo" error={errors.representante_legal?.nombre_completo?.message}>
            <Input {...register('representante_legal.nombre_completo', { required: 'Nombre del representante es obligatorio' })} />
          </FormField>
          <FormField label="Número de identificación" error={errors.representante_legal?.numero_identificacion?.message}>
            <Input {...register('representante_legal.numero_identificacion', { required: 'Identificación es obligatoria' })} />
          </FormField>
          <FormField label="Cargo" error={errors.representante_legal?.cargo?.message}>
            <Input {...register('representante_legal.cargo', { required: 'Cargo es obligatorio' })} />
          </FormField>
          <FormField label="Poderes otorgados" error={errors.representante_legal?.poderes_otorgados?.message}>
            <Input {...register('representante_legal.poderes_otorgados', { required: 'Poderes son obligatorios' })} />
          </FormField>
        </div>
        )}

        {step === 2 && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '20px 0', paddingTop: 20 }}>
          <h3 style={{ fontSize: 14, color: 'var(--accent-gold)', fontFamily: 'var(--font-display)', marginBottom: 16 }}>Beneficiarios finales</h3>
          {fields.map((field, index) => (
            <div key={field.id} className="card" style={{ padding: 20, marginBottom: 12, backgroundColor: 'var(--bg-elevated)' }}>
              <FormField label="Nombre completo" error={errors.beneficiarios_finales?.[index]?.nombre_completo?.message}>
                <Input {...register(`beneficiarios_finales.${index}.nombre_completo`, { required: 'Nombre es obligatorio' })} />
              </FormField>
              <FormField label="Número de documento" error={errors.beneficiarios_finales?.[index]?.numero_documento?.message}>
                <Input {...register(`beneficiarios_finales.${index}.numero_documento`, { required: 'Documento es obligatorio' })} />
              </FormField>
              <FormField label="Nacionalidad" error={errors.beneficiarios_finales?.[index]?.nacionalidad?.message}>
                <Input {...register(`beneficiarios_finales.${index}.nacionalidad`, { required: 'Nacionalidad es obligatoria' })} />
              </FormField>
              <FormField label="Porcentaje de participación (≥25%)" error={errors.beneficiarios_finales?.[index]?.porcentaje_participacion?.message}>
                <Input type="number" {...register(`beneficiarios_finales.${index}.porcentaje_participacion`, { required: 'Porcentaje es obligatorio', min: { value: 0, message: 'Debe ser ≥ 0' }, max: { value: 100, message: 'Debe ser ≤ 100' } })} />
              </FormField>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, cursor: 'pointer' }}>
                <input type="checkbox" {...register(`beneficiarios_finales.${index}.es_pep`)} style={{ width: 18, height: 18, accentColor: 'var(--accent-gold)' }} />
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>¿Es PEP?</span>
              </label>
            </div>
          ))}
          <Boton type="button" variant="secundario" onClick={() => append({ nombre_completo: '', numero_documento: '', nacionalidad: '', porcentaje_participacion: '', tipo_control: 'directo', es_pep: false })} style={{ marginBottom: 24 }}>
            + Agregar beneficiario
          </Boton>
        </div>
        )}

        {step === 3 && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '20px 0', paddingTop: 20 }}>
          <h3 style={{ fontSize: 14, color: 'var(--accent-gold)', fontFamily: 'var(--font-display)', marginBottom: 16 }}>Perfil y transacción</h3>
          <FormField label="Fuente de ingresos" error={errors.fuente_ingresos?.message}>
            <Input {...register('fuente_ingresos', { required: 'Fuente de ingresos es obligatoria' })} />
          </FormField>
          <FormField label="Rango de ingresos mensuales" error={errors.rango_ingresos?.message}>
            <select {...register('rango_ingresos', { required: 'Rango es obligatorio' })} className="select-field" style={{ width: '100%' }}>
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
          <FormField label="Monto estimado (USD)" error={errors.monto_estimado?.message}>
            <Input type="number" {...register('monto_estimado', { required: 'Monto estimado es obligatorio', min: { value: 0, message: 'Monto debe ser positivo' } })} />
          </FormField>
        </div>
        )}

        {step === 4 && (
          <div className="card" style={{ padding: 20, backgroundColor: 'var(--bg-elevated)', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>Revisión final</h3>
            <p style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
              Confirma sociedad, representante, beneficiarios finales y perfil. Al guardar, la persona jurídica inicia en PENDIENTE BF hasta que el Oficial apruebe los BF relevantes.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 24 }}>
          <Boton type="button" variant="secundario" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            Atrás
          </Boton>
          {step < 4 ? (
            <Boton type="button" variant="primario" onClick={() => setStep(Math.min(4, step + 1))} style={{ padding: '12px 28px' }}>
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
