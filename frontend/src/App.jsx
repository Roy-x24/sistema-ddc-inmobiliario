import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import RutaProtegida from './components/RutaProtegida';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ListadoClientes from './pages/ListadoClientes';
import RegistroNatural from './pages/RegistroNatural';
import RegistroJuridica from './pages/RegistroJuridica';
import DetalleExpediente from './pages/DetalleExpediente';
import Documentos from './pages/Documentos';
import Perfiles from './pages/Perfiles';
import Riesgo from './pages/Riesgo';
import Activacion from './pages/Activacion';
import Auditoria from './pages/Auditoria';
import Administracion from './pages/Administracion';

function Layout() {
  const { usuario } = useAuth();
  if (!usuario) return <Login />;
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <Sidebar />
      <main style={{ marginLeft: 240, marginTop: 64, padding: '32px 36px', flex: 1, minHeight: 'calc(100vh - 64px)' }}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<ListadoClientes />} />
          <Route path="/clientes/nuevo" element={
            <RutaProtegida rolesPermitidos={['empleado', 'administrador']}>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 400 }}><RegistroNatural /></div>
                <div style={{ flex: 1, minWidth: 400 }}><RegistroJuridica /></div>
              </div>
            </RutaProtegida>
          } />
          <Route path="/expediente/:id" element={<DetalleExpediente />} />
          <Route path="/documentos" element={
            <RutaProtegida rolesPermitidos={['empleado', 'oficial_cumplimiento', 'administrador']}>
              <Documentos />
            </RutaProtegida>
          } />
          <Route path="/perfiles" element={
            <RutaProtegida rolesPermitidos={['empleado', 'administrador']}>
              <Perfiles />
            </RutaProtegida>
          } />
          <Route path="/riesgo" element={
            <RutaProtegida rolesPermitidos={['oficial_cumplimiento', 'auditor', 'administrador']}>
              <Riesgo />
            </RutaProtegida>
          } />
          <Route path="/activacion" element={
            <RutaProtegida rolesPermitidos={['oficial_cumplimiento', 'administrador']}>
              <Activacion />
            </RutaProtegida>
          } />
          <Route path="/auditoria" element={
            <RutaProtegida rolesPermitidos={['oficial_cumplimiento', 'auditor', 'administrador']}>
              <Auditoria />
            </RutaProtegida>
          } />
          <Route path="/admin" element={
            <RutaProtegida rolesPermitidos={['administrador']}>
              <Administracion />
            </RutaProtegida>
          } />
          <Route path="/no-autorizado" element={
            <div style={{ padding: 60, textAlign: 'center' }}>
              <h1 style={{ fontSize: 64, marginBottom: 16 }}>403</h1>
              <h2 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Acceso no autorizado</h2>
              <p style={{ color: 'var(--text-muted)' }}>No tiene permisos para acceder a este módulo.</p>
            </div>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}
