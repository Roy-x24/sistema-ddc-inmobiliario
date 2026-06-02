import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Tabla from '../../components/ui/Tabla';
import Boton from '../../components/ui/Boton';
import Input from '../../components/ui/Input';
import Alerta from '../../components/ui/Alerta';

export default function MatrizRiesgo() {
  const [matriz, setMatriz] = useState(null);
  const [versiones, setVersiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const fetchMatriz = async () => {
    try {
      const res = await api.get('/admin/matriz');
      setMatriz(res.data);
    } catch {
      setError('Error al cargar matriz activa');
    }
  };

  const fetchVersiones = async () => {
    try {
      const res = await api.get('/admin/matriz/versiones');
      setVersiones(res.data);
    } catch {
      setError('Error al cargar versiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatriz();
    fetchVersiones();
  }, []);

  const actualizarFactor = async (factorId, cambios) => {
    try {
      await api.patch(`/admin/factores/${factorId}`, cambios);
      setMensaje('Factor actualizado');
      fetchMatriz();
    } catch {
      setError('Error al actualizar factor');
    }
  };

  const publicarVersion = async (versionId) => {
    try {
      await api.patch(`/admin/matriz/${versionId}/publicar`);
      setMensaje('Version publicada');
      fetchMatriz();
      fetchVersiones();
    } catch {
      setError('Error al publicar version');
    }
  };

  const factorColumns = [
    { key: 'nombre_factor', label: 'Factor' },
    { key: 'descripcion', label: 'Descripcion' },
    { key: 'peso', label: 'Peso' },
    { key: 'tipo', label: 'Tipo' },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          <Input type="number" className="w-20" defaultValue={row.peso} onBlur={(e) => actualizarFactor(row.id, { peso: parseInt(e.target.value) })} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Gestion de Matriz de Riesgo</h1>
      {error && <Alerta variant="error">{error}</Alerta>}
      {mensaje && <Alerta variant="exito">{mensaje}</Alerta>}

      {matriz && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Version activa</p>
              <p className="text-lg font-semibold text-gray-900">Version {matriz.version.version_numero}</p>
            </div>
          </div>
          <Tabla columns={factorColumns} data={matriz.factores} />
        </div>
      )}

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Historial de versiones</h2>
        {versiones.map((v) => (
          <div key={v.id} className="flex items-center justify-between border-b py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Version {v.version_numero}</p>
              <p className="text-xs text-gray-500">{v.descripcion || 'Sin descripcion'}</p>
            </div>
            {!v.esta_activa && (
              <Boton variant="secundario" onClick={() => publicarVersion(v.id)}>Publicar</Boton>
            )}
            {v.esta_activa && <span className="text-xs font-medium text-green-700">Activa</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
