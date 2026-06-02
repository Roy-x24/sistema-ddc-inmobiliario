import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import Tabla from '../components/ui/Tabla';
import Boton from '../components/ui/Boton';
import Input from '../components/ui/Input';
import Alerta from '../components/ui/Alerta';

export default function Observaciones() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [observaciones, setObservaciones] = useState([]);
  const [nueva, setNueva] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchObs = async () => {
    try {
      const res = await api.get(`/clientes/${id}/observaciones`);
      setObservaciones(res.data);
    } catch {
      setError('Error al cargar observaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObs();
  }, [id]);

  const crear = async () => {
    try {
      await api.post(`/clientes/${id}/observaciones`, { descripcion: nueva });
      setNueva('');
      fetchObs();
    } catch {
      setError('Error al crear observacion');
    }
  };

  const responder = async (obsId) => {
    const resp = prompt('Respuesta:');
    if (!resp) return;
    try {
      await api.patch(`/clientes/observaciones/${obsId}/responder`, { respuesta: resp });
      fetchObs();
    } catch {
      setError('Error al responder');
    }
  };

  const cerrar = async (obsId) => {
    try {
      await api.patch(`/clientes/observaciones/${obsId}/cerrar`);
      fetchObs();
    } catch {
      setError('Error al cerrar observacion');
    }
  };

  const columns = [
    { key: 'descripcion', label: 'Descripcion' },
    { key: 'respuesta', label: 'Respuesta' },
    { key: 'estado', label: 'Estado' },
    { key: 'creada_por', label: 'Creada por' },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          {usuario.rol === 'empleado' && row.estado === 'ABIERTA' && !row.respuesta && (
            <button onClick={() => responder(row.id)} className="text-xs font-medium text-blue-700 hover:underline">Responder</button>
          )}
          {usuario.rol === 'oficial_cumplimiento' && row.estado === 'ABIERTA' && row.respuesta && (
            <button onClick={() => cerrar(row.id)} className="text-xs font-medium text-green-700 hover:underline">Cerrar</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Observaciones del expediente</h1>
      {error && <Alerta variant="error">{error}</Alerta>}
      {usuario.rol === 'oficial_cumplimiento' && (
        <div className="flex gap-3 rounded-xl border bg-white p-4 shadow-sm">
          <Input className="flex-1" placeholder="Nueva observacion..." value={nueva} onChange={(e) => setNueva(e.target.value)} />
          <Boton onClick={crear}>Crear</Boton>
        </div>
      )}
      {loading ? <p className="text-sm text-gray-500">Cargando...</p> : <Tabla columns={columns} data={observaciones} />}
    </div>
  );
}
