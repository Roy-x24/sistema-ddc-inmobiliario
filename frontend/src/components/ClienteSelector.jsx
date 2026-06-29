import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal, User, Building2 } from 'lucide-react';
import EstadoBadge from './EstadoBadge';
import RiesgoIndicador from './RiesgoIndicador';
import { tipoClienteBadgeClass, tipoClienteLabel } from '../utils/clientesUi';

const ESTADOS = ['PENDIENTE', 'PENDIENTE_BF', 'EN_REVISION', 'OBSERVADO', 'ACTIVO', 'BLOQUEADO', 'RECHAZADO'];
const RIESGOS = ['BAJO', 'ESTANDAR', 'ALTO'];

const coincide = (cliente, busqueda) => {
  const texto = [
    cliente.nombre,
    cliente.identificacion,
    cliente.id_cliente,
    cliente.tipo_cliente,
    cliente.estado,
    cliente.nivel_riesgo,
  ].filter(Boolean).join(' ').toLowerCase();
  return texto.includes(busqueda.trim().toLowerCase());
};

export default function ClienteSelector({
  clientes,
  value,
  onChange,
  tipo,
  onTipoChange,
  estado,
  onEstadoChange,
  riesgo,
  onRiesgoChange,
  busqueda,
  onBusquedaChange,
  title = 'Buscar expediente',
  description = 'Filtra por nombre, identificacion, estado o riesgo.',
  emptyText = 'No hay expedientes con esos filtros.',
  showTipoFilter = true,
}) {
  const [expandido, setExpandido] = useState(!value);

  const filtrados = clientes.filter((cliente) => {
    if (tipo && cliente.tipo_cliente !== tipo) return false;
    if (estado && cliente.estado !== estado) return false;
    if (riesgo && cliente.nivel_riesgo !== riesgo) return false;
    if (busqueda && !coincide(cliente, busqueda)) return false;
    return true;
  });

  const seleccionado = clientes.find((cliente) => cliente.id_cliente === value);
  const SelectedIcon = seleccionado?.tipo_cliente === 'JURIDICA' ? Building2 : User;

  useEffect(() => {
    setExpandido(!value);
  }, [value]);

  const seleccionar = (id) => {
    onChange(id);
    setExpandido(false);
  };

  return (
    <section className="card" style={{ padding: 18, marginTop: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <div className="label-upper" style={{ marginBottom: 4 }}>{title}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{description}</div>
        </div>
        {seleccionado && (
          <button type="button" onClick={() => setExpandido((valor) => !valor)} className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12 }}>
            {expandido ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expandido ? 'Ocultar lista' : 'Cambiar expediente'}
          </button>
        )}
      </div>

      {seleccionado && !expandido && (
        <button
          type="button"
          onClick={() => setExpandido(true)}
          className="card"
          style={{
            width: '100%',
            padding: 14,
            textAlign: 'left',
            borderColor: 'rgba(20,184,166,0.45)',
            background: 'linear-gradient(135deg, rgba(20,184,166,0.08), rgba(255,255,255,0.96))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <SelectedIcon className="h-4 w-4" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Expediente seleccionado</div>
              <div style={{ fontWeight: 900, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seleccionado.nombre || '-'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{seleccionado.identificacion || seleccionado.id_cliente?.slice(0, 8)}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span className={`inline-flex rounded-lg border px-2 py-0.5 text-[11px] font-bold ${tipoClienteBadgeClass(seleccionado.tipo_cliente)}`}>{tipoClienteLabel(seleccionado.tipo_cliente)}</span>
              <EstadoBadge estado={seleccionado.estado} />
              {seleccionado.nivel_riesgo && <RiesgoIndicador nivel={seleccionado.nivel_riesgo} />}
            </div>
          </div>
        </button>
      )}

      {expandido && (
      <>
      <div style={{ display: 'grid', gridTemplateColumns: showTipoFilter ? 'minmax(260px, 1fr) repeat(3, minmax(150px, 190px))' : 'minmax(260px, 1fr) repeat(2, minmax(150px, 190px))', gap: 12 }}>
        <div>
          <label className="label-upper" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Search className="h-3.5 w-3.5" /> Busqueda
          </label>
          <input
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            placeholder="Nombre, cedula, RUC o ID..."
            className="input-field"
            style={{ width: '100%' }}
          />
        </div>
        {showTipoFilter && (
          <div>
            <label className="label-upper">Tipo</label>
            <select value={tipo} onChange={(e) => onTipoChange(e.target.value)} className="select-field" style={{ width: '100%' }}>
              <option value="">Todos</option>
              <option value="NATURAL">Natural</option>
              <option value="JURIDICA">Juridica</option>
            </select>
          </div>
        )}
        <div>
          <label className="label-upper">Estado</label>
          <select value={estado} onChange={(e) => onEstadoChange(e.target.value)} className="select-field" style={{ width: '100%' }}>
            <option value="">Todos</option>
            {ESTADOS.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="label-upper">Riesgo</label>
          <select value={riesgo} onChange={(e) => onRiesgoChange(e.target.value)} className="select-field" style={{ width: '100%' }}>
            <option value="">Todos</option>
            {RIESGOS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, color: 'var(--text-muted)', fontSize: 12 }}>
        <SlidersHorizontal className="h-3.5 w-3.5" />
        {filtrados.length} expediente{filtrados.length === 1 ? '' : 's'} encontrado{filtrados.length === 1 ? '' : 's'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10, marginTop: 12, maxHeight: 260, overflow: 'auto', paddingRight: 4 }}>
        {filtrados.slice(0, 24).map((cliente) => {
          const activo = cliente.id_cliente === value;
          const Icon = cliente.tipo_cliente === 'JURIDICA' ? Building2 : User;
          return (
            <button
              type="button"
              key={cliente.id_cliente}
              onClick={() => seleccionar(cliente.id_cliente)}
              className="card"
              style={{
                padding: 12,
                textAlign: 'left',
                borderColor: activo ? 'rgba(20,184,166,0.55)' : 'rgba(148,163,184,0.22)',
                background: activo ? 'rgba(20,184,166,0.06)' : '#fff',
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Icon className="h-4 w-4" />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 900, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cliente.nombre || '-'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{cliente.identificacion || cliente.id_cliente?.slice(0, 8)}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                    <span className={`inline-flex rounded-lg border px-2 py-0.5 text-[11px] font-bold ${tipoClienteBadgeClass(cliente.tipo_cliente)}`}>{tipoClienteLabel(cliente.tipo_cliente)}</span>
                    <EstadoBadge estado={cliente.estado} />
                    {cliente.nivel_riesgo && <RiesgoIndicador nivel={cliente.nivel_riesgo} />}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
        {filtrados.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: 24, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed rgba(148,163,184,0.35)', borderRadius: 12 }}>
            {emptyText}
          </div>
        )}
      </div>
      </>
      )}
    </section>
  );
}
