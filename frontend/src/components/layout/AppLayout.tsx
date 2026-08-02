/**
 * Aegis AI – App Layout Component
 *
 * Main application shell with sidebar and navbar.
 */

import { Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout() {
  const { sidebarCollapsed } = useAppSelector((state) => state.ui);

  return (
    <div className="min-h-screen gradient-mesh">
      <Sidebar />
      <Navbar />
      <main
        className="transition-all duration-300 pt-[var(--navbar-height)] min-h-screen"
        style={{
          marginLeft: sidebarCollapsed
            ? 'var(--sidebar-collapsed)'
            : 'var(--sidebar-width)',
        }}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
