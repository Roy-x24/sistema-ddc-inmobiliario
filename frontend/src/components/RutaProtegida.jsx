import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RutaProtegida({ children, rolesPermitidos = [] }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.rol === 'admin') return children;

  if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return children;
}
