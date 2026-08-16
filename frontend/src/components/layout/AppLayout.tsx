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

import React from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { useAppDispatch, useAppSelector } from '@/store';
import { setSidebarOpen } from '@/store/uiSlice';

import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout() {
  const dispatch = useAppDispatch();

  const {
    sidebarCollapsed,
    sidebarOpen,
  } = useAppSelector((state) => state.ui);

  const sidebarWidth = sidebarCollapsed
    ? 'var(--sidebar-collapsed)'
    : 'var(--sidebar-width)';

  return (
    <div
      className="app-shell"
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
            transition={{ duration: 0.2 }}
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