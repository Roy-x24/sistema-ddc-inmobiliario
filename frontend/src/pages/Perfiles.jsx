import { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

export default function Perfiles() {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [financiero, setFinanciero] = useState({ fuente_ingresos: '', rango_ingresos: '', origen_fondos: '', patrimonio_declarado: '' });
  const [transaccional, setTransaccional] = useState({ proposito_compra: '', monto_estimado: '', tipo_transaccion: 'transferencia', tiene_financiamiento: false, banco_financiamiento: '', monto_financiamiento: '' });

  useEffect(() => {
    api.get('/clientes/?limit=9999').then(res => setClientes(res.data || []));
  }, []);

  const guardarFinanciero = async () => {
    if (!clienteId) return alert('Seleccione un cliente');
    await api.post(`/clientes/${clienteId}/perfil-financiero`, {
      ...financiero,
      patrimonio_declarado: financiero.patrimonio_declarado ? parseFloat(financiero.patrimonio_declarado) : null
    });
    alert('Perfil financiero guardado');
  };

  const guardarTransaccional = async () => {
    if (!clienteId) return alert('Seleccione un cliente');
    await api.post(`/clientes/${clienteId}/perfil-transaccional`, {
      ...transaccional,
      monto_estimado: parseFloat(transaccional.monto_estimado),
      monto_financiamiento: transaccional.monto_financiamiento ? parseFloat(transaccional.monto_financiamiento) : null
    });
    alert('Perfil transaccional guardado');
  };

  return (
    <div className="animate-fade-in-up">
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 28 }}>Perfiles</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Registro de perfiles financiero y transaccional</p>
      </div>

      <div style={{ marginBottom: 20, marginTop: 24 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Cliente</label>
        <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="select-field" style={{ minWidth: 320 }}>
          <option value="">Seleccione un cliente</option>
          {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre || c.id_cliente}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 18, marginBottom: 20, fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}>Perfil financiero</h3>
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Patrimonio declarado aproximado</label>
            <input type="number" value={financiero.patrimonio_declarado} onChange={e => setFinanciero({ ...financiero, patrimonio_declarado: e.target.value })} className="input-field" />
          </div>
          <button onClick={guardarFinanciero} className="btn-primary" style={{ width: '100%' }}>Guardar perfil financiero</button>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 18, marginBottom: 20, fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}>Perfil transaccional</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Propósito de la compra</label>
            <input value={transaccional.proposito_compra} onChange={e => setTransaccional({ ...transaccional, proposito_compra: e.target.value })} className="input-field" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Monto estimado (USD)</label>
            <input type="number" value={transaccional.monto_estimado} onChange={e => setTransaccional({ ...transaccional, monto_estimado: e.target.value })} className="input-field" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Tipo de transacción</label>
            <select value={transaccional.tipo_transaccion} onChange={e => setTransaccional({ ...transaccional, tipo_transaccion: e.target.value })} className="select-field" style={{ width: '100%' }}>
              <option value="transferencia">Transferencia bancaria</option>
              <option value="cheque">Cheque de gerencia</option>
              <option value="financiamiento">Financiamiento</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={transaccional.tiene_financiamiento} onChange={e => setTransaccional({ ...transaccional, tiene_financiamiento: e.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--accent-gold)' }} />
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>¿Tiene financiamiento bancario?</span>
          </label>
          {transaccional.tiene_financiamiento && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Banco</label>
                <input value={transaccional.banco_financiamiento} onChange={e => setTransaccional({ ...transaccional, banco_financiamiento: e.target.value })} className="input-field" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Monto del préstamo</label>
                <input type="number" value={transaccional.monto_financiamiento} onChange={e => setTransaccional({ ...transaccional, monto_financiamiento: e.target.value })} className="input-field" />
              </div>
            </>
          )}
          <button onClick={guardarTransaccional} className="btn-primary" style={{ width: '100%' }}>Guardar perfil transaccional</button>
        </div>
      </div>
    </div>
  );
}
