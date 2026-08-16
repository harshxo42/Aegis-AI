/**
 * Aegis AI – App Layout
 *
 * Main application shell
 * - Fixed sidebar
 * - Fixed navbar
 * - Responsive mobile drawer
 * - Dynamic desktop sidebar width
 * - No horizontal overflow
 */

import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { useAppDispatch, useAppSelector } from '@/store';
import { setSidebarOpen } from '@/store/uiSlice';

import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout() {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const {
    sidebarCollapsed,
    sidebarOpen,
  } = useAppSelector((state) => state.ui);

  // Auto-close mobile sidebar whenever the route changes
  useEffect(() => {
    dispatch(setSidebarOpen(false));
  }, [location.pathname, dispatch]);

  // Auto-close mobile sidebar when window is resized to desktop width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        dispatch(setSidebarOpen(false));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  const sidebarWidth = sidebarCollapsed
    ? 'var(--sidebar-collapsed)'
    : 'var(--sidebar-width)';

  return (
    <div
      className={`app-shell ${sidebarOpen ? 'sidebar-open' : ''}`}
      style={
        {
          '--current-sidebar-width': sidebarWidth,
        } as React.CSSProperties
      }
    >
      {/* SIDEBAR */}
      <Sidebar />

      {/* NAVBAR */}
      <Navbar />

      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.button
            type="button"
            aria-label="Close navigation"
            className="mobile-sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() =>
              dispatch(setSidebarOpen(false))
            }
          />
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="app-main">
        <div className="app-content">
          <div className="app-content-inner">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}