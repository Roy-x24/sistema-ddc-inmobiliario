import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import RutaProtegida from './components/RutaProtegida';
import AdminShell from './shells/AdminShell';

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
import AdminUsuarios from './pages/admin/AdminUsuarios';

function OperativeLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <div className="ml-64 flex-1">
        <Navbar />
        <main className="mt-16 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }

  const loginRedirect = usuario?.rol === 'admin' ? '/dashboard' : '/dashboard';

  return (
    <Routes>
      <Route path="/login" element={!usuario ? <Login /> : <Navigate to={loginRedirect} replace />} />
      <Route path="/sesion-expirada" element={<SesionExpirada />} />
      <Route path="/no-autorizado" element={<NoAutorizado />} />

      {/* Admin-only routes via AdminShell */}
      <Route path="/admin/matriz" element={
        <RutaProtegida rolesPermitidos={['admin']}>
          <AdminShell><MatrizRiesgo /></AdminShell>
        </RutaProtegida>
      } />
      <Route path="/admin/usuarios" element={
        <RutaProtegida rolesPermitidos={['admin']}>
          <AdminShell><AdminUsuarios /></AdminShell>
        </RutaProtegida>
      } />

      {/* Operative routes — admin can access all */}
      <Route path="/dashboard" element={
        <RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'auditor', 'admin']}>
          <OperativeLayout><Dashboard /></OperativeLayout>
        </RutaProtegida>
      } />
      <Route path="/clientes" element={
        <RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'auditor', 'admin']}>
          <OperativeLayout><ListadoClientes /></OperativeLayout>
        </RutaProtegida>
      } />
      <Route path="/clientes/nuevo" element={
        <RutaProtegida rolesPermitidos={['empleado', 'admin']}>
          <OperativeLayout><RegistroNatural /></OperativeLayout>
        </RutaProtegida>
      } />
      <Route path="/clientes/nuevo-juridica" element={
        <RutaProtegida rolesPermitidos={['empleado', 'admin']}>
          <OperativeLayout><RegistroJuridica /></OperativeLayout>
        </RutaProtegida>
      } />
      <Route path="/expediente/:id" element={
        <RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'auditor', 'admin']}>
          <OperativeLayout><DetalleExpediente /></OperativeLayout>
        </RutaProtegida>
      } />
      <Route path="/documentos" element={
        <RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}>
          <OperativeLayout><Documentos /></OperativeLayout>
        </RutaProtegida>
      } />
      <Route path="/documentos/:id" element={
        <RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}>
          <OperativeLayout><Documentos /></OperativeLayout>
        </RutaProtegida>
      } />
      <Route path="/beneficiarios" element={
        <RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}>
          <OperativeLayout><BeneficiarioFinal /></OperativeLayout>
        </RutaProtegida>
      } />
      <Route path="/beneficiarios/:id" element={
        <RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}>
          <OperativeLayout><BeneficiarioFinal /></OperativeLayout>
        </RutaProtegida>
      } />
      <Route path="/perfiles" element={
        <RutaProtegida rolesPermitidos={['empleado', 'admin']}>
          <OperativeLayout><Perfiles /></OperativeLayout>
        </RutaProtegida>
      } />
      <Route path="/perfiles/:id" element={
        <RutaProtegida rolesPermitidos={['empleado', 'admin']}>
          <OperativeLayout><Perfiles /></OperativeLayout>
        </RutaProtegida>
      } />
      <Route path="/riesgo" element={
        <RutaProtegida rolesPermitidos={['oficial_cumplimiento', 'auditor', 'admin']}>
          <OperativeLayout><Riesgo /></OperativeLayout>
        </RutaProtegida>
      } />
      <Route path="/riesgo/:id" element={
        <RutaProtegida rolesPermitidos={['oficial_cumplimiento', 'auditor', 'admin']}>
          <OperativeLayout><Riesgo /></OperativeLayout>
        </RutaProtegida>
      } />
      <Route path="/activacion" element={
        <RutaProtegida rolesPermitidos={['oficial_cumplimiento', 'admin']}>
          <OperativeLayout><Activacion /></OperativeLayout>
        </RutaProtegida>
      } />
      <Route path="/activacion/:id" element={
        <RutaProtegida rolesPermitidos={['oficial_cumplimiento', 'admin']}>
          <OperativeLayout><Activacion /></OperativeLayout>
        </RutaProtegida>
      } />
      <Route path="/observaciones" element={
        <RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}>
          <OperativeLayout><Observaciones /></OperativeLayout>
        </RutaProtegida>
      } />
      <Route path="/observaciones/:id" element={
        <RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}>
          <OperativeLayout><Observaciones /></OperativeLayout>
        </RutaProtegida>
      } />
      <Route path="/auditoria" element={
        <RutaProtegida rolesPermitidos={['oficial_cumplimiento', 'auditor', 'admin']}>
          <OperativeLayout><Auditoria /></OperativeLayout>
        </RutaProtegida>
      } />

      <Route path="*" element={<Navigate to={usuario ? loginRedirect : '/login'} replace />} />
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
