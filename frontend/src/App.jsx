import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
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
import Cumplimiento from './pages/Cumplimiento';
import Observaciones from './pages/Observaciones';
import Auditoria from './pages/Auditoria';
import MatrizRiesgo from './pages/admin/MatrizRiesgo';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminAuditoria from './pages/admin/AdminAuditoria';

function OperativeLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app-canvas flex min-h-screen font-sans antialiased text-slate-900">
      <Sidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        desktopCollapsed={sidebarCollapsed}
      />
      <div className={`flex-1 transition-[margin] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          desktopCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        />
        <main className="mt-20 px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }

  const loginRedirect = usuario?.rol === 'admin' ? '/admin/matriz' : usuario?.rol === 'auditor' ? '/auditoria' : '/dashboard';
  const sinMarco = ['/login', '/sesion-expirada', '/no-autorizado'];
  const usaMarco = !!usuario && !sinMarco.includes(location.pathname);

  const routes = (
    <Routes>
      <Route path="/login" element={!usuario ? <Login /> : <Navigate to={loginRedirect} replace />} />
      <Route path="/sesion-expirada" element={<SesionExpirada />} />
      <Route path="/no-autorizado" element={<NoAutorizado />} />

      <Route path="/admin/matriz" element={<RutaProtegida rolesPermitidos={['admin']}><MatrizRiesgo /></RutaProtegida>} />
      <Route path="/admin/usuarios" element={<RutaProtegida rolesPermitidos={['admin']}><AdminUsuarios /></RutaProtegida>} />
      <Route path="/admin/auditoria" element={<RutaProtegida rolesPermitidos={['admin']}><AdminAuditoria /></RutaProtegida>} />

      <Route path="/dashboard" element={<RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}><Dashboard /></RutaProtegida>} />
      <Route path="/clientes" element={<RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}><ListadoClientes /></RutaProtegida>} />
      <Route path="/clientes/nuevo" element={<RutaProtegida rolesPermitidos={['empleado', 'admin']}><RegistroNatural /></RutaProtegida>} />
      <Route path="/clientes/nuevo-juridica" element={<RutaProtegida rolesPermitidos={['empleado', 'admin']}><RegistroJuridica /></RutaProtegida>} />
      <Route path="/expediente/:id" element={<RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}><DetalleExpediente /></RutaProtegida>} />
      <Route path="/documentos" element={<RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}><Documentos /></RutaProtegida>} />
      <Route path="/documentos/:id" element={<RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}><Documentos /></RutaProtegida>} />
      <Route path="/beneficiarios" element={<RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}><BeneficiarioFinal /></RutaProtegida>} />
      <Route path="/beneficiarios/:id" element={<RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}><BeneficiarioFinal /></RutaProtegida>} />
      <Route path="/perfiles" element={<RutaProtegida rolesPermitidos={['empleado', 'admin']}><Perfiles /></RutaProtegida>} />
      <Route path="/perfiles/:id" element={<RutaProtegida rolesPermitidos={['empleado', 'admin']}><Perfiles /></RutaProtegida>} />
      <Route path="/riesgo" element={<RutaProtegida rolesPermitidos={['oficial_cumplimiento', 'admin']}><Riesgo /></RutaProtegida>} />
      <Route path="/riesgo/:id" element={<RutaProtegida rolesPermitidos={['oficial_cumplimiento', 'admin']}><Riesgo /></RutaProtegida>} />
      <Route path="/activacion" element={<RutaProtegida rolesPermitidos={['oficial_cumplimiento', 'admin']}><Activacion /></RutaProtegida>} />
      <Route path="/activacion/:id" element={<RutaProtegida rolesPermitidos={['oficial_cumplimiento', 'admin']}><Activacion /></RutaProtegida>} />
      <Route path="/cumplimiento" element={<RutaProtegida rolesPermitidos={['oficial_cumplimiento', 'auditor', 'admin']}><Cumplimiento /></RutaProtegida>} />
      <Route path="/observaciones" element={<RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}><Observaciones /></RutaProtegida>} />
      <Route path="/observaciones/:id" element={<RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'admin']}><Observaciones /></RutaProtegida>} />
      <Route path="/auditoria" element={<RutaProtegida rolesPermitidos={['oficial_cumplimiento', 'auditor', 'admin']}><Auditoria /></RutaProtegida>} />

      <Route path="*" element={<Navigate to={usuario ? loginRedirect : '/login'} replace />} />
    </Routes>
  );

  return usaMarco ? <OperativeLayout>{routes}</OperativeLayout> : routes;
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
