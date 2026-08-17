/**
 * Aegis AI – Sidebar Navigation
 *
 * Fixed responsive sidebar
 * - Role based navigation
 * - Desktop collapse
 * - Mobile drawer
 * - Stable branding
 */

import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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

import { useAppSelector, useAppDispatch } from '@/store';
import { toggleSidebarCollapse, setSidebarOpen } from '@/store/uiSlice';

import type { ReactNode } from 'react';
import type { UserRole } from '@/types';

interface MenuItem {
  label: string;
  path: string;
  icon: ReactNode;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard size={22} strokeWidth={1.9} />,
    roles: [
      'patient',
      'doctor',
      'ambulance_driver',
      'hospital_admin',
      'government_admin',
    ],
  },

  {
    label: 'Emergency SOS',
    path: '/emergency',
    icon: <AlertTriangle size={22} strokeWidth={1.9} />,
    roles: ['patient'],
  },

  {
    label: 'Emergencies',
    path: '/emergencies',
    icon: <HeartPulse size={22} strokeWidth={1.9} />,
    roles: [
      'doctor',
      'ambulance_driver',
      'hospital_admin',
      'government_admin',
    ],
  },

  {
    label: 'Hospitals',
    path: '/hospitals',
    icon: <Building2 size={22} strokeWidth={1.9} />,
    roles: [
      'patient',
      'doctor',
      'hospital_admin',
      'government_admin',
    ],
  },

  {
    label: 'Ambulances',
    path: '/ambulances',
    icon: <Ambulance size={22} strokeWidth={1.9} />,
    roles: [
      'ambulance_driver',
      'hospital_admin',
      'government_admin',
    ],
  },

  {
    label: 'Live Map',
    path: '/map',
    icon: <MapPin size={22} strokeWidth={1.9} />,
    roles: [
      'patient',
      'ambulance_driver',
      'hospital_admin',
      'government_admin',
    ],
  },

  {
    label: 'AI Predictions',
    path: '/ai/predictions',
    icon: <BrainCircuit size={22} strokeWidth={1.9} />,
    roles: [
      'patient',
      'doctor',
      'hospital_admin',
    ],
  },

  {
    label: 'AI Chat',
    path: '/ai/chat',
    icon: <MessageSquare size={22} strokeWidth={1.9} />,
    roles: ['patient', 'doctor'],
  },

  {
    label: 'Medical Reports',
    path: '/reports',
    icon: <FileText size={22} strokeWidth={1.9} />,
    roles: ['patient', 'doctor'],
  },

  {
    label: 'My Patients',
    path: '/patients',
    icon: <Stethoscope size={22} strokeWidth={1.9} />,
    roles: ['doctor', 'hospital_admin'],
  },

  {
    label: 'Notifications',
    path: '/notifications',
    icon: <Bell size={22} strokeWidth={1.9} />,
    roles: [
      'patient',
      'doctor',
      'ambulance_driver',
      'hospital_admin',
      'government_admin',
    ],
  },

  {
    label: 'Analytics',
    path: '/analytics',
    icon: <BarChart3 size={22} strokeWidth={1.9} />,
    roles: [
      'hospital_admin',
      'government_admin',
    ],
  },

  {
    label: 'User Management',
    path: '/admin/users',
    icon: <Users size={22} strokeWidth={1.9} />,
    roles: ['government_admin'],
  },

  {
    label: 'Settings',
    path: '/settings',
    icon: <Settings size={22} strokeWidth={1.9} />,
    roles: [
      'patient',
      'doctor',
      'ambulance_driver',
      'hospital_admin',
      'government_admin',
    ],
  },
];

export default function Sidebar() {
  const dispatch = useAppDispatch();

  const {
    sidebarCollapsed,
    sidebarOpen,
  } = useAppSelector((state) => state.ui);

  const { user } = useAppSelector(
    (state) => state.auth
  );

  const userRole = user?.role || 'patient';

  const filteredMenuItems = menuItems.filter(
    (item) => item.roles.includes(userRole)
  );

  const sidebarWidth = sidebarCollapsed
    ? 'var(--sidebar-collapsed)'
    : 'var(--sidebar-width)';

  return (
    <aside
      aria-label="Main navigation"
      className={`aegis-sidebar ${
        sidebarOpen ? 'sidebar-open' : ''
      }`}
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        maxWidth: sidebarWidth,
      }}
    >
      {/* BRAND */}
      <div className="aegis-sidebar-brand">
        <div className="aegis-brand-logo">
          <Shield
            size={22}
            strokeWidth={2.2}
            color="#ffffff"
          />
        </div>

        <AnimatePresence initial={false}>
          {!sidebarCollapsed && (
            <motion.div
              initial={{
                opacity: 0,
                x: -8,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: -8,
              }}
              transition={{ duration: 0.18 }}
              className="aegis-brand-text"
            >
              <h1>
                <span>Aegis</span>{' '}
                <strong>AI</strong>
              </h1>

              <p>
                Emergency Response
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* NAVIGATION */}
      <nav className="aegis-sidebar-nav">
        <ul>
          {filteredMenuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    dispatch(setSidebarOpen(false));
                  }
                }}
                title={
                  sidebarCollapsed
                    ? item.label
                    : undefined
                }
                className={({ isActive }) =>
                  `aegis-nav-link ${
                    isActive
                      ? 'active'
                      : ''
                  } ${
                    sidebarCollapsed
                      ? 'collapsed'
                      : ''
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="nav-active-bar" />
                    )}

                    <span className="nav-icon">
                      {item.icon}
                    </span>

                    <AnimatePresence initial={false}>
                      {!sidebarCollapsed && (
                        <motion.span
                          initial={{
                            opacity: 0,
                            width: 0,
                          }}
                          animate={{
                            opacity: 1,
                            width: 'auto',
                          }}
                          exit={{
                            opacity: 0,
                            width: 0,
                          }}
                          transition={{
                            duration: 0.18,
                          }}
                          className="nav-label"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* COLLAPSE */}
      <div className="aegis-sidebar-footer">
        <button
          type="button"
          onClick={() =>
            dispatch(toggleSidebarCollapse())
          }
          aria-label={
            sidebarCollapsed
              ? 'Expand sidebar'
              : 'Collapse sidebar'
          }
          className={`aegis-collapse-button ${
            sidebarCollapsed
              ? 'collapsed'
              : ''
          }`}
        >
          <span className="collapse-icon">
            {sidebarCollapsed ? (
              <ChevronRight
                size={21}
                strokeWidth={1.8}
              />
            ) : (
              <ChevronLeft
                size={21}
                strokeWidth={1.8}
              />
            )}
          </span>

          <AnimatePresence initial={false}>
            {!sidebarCollapsed && (
              <motion.span
                initial={{
                  opacity: 0,
                  width: 0,
                }}
                animate={{
                  opacity: 1,
                  width: 'auto',
                }}
                exit={{
                  opacity: 0,
                  width: 0,
                }}
                transition={{
                  duration: 0.18,
                }}
                className="collapse-label"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </aside>
  );
}