import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-fondo font-sans">
      <Sidebar />
      <div className="ml-60 flex-1">
        <Navbar />
        <main className="mt-16 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
