import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';
import Boton from '../components/ui/Boton';
import Alerta from '../components/ui/Alerta';
import { FileSpreadsheet } from 'lucide-react';

export default function Perfiles() {
  const params = useParams();
  const urlId = params.id;

  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(urlId || '');
  const [finExiste, setFinExiste] = useState(false);
  const [transExiste, setTransExiste] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const { register: registerFin, handleSubmit: handleSubmitFin, reset: resetFin, formState: { errors: errorsFin, isSubmitting: isSubmittingFin } } = useForm();
  const { register: registerTrans, handleSubmit: handleSubmitTrans, reset: resetTrans, watch: watchTrans, formState: { errors: errorsTrans, isSubmitting: isSubmittingTrans } } = useForm();

  const tieneFinanciamiento = watchTrans('tiene_financiamiento');

  useEffect(() => {
    api.get('/clientes/?limit=9999').then(res => setClientes(res.data || []));
  }, []);

  useEffect(() => {
    if (clienteId) {
      cargarPerfiles(clienteId);
    }
  }, [clienteId]);

  useEffect(() => {
    if (urlId) setClienteId(urlId);
  }, [urlId]);

  const cargarPerfiles = async (id) => {
    setFinExiste(false);
    setTransExiste(false);
    try {
      const resF = await api.get(`/clientes/${id}/perfil-financiero`);
      if (resF.data) {
        resetFin({
          fuente_ingresos: resF.data.fuente_ingresos || '',
          rango_ingresos: resF.data.rango_ingresos || '',
          origen_fondos: resF.data.origen_fondos || '',
          patrimonio_declarado: resF.data.patrimonio_declarado || ''
        });
        setFinExiste(true);
      }
    } catch { /* no existe */ }
    try {
      const resT = await api.get(`/clientes/${id}/perfil-transaccional`);
      if (resT.data) {
        resetTrans({
          monto_total_propiedad: resT.data.monto_total_propiedad || '',
          metodo_pago_predominante: resT.data.metodo_pago_predominante || 'transferencia',
          tipo_operacion: resT.data.tipo_operacion || 'compra',
          banco_origen_fondos: resT.data.banco_origen_fondos || '',
          tiene_financiamiento: resT.data.tiene_financiamiento || false,
          banco_financiamiento: resT.data.banco_financiamiento || '',
          monto_financiamiento: resT.data.monto_financiamiento || ''
        });
        setTransExiste(true);
      }
    } catch { /* no existe */ }
  };

  const showMensaje = (text) => { setMensaje(text); setTimeout(() => setMensaje(''), 4000); };
  const showError = (text) => { setError(text); setTimeout(() => setError(''), 6000); };

  const guardarFinanciero = async (data) => {
    if (!clienteId) return showError('Seleccione un cliente');
    try {
      await api.post(`/clientes/${clienteId}/perfil-financiero`, {
        ...data,
        patrimonio_declarado: data.patrimonio_declarado ? parseFloat(data.patrimonio_declarado) : null
      });
      setFinExiste(true);
      showMensaje('Perfil financiero guardado correctamente');
    } catch (err) {
      showError(err.response?.data?.detail || 'Error al guardar perfil financiero');
    }
  };

  const guardarTransaccional = async (data) => {
    if (!clienteId) return showError('Seleccione un cliente');
    try {
      await api.post(`/clientes/${clienteId}/perfil-transaccional`, {
        monto_total_propiedad: parseFloat(data.monto_total_propiedad),
        metodo_pago_predominante: data.metodo_pago_predominante,
        tipo_operacion: data.tipo_operacion,
        banco_origen_fondos: data.banco_origen_fondos || null,
        tiene_financiamiento: data.tiene_financiamiento,
        banco_financiamiento: data.banco_financiamiento || null,
        monto_financiamiento: data.monto_financiamiento ? parseFloat(data.monto_financiamiento) : null
      });
      setTransExiste(true);
      showMensaje('Perfil transaccional guardado correctamente');
    } catch (err) {
      showError(err.response?.data?.detail || 'Error al guardar perfil transaccional');
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Perfiles</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Registro de perfiles financiero y transaccional</p>
      </div>

      {mensaje && <div className="mb-4"><Alerta variant="exito">{mensaje}</Alerta></div>}
      {error && <div className="mb-4"><Alerta variant="error">{error}</Alerta></div>}

      <div style={{ marginBottom: 20, marginTop: 24 }}>
        <label className="label-upper">Cliente</label>
        <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="select-field" style={{ minWidth: 320 }}>
          <option value="">Seleccione un cliente</option>
          {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre || c.id_cliente}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <form onSubmit={handleSubmitFin(guardarFinanciero)} className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <FileSpreadsheet className="h-5 w-5" style={{ color: 'var(--accent-gold)' }} />
            <h3 style={{ fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}>Perfil financiero</h3>
            {finExiste && <span className="badge" style={{ backgroundColor: 'rgba(22,163,74,0.1)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)' }}>Registrado</span>}
          </div>
          <FormField label="Fuente de ingresos" error={errorsFin.fuente_ingresos?.message}>
            <Input {...registerFin('fuente_ingresos', { required: 'Fuente de ingresos es obligatoria' })} />
          </FormField>
          <FormField label="Rango de ingresos" error={errorsFin.rango_ingresos?.message}>
            <select {...registerFin('rango_ingresos', { required: 'Rango es obligatorio' })} className="select-field" style={{ width: '100%' }}>
              <option value="">Seleccione</option>
              <option value="<1000">&lt; $1,000</option>
              <option value="1001-5000">$1,001 - $5,000</option>
              <option value="5001-15000">$5,001 - $15,000</option>
              <option value=">15000">&gt; $15,000</option>
            </select>
          </FormField>
          <FormField label="Origen de los fondos" error={errorsFin.origen_fondos?.message}>
            <Input {...registerFin('origen_fondos', { required: 'Origen de fondos es obligatorio' })} />
          </FormField>
          <FormField label="Patrimonio declarado aproximado (USD)" error={errorsFin.patrimonio_declarado?.message}>
            <Input type="number" {...registerFin('patrimonio_declarado')} />
          </FormField>
          <Boton type="submit" variant="primario" loading={isSubmittingFin} style={{ width: '100%' }}>
            {finExiste ? 'Actualizar' : 'Guardar'} perfil financiero
          </Boton>
        </form>

        <form onSubmit={handleSubmitTrans(guardarTransaccional)} className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <FileSpreadsheet className="h-5 w-5" style={{ color: 'var(--accent-gold)' }} />
            <h3 style={{ fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}>Perfil transaccional</h3>
            {transExiste && <span className="badge" style={{ backgroundColor: 'rgba(22,163,74,0.1)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)' }}>Registrado</span>}
          </div>
          <FormField label="Monto total de la propiedad (USD)" error={errorsTrans.monto_total_propiedad?.message}>
            <Input type="number" {...registerTrans('monto_total_propiedad', { required: 'Monto es obligatorio', min: { value: 0, message: 'Monto debe ser positivo' } })} />
          </FormField>
          <FormField label="Método de pago predominante" error={errorsTrans.metodo_pago_predominante?.message}>
            <select {...registerTrans('metodo_pago_predominante', { required: 'Método de pago es obligatorio' })} className="select-field" style={{ width: '100%' }}>
              <option value="transferencia">Transferencia bancaria</option>
              <option value="cheque">Cheque de gerencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="financiamiento">Financiamiento bancario</option>
              <option value="mixto">Mixto</option>
            </select>
          </FormField>
          <FormField label="Tipo de operación" error={errorsTrans.tipo_operacion?.message}>
            <select {...registerTrans('tipo_operacion', { required: 'Tipo de operación es obligatorio' })} className="select-field" style={{ width: '100%' }}>
              <option value="compra">Compra</option>
              <option value="venta">Venta</option>
              <option value="arrendamiento">Arrendamiento</option>
              <option value="inversion">Inversión</option>
            </select>
          </FormField>
          <FormField label="Banco de origen de fondos" error={errorsTrans.banco_origen_fondos?.message}>
            <Input {...registerTrans('banco_origen_fondos')} />
          </FormField>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" {...registerTrans('tiene_financiamiento')} />
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>¿Tiene financiamiento bancario?</span>
          </label>
          {tieneFinanciamiento && (
            <>
              <FormField label="Banco del préstamo" error={errorsTrans.banco_financiamiento?.message}>
                <Input {...registerTrans('banco_financiamiento', { required: 'Banco del préstamo es obligatorio' })} />
              </FormField>
              <FormField label="Monto del préstamo (USD)" error={errorsTrans.monto_financiamiento?.message}>
                <Input type="number" {...registerTrans('monto_financiamiento', { required: 'Monto del préstamo es obligatorio', min: { value: 0, message: 'Monto debe ser positivo' } })} />
              </FormField>
            </>
          )}
          <Boton type="submit" variant="primario" loading={isSubmittingTrans} style={{ width: '100%' }}>
            {transExiste ? 'Actualizar' : 'Guardar'} perfil transaccional
          </Boton>
        </form>
      </div>
    </div>
  );
}
