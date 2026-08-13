/**
 * Aegis AI – App Layout Component
 *
 * Main application shell with sidebar and navbar.
 */

import { Outlet } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store';
import { setSidebarOpen } from '@/store/uiSlice';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { AnimatePresence, motion } from 'framer-motion';

export default function AppLayout() {
  const { sidebarCollapsed, sidebarOpen } = useAppSelector((state) => state.ui);
  const dispatch = useAppDispatch();

  return (
    <div className="min-h-screen gradient-mesh flex flex-col relative">
      <Sidebar />
      <Navbar />
      
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(setSidebarOpen(false))}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <main
        className="transition-all duration-300 pt-[var(--navbar-height)] min-h-screen flex flex-col w-full"
        style={{
          marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 
            ? (sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)') 
            : '0',
          width: typeof window !== 'undefined' && window.innerWidth >= 1024 
            ? `calc(100% - ${sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)'})`
            : '100%',
        }}
      >
        <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col min-w-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
