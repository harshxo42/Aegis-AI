/**
 * Aegis AI – Navbar Component
 *
 * Top navigation bar with user menu, notifications, and search.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/authSlice';
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
} from 'lucide-react';
import { toggleSidebar } from '@/store/uiSlice';

export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { sidebarCollapsed } = useAppSelector((state) => state.ui);
  const [showUserMenu, setShowUserMenu] = useState(false);


  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      patient: '#10b981',
      doctor: '#3b82f6',
      ambulance_driver: '#f59e0b',
      hospital_admin: '#8b5cf6',
      government_admin: '#ef4444',
    };
    return colors[role] || '#6b7280';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      patient: 'Patient',
      doctor: 'Doctor',
      ambulance_driver: 'Driver',
      hospital_admin: 'Hospital Admin',
      government_admin: 'Gov. Admin',
    };
    return labels[role] || role;
  };

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center justify-between px-4 md:px-6"
      style={{
        height: 'var(--navbar-height)',
        left: typeof window !== 'undefined' && window.innerWidth >= 1024 
          ? (sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)') 
          : '0',
        background: 'rgba(10, 14, 26, 0.8)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        transition: 'left var(--transition-base)',
      }}
    >
      {/* Left: Mobile menu + Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Menu size={20} />
        </button>

        <div className="relative hidden md:block">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search anything..."
            className="pl-10 pr-4 py-2 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2"
            style={{
              width: 280,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2.5 rounded-xl transition-all duration-200 hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Bell size={20} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: 'var(--danger-500)' }}
          />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all duration-200 hover:bg-[var(--bg-hover)]"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{
                background: `linear-gradient(135deg, ${getRoleBadgeColor(user?.role || 'patient')}, ${getRoleBadgeColor(user?.role || 'patient')}99)`,
              }}
            >
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {user?.full_name || 'User'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {getRoleLabel(user?.role || '')}
              </p>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl py-2 z-50"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-xl)',
                  }}
                >
                  <div className="px-4 py-2 mb-1" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <p className="text-sm font-medium">{user?.full_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-hover)]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                  <button
                    onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-hover)]"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <User size={16} />
                    Profile
                  </button>
                  <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--bg-hover)]"
                    style={{ color: 'var(--danger-400)' }}
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
