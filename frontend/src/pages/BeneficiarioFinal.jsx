import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import Tabla from '../components/ui/Tabla';
import Boton from '../components/ui/Boton';
import Input from '../components/ui/Input';
import Alerta from '../components/ui/Alerta';

export default function BeneficiarioFinal() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nombre_completo: '', numero_documento: '', nacionalidad: '', porcentaje_participacion: '', tipo_control: 'directo', es_pep: false });

  const fetchBF = async () => {
    try {
      const res = await api.get(`/clientes/${id}/beneficiarios`);
      setBeneficiarios(res.data);
    } catch {
      setError('Error al cargar beneficiarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBF();
  }, [id]);

  const agregar = async () => {
    try {
      await api.post(`/clientes/${id}/beneficiarios`, { ...form, porcentaje_participacion: parseFloat(form.porcentaje_participacion) });
      setForm({ nombre_completo: '', numero_documento: '', nacionalidad: '', porcentaje_participacion: '', tipo_control: 'directo', es_pep: false });
      fetchBF();
    } catch {
      setError('Error al registrar beneficiario');
    }
  };

  const validar = async (bfId, accion) => {
    try {
      if (accion === 'aprobar') {
        await api.patch(`/clientes/beneficiarios/${bfId}/aprobar`);
      } else {
        const motivo = prompt('Motivo de rechazo:');
        if (!motivo) return;
        await api.patch(`/clientes/beneficiarios/${bfId}/rechazar?motivo=${encodeURIComponent(motivo)}`);
      }
      fetchBF();
    } catch {
      setError('Error al validar beneficiario');
    }
  };

  const columns = [
    { key: 'nombre_completo', label: 'Nombre' },
    { key: 'numero_documento', label: 'Documento' },
    { key: 'porcentaje_participacion', label: '%' },
    { key: 'tipo_control', label: 'Control' },
    { key: 'estado_validacion', label: 'Estado' },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) =>
        usuario.rol === 'oficial_cumplimiento' && row.estado_validacion === 'PENDIENTE' ? (
          <div className="flex gap-2">
            <button onClick={() => validar(row.id, 'aprobar')} className="text-xs font-medium text-green-700 hover:underline">Aprobar</button>
            <button onClick={() => validar(row.id, 'rechazar')} className="text-xs font-medium text-red-700 hover:underline">Rechazar</button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Beneficiarios Finales</h1>
      {error && <Alerta variant="error">{error}</Alerta>}
      {usuario.rol === 'empleado' && (
        <div className="grid grid-cols-1 gap-4 rounded-xl border bg-white p-5 shadow-sm md:grid-cols-3">
          <Input label="Nombre completo" value={form.nombre_completo} onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })} />
          <Input label="Documento" value={form.numero_documento} onChange={(e) => setForm({ ...form, numero_documento: e.target.value })} />
          <Input label="Nacionalidad" value={form.nacionalidad} onChange={(e) => setForm({ ...form, nacionalidad: e.target.value })} />
          <Input label="% Participacion" type="number" value={form.porcentaje_participacion} onChange={(e) => setForm({ ...form, porcentaje_participacion: e.target.value })} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de control</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.tipo_control} onChange={(e) => setForm({ ...form, tipo_control: e.target.value })}>
              <option value="directo">Directo</option>
              <option value="indirecto">Indirecto</option>
              <option value="representacion">Representacion</option>
            </select>
          </div>
          <div className="flex items-end">
            <Boton onClick={agregar}>Agregar BF</Boton>
          </div>
        </div>
      )}
      {loading ? <p className="text-sm text-gray-500">Cargando...</p> : <Tabla columns={columns} data={beneficiarios} />}
    </div>
  );
}
