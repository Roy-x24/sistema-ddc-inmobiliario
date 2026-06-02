import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './shells/AppShell';
import AdminShell from './shells/AdminShell';
import RutaProtegida from './components/RutaProtegida';

import Login from './pages/Login';
import SesionExpirada from './pages/SesionExpirada';
import NoAutorizado from './pages/NoAutorizado';
import Dashboard from './pages/Dashboard';
import ListadoClientes from './pages/ListadoClientes';
import RegistroNatural from './pages/RegistroNatural';
import RegistroJuridica from './pages/RegistroJuridica';
import DetalleExpediente from './pages/DetalleExpediente';
import Documentos from './pages/Documentos';
import BeneficiarioFinal from './pages/BeneficiarioFinal';
import Perfiles from './pages/Perfiles';
import Riesgo from './pages/Riesgo';
import Activacion from './pages/Activacion';
import Observaciones from './pages/Observaciones';
import Auditoria from './pages/Auditoria';
import MatrizRiesgo from './pages/admin/MatrizRiesgo';

function AppRoutes() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-fondo">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-acento border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Publicas */}
      <Route path="/login" element={!usuario ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/sesion-expirada" element={<SesionExpirada />} />
      <Route path="/no-autorizado" element={<NoAutorizado />} />

      {/* Admin shell */}
      <Route element={usuario?.rol === 'admin' ? <AdminShell /> : <Navigate to="/no-autorizado" replace />}>
        <Route path="/admin/matriz" element={<MatrizRiesgo />} />
      </Route>

      {/* App shell (operativo) */}
      <Route element={<AppShell />}>
        <Route
          path="/dashboard"
          element={
            <RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'auditor', 'admin']}>
              <Dashboard />
            </RutaProtegida>
          }
        />
        <Route
          path="/clientes"
          element={
            <RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'auditor', 'admin']}>
              <ListadoClientes />
            </RutaProtegida>
          }
        />
        <Route
          path="/clientes/nuevo"
          element={
            <RutaProtegida rolesPermitidos={['empleado', 'admin']}>
              <RegistroNatural />
            </RutaProtegida>
          }
        />
        <Route
          path="/clientes/nuevo-juridica"
          element={
            <RutaProtegida rolesPermitidos={['empleado', 'admin']}>
              <RegistroJuridica />
            </RutaProtegida>
          }
        />
        <Route
          path="/expediente/:id"
          element={
            <RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'auditor', 'admin']}>
              <DetalleExpediente />
            </RutaProtegida>
          }
        />
        <Route
          path="/documentos/:id"
          element={
            <RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}>
              <Documentos />
            </RutaProtegida>
          }
        />
        <Route
          path="/beneficiarios/:id"
          element={
            <RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}>
              <BeneficiarioFinal />
            </RutaProtegida>
          }
        />
        <Route
          path="/perfiles/:id"
          element={
            <RutaProtegida rolesPermitidos={['empleado', 'admin']}>
              <Perfiles />
            </RutaProtegida>
          }
        />
        <Route
          path="/riesgo/:id"
          element={
            <RutaProtegida rolesPermitidos={['oficial_cumplimiento', 'auditor', 'admin']}>
              <Riesgo />
            </RutaProtegida>
          }
        />
        <Route
          path="/activacion/:id"
          element={
            <RutaProtegida rolesPermitidos={['oficial_cumplimiento', 'admin']}>
              <Activacion />
            </RutaProtegida>
          }
        />
        <Route
          path="/observaciones/:id"
          element={
            <RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}>
              <Observaciones />
            </RutaProtegida>
          }
        />
        <Route
          path="/auditoria"
          element={
            <RutaProtegida rolesPermitidos={['oficial_cumplimiento', 'auditor', 'admin']}>
              <Auditoria />
            </RutaProtegida>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={usuario ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
