import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Perfiles() {
  const params = useParams();
  const urlId = params.id;

  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(urlId || '');
  const [financiero, setFinanciero] = useState({ fuente_ingresos: '', rango_ingresos: '', origen_fondos: '', patrimonio_declarado: '' });
  const [transaccional, setTransaccional] = useState({
    monto_total_propiedad: '',
    metodo_pago_predominante: 'transferencia',
    tipo_operacion: 'compra',
    banco_origen_fondos: '',
    tiene_financiamiento: false,
    banco_financiamiento: '',
    monto_financiamiento: ''
  });
  const [finExiste, setFinExiste] = useState(false);
  const [transExiste, setTransExiste] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

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
        setFinanciero({
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
        setTransaccional({
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

  const guardarFinanciero = async () => {
    if (!clienteId) return showError('Seleccione un cliente');
    try {
      await api.post(`/clientes/${clienteId}/perfil-financiero`, {
        ...financiero,
        patrimonio_declarado: financiero.patrimonio_declarado ? parseFloat(financiero.patrimonio_declarado) : null
      });
      setFinExiste(true);
      showMensaje('Perfil financiero guardado correctamente');
    } catch (err) {
      showError(err.response?.data?.detail || 'Error al guardar perfil financiero');
    }
  };

  const guardarTransaccional = async () => {
    if (!clienteId) return showError('Seleccione un cliente');
    try {
      await api.post(`/clientes/${clienteId}/perfil-transaccional`, {
        monto_total_propiedad: parseFloat(transaccional.monto_total_propiedad),
        metodo_pago_predominante: transaccional.metodo_pago_predominante,
        tipo_operacion: transaccional.tipo_operacion,
        banco_origen_fondos: transaccional.banco_origen_fondos || null,
        tiene_financiamiento: transaccional.tiene_financiamiento,
        banco_financiamiento: transaccional.banco_financiamiento || null,
        monto_financiamiento: transaccional.monto_financiamiento ? parseFloat(transaccional.monto_financiamiento) : null
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

      <div style={{ marginBottom: 20, marginTop: 24 }}>
        <label className="label-upper">Cliente</label>
        <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="select-field" style={{ minWidth: 320 }}>
          <option value="">Seleccione un cliente</option>
          {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre || c.id_cliente}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <FileSpreadsheet className="h-5 w-5" style={{ color: 'var(--accent-gold)' }} />
            <h3 style={{ fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}>Perfil financiero</h3>
            {finExiste && <span className="badge" style={{ backgroundColor: 'rgba(22,163,74,0.1)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)' }}>Registrado</span>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Fuente de ingresos</label>
            <input value={financiero.fuente_ingresos} onChange={e => setFinanciero({ ...financiero, fuente_ingresos: e.target.value })} className="input-field" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Rango de ingresos</label>
            <select value={financiero.rango_ingresos} onChange={e => setFinanciero({ ...financiero, rango_ingresos: e.target.value })} className="select-field" style={{ width: '100%' }}>
              <option value="">Seleccione</option>
              <option value="<1000">&lt; $1,000</option>
              <option value="1001-5000">$1,001 - $5,000</option>
              <option value="5001-15000">$5,001 - $15,000</option>
              <option value=">15000">&gt; $15,000</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Origen de los fondos</label>
            <input value={financiero.origen_fondos} onChange={e => setFinanciero({ ...financiero, origen_fondos: e.target.value })} className="input-field" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Patrimonio declarado aproximado (USD)</label>
            <input type="number" value={financiero.patrimonio_declarado} onChange={e => setFinanciero({ ...financiero, patrimonio_declarado: e.target.value })} className="input-field" />
          </div>
          <button onClick={guardarFinanciero} className="btn-primary" style={{ width: '100%' }}>{finExiste ? 'Actualizar' : 'Guardar'} perfil financiero</button>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <FileSpreadsheet className="h-5 w-5" style={{ color: 'var(--accent-gold)' }} />
            <h3 style={{ fontSize: 18, fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}>Perfil transaccional</h3>
            {transExiste && <span className="badge" style={{ backgroundColor: 'rgba(22,163,74,0.1)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)' }}>Registrado</span>}
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Monto total de la propiedad (USD)</label>
            <input type="number" value={transaccional.monto_total_propiedad} onChange={e => setTransaccional({ ...transaccional, monto_total_propiedad: e.target.value })} className="input-field" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Método de pago predominante</label>
            <select value={transaccional.metodo_pago_predominante} onChange={e => setTransaccional({ ...transaccional, metodo_pago_predominante: e.target.value })} className="select-field" style={{ width: '100%' }}>
              <option value="transferencia">Transferencia bancaria</option>
              <option value="cheque">Cheque de gerencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="financiamiento">Financiamiento bancario</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Tipo de operación</label>
            <select value={transaccional.tipo_operacion} onChange={e => setTransaccional({ ...transaccional, tipo_operacion: e.target.value })} className="select-field" style={{ width: '100%' }}>
              <option value="compra">Compra</option>
              <option value="venta">Venta</option>
              <option value="arrendamiento">Arrendamiento</option>
              <option value="inversion">Inversión</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Banco de origen de fondos</label>
            <input value={transaccional.banco_origen_fondos} onChange={e => setTransaccional({ ...transaccional, banco_origen_fondos: e.target.value })} className="input-field" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={transaccional.tiene_financiamiento} onChange={e => setTransaccional({ ...transaccional, tiene_financiamiento: e.target.checked })} />
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>¿Tiene financiamiento bancario?</span>
          </label>
          {transaccional.tiene_financiamiento && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Banco del préstamo</label>
                <input value={transaccional.banco_financiamiento} onChange={e => setTransaccional({ ...transaccional, banco_financiamiento: e.target.value })} className="input-field" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Monto del préstamo (USD)</label>
                <input type="number" value={transaccional.monto_financiamiento} onChange={e => setTransaccional({ ...transaccional, monto_financiamiento: e.target.value })} className="input-field" />
              </div>
            </>
          )}
          <button onClick={guardarTransaccional} className="btn-primary" style={{ width: '100%' }}>{transExiste ? 'Actualizar' : 'Guardar'} perfil transaccional</button>
        </div>
      </div>
    </div>
  );
}
