import { Outlet } from 'react-router-dom';

export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-cream font-sans antialiased">
      <Outlet />
    </div>
  );
}
