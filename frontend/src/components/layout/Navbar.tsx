/**
 * Aegis AI – Navbar
 * Clean, stable and responsive top navigation
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
} from 'lucide-react';

import { useAppSelector, useAppDispatch } from '@/store';
import { logout } from '@/store/authSlice';
import { toggleSidebar } from '@/store/uiSlice';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user } = useAppSelector((state) => state.auth);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const role = user?.role || 'patient';

  const roleColors: Record<string, string> = {
    patient: '#10b981',
    doctor: '#3b82f6',
    ambulance_driver: '#f59e0b',
    hospital_admin: '#8b5cf6',
    government_admin: '#ef4444',
  };

  const roleLabels: Record<string, string> = {
    patient: 'Patient',
    doctor: 'Doctor',
    ambulance_driver: 'Driver',
    hospital_admin: 'Hospital Admin',
    government_admin: 'Gov. Admin',
  };

  const roleColor = roleColors[role] || '#6b7280';
  const roleLabel = roleLabels[role] || role;

  const userName = user?.full_name?.trim() || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  /* ----------------------------------------------------------
     CLOSE USER MENU WHEN CLICKING OUTSIDE
     ---------------------------------------------------------- */

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };
  }, []);

  /* ----------------------------------------------------------
     CLOSE USER MENU WITH ESCAPE
     ---------------------------------------------------------- */

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  /* ----------------------------------------------------------
     ACTIONS
     ---------------------------------------------------------- */

  const handleLogout = () => {
    setShowUserMenu(false);
    dispatch(logout());
    navigate('/login');
  };

  const handleNotifications = () => {
    setShowUserMenu(false);
    navigate('/notifications');
  };

  const handleSettings = () => {
    setShowUserMenu(false);
    navigate('/settings');
  };

  const handleProfile = () => {
    setShowUserMenu(false);

    // Keep the existing settings route until a dedicated
    // profile route is available.
    navigate('/settings');
  };

  const handleMobileMenu = () => {
    setShowUserMenu(false);
    dispatch(toggleSidebar());
  };

  return (
    <header className="aegis-navbar">
      {/* ======================================================
          LEFT SIDE
         ====================================================== */}

      <div className="aegis-navbar-left">

        {/* MOBILE MENU */}

        <button
          type="button"
          onClick={handleMobileMenu}
          aria-label="Open navigation menu"
          className="navbar-mobile-toggle"
        >
          <Menu
            size={21}
            strokeWidth={2}
          />
        </button>

        {/* SEARCH */}

        <div className="aegis-search">
          <Search
            size={19}
            strokeWidth={1.9}
            className="aegis-search-icon"
            aria-hidden="true"
          />

          <input
            type="search"
            placeholder="Search anything..."
            aria-label="Search anything"
            autoComplete="off"
          />
        </div>
      </div>

      {/* ======================================================
          RIGHT SIDE
         ====================================================== */}

      <div className="aegis-navbar-right">

        {/* THEME TOGGLE */}
        <ThemeToggle />

        {/* NOTIFICATIONS */}

        <button
          type="button"
          onClick={handleNotifications}
          aria-label="Open notifications"
          className="aegis-icon-button"
        >
          <Bell
            size={21}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          <span
            className="notification-dot"
            aria-hidden="true"
          />
        </button>

        {/* ==================================================
            USER MENU
           ================================================== */}

        <div
          className="aegis-user-wrapper"
          ref={userMenuRef}
        >

          <button
            type="button"
            onClick={() =>
              setShowUserMenu((prev) => !prev)
            }
            aria-expanded={showUserMenu}
            aria-haspopup="menu"
            className={`aegis-user-button ${
              showUserMenu ? 'is-open' : ''
            }`}
          >

            {/* AVATAR */}

            <div
              className="aegis-avatar"
              style={{
                background: `linear-gradient(
                  135deg,
                  ${roleColor},
                  ${roleColor}99
                )`,
                boxShadow: `0 4px 14px ${roleColor}30`,
              }}
            >
              {userInitial}
            </div>

            {/* USER INFORMATION */}

            <div className="aegis-user-info">
              <span className="aegis-user-name">
                {userName}
              </span>

              <span className="aegis-user-role">
                {roleLabel}
              </span>
            </div>

            <ChevronDown
              size={16}
              strokeWidth={1.9}
              className={`aegis-chevron ${
                showUserMenu ? 'rotated' : ''
              }`}
            />
          </button>

          {/* USER DROPDOWN */}

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -8,
                  scale: 0.97,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -8,
                  scale: 0.97,
                }}
                transition={{
                  duration: 0.16,
                }}
                className="aegis-user-menu"
                role="menu"
              >

                {/* PROFILE HEADER */}

                <div className="aegis-menu-profile">

                  <div
                    className="aegis-menu-avatar"
                    style={{
                      background: `linear-gradient(
                        135deg,
                        ${roleColor},
                        ${roleColor}99
                      )`,
                    }}
                  >
                    {userInitial}
                  </div>

                  <div className="aegis-menu-user-text">
                    <strong>
                      {userName}
                    </strong>

                    <span>
                      {user?.email || roleLabel}
                    </span>
                  </div>

                </div>

                {/* PROFILE */}

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleProfile}
                  className="aegis-menu-item"
                >
                  <User
                    size={17}
                    strokeWidth={1.9}
                  />

                  <span>
                    Profile
                  </span>
                </button>

                {/* SETTINGS */}

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSettings}
                  className="aegis-menu-item"
                >
                  <Settings
                    size={17}
                    strokeWidth={1.9}
                  />

                  <span>
                    Settings
                  </span>
                </button>

                <div className="aegis-menu-divider" />

                {/* SIGN OUT */}

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="aegis-menu-item danger"
                >
                  <LogOut
                    size={17}
                    strokeWidth={1.9}
                  />

                  <span>
                    Sign Out
                  </span>
                </button>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </header>
  );
}