/**
 * Aegis AI – Sidebar Navigation Component
 *
 * Collapsible sidebar with role-based menu items and animated transitions.
 */

import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '@/store';
import { toggleSidebarCollapse } from '@/store/uiSlice';
import {
  LayoutDashboard,
  HeartPulse,
  Building2,
  Ambulance,
  AlertTriangle,
  FileText,
  BrainCircuit,
  Bell,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Stethoscope,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import type { UserRole } from '@/types';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard size={20} />,
    roles: ['patient', 'doctor', 'ambulance_driver', 'hospital_admin', 'government_admin'],
  },
  {
    label: 'Emergency SOS',
    path: '/emergency',
    icon: <AlertTriangle size={20} />,
    roles: ['patient'],
  },
  {
    label: 'Emergencies',
    path: '/emergencies',
    icon: <HeartPulse size={20} />,
    roles: ['doctor', 'ambulance_driver', 'hospital_admin', 'government_admin'],
  },
  {
    label: 'Hospitals',
    path: '/hospitals',
    icon: <Building2 size={20} />,
    roles: ['patient', 'doctor', 'hospital_admin', 'government_admin'],
  },
  {
    label: 'Ambulances',
    path: '/ambulances',
    icon: <Ambulance size={20} />,
    roles: ['ambulance_driver', 'hospital_admin', 'government_admin'],
  },
  {
    label: 'Live Map',
    path: '/map',
    icon: <MapPin size={20} />,
    roles: ['patient', 'ambulance_driver', 'hospital_admin', 'government_admin'],
  },
  {
    label: 'AI Predictions',
    path: '/ai/predictions',
    icon: <BrainCircuit size={20} />,
    roles: ['patient', 'doctor', 'hospital_admin'],
  },
  {
    label: 'AI Chat',
    path: '/ai/chat',
    icon: <MessageSquare size={20} />,
    roles: ['patient', 'doctor'],
  },
  {
    label: 'Medical Reports',
    path: '/reports',
    icon: <FileText size={20} />,
    roles: ['patient', 'doctor'],
  },
  {
    label: 'My Patients',
    path: '/patients',
    icon: <Stethoscope size={20} />,
    roles: ['doctor', 'hospital_admin'],
  },
  {
    label: 'Notifications',
    path: '/notifications',
    icon: <Bell size={20} />,
    roles: ['patient', 'doctor', 'ambulance_driver', 'hospital_admin', 'government_admin'],
  },
  {
    label: 'Analytics',
    path: '/analytics',
    icon: <BarChart3 size={20} />,
    roles: ['hospital_admin', 'government_admin'],
  },
  {
    label: 'User Management',
    path: '/admin/users',
    icon: <Users size={20} />,
    roles: ['government_admin'],
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: <Settings size={20} />,
    roles: ['patient', 'doctor', 'ambulance_driver', 'hospital_admin', 'government_admin'],
  },
];

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed, sidebarOpen } = useAppSelector((state) => state.ui);
  const { user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  const userRole = user?.role || 'patient';
  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      style={{
        width: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{ height: 'var(--navbar-height)', borderBottom: '1px solid var(--border-color)' }}
      >
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
          }}
        >
          <Shield size={22} color="white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-lg font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, var(--primary-400), var(--accent-400))' }}>
                Aegis AI
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: -2 }}>
                Emergency Response
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2" style={{ scrollbarWidth: 'thin' }}>
        <ul className="space-y-1">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path ||
              location.pathname.startsWith(item.path + '/');

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
                  style={{
                    color: isActive ? 'var(--primary-400)' : 'var(--text-secondary)',
                    background: isActive ? 'var(--bg-hover)' : 'transparent',
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full"
                      style={{
                        height: '60%',
                        background: 'linear-gradient(180deg, var(--primary-400), var(--accent-400))',
                      }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="flex-shrink-0 transition-colors group-hover:text-[var(--primary-400)]">
                    {item.icon}
                  </span>
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm font-medium whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => dispatch(toggleSidebarCollapse())}
        className="flex items-center justify-center mx-2 mb-4 py-2 rounded-xl transition-all duration-200 hover:bg-[var(--bg-hover)]"
        style={{ color: 'var(--text-muted)' }}
      >
        {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ml-2 text-xs"
            >
              Collapse
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </aside>
  );
}
