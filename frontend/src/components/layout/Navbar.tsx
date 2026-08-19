/**
 * Aegis AI – Navbar
 * Clean, stable and responsive top navigation with true global application search
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
  LayoutDashboard,
  Building2,
  FileText,
  AlertTriangle,
  Siren,
  MapPin,
  Sparkles,
  MessageSquare,
  Ambulance,
  Users,
  BarChart3,
  ShieldCheck,
  SearchX,
  ArrowRight,
} from 'lucide-react';

import { useAppSelector, useAppDispatch } from '@/store';
import { logoutUser } from '@/store/authSlice';
import { toggleSidebar } from '@/store/uiSlice';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { notificationsAPI } from '@/api/client';
import { useWebSocket, type WebSocketEvent } from '@/hooks/useWebSocket';

/* ============================================================
   GLOBAL SEARCH DESTINATIONS & REGISTRY
   ============================================================ */

interface SearchDestination {
  id: string;
  title: string;
  category: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  keywords: string[];
}

const SEARCH_DESTINATIONS: SearchDestination[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    category: 'Navigation',
    path: '/dashboard',
    icon: LayoutDashboard,
    keywords: ['dashboard', 'home', 'overview', 'main', 'dash'],
  },
  {
    id: 'hospitals',
    title: 'Hospitals Directory',
    category: 'Directory',
    path: '/hospitals',
    icon: Building2,
    keywords: ['hospital', 'hospitals', 'directory'],
  },
  {
    id: 'medical_reports',
    title: 'Medical Reports',
    category: 'Clinical AI',
    path: '/reports',
    icon: FileText,
    keywords: ['medical reports', 'medical report', 'reports', 'report', 'lab', 'labs', 'ocr', 'lab report'],
  },
  {
    id: 'emergency_sos',
    title: 'Emergency SOS',
    category: 'Emergency',
    path: '/emergency',
    icon: AlertTriangle,
    keywords: ['emergency', 'emergency sos', 'sos', 'panic', 'help', 'urgent'],
  },
  {
    id: 'emergencies',
    title: 'Active Emergencies',
    category: 'Emergency',
    path: '/emergencies',
    icon: Siren,
    keywords: ['emergencies', 'active emergencies', 'incidents', 'cases'],
  },
  {
    id: 'live_map',
    title: 'Live Map',
    category: 'Navigation',
    path: '/map',
    icon: MapPin,
    keywords: ['live map', 'map', 'tracking', 'tracker', 'gps'],
  },
  {
    id: 'ai_predictions',
    title: 'AI Predictions',
    category: 'Clinical AI',
    path: '/ai/predictions',
    icon: Sparkles,
    keywords: ['ai predictions', 'predictions', 'prediction', 'triage', 'symptoms', 'diagnosis'],
  },
  {
    id: 'ai_chat',
    title: 'AI Chat Assistant',
    category: 'Clinical AI',
    path: '/ai/chat',
    icon: MessageSquare,
    keywords: ['ai chat', 'chat', 'assistant', 'bot', 'consultation', 'ai assistant'],
  },
  {
    id: 'ambulances',
    title: 'Ambulance Dispatch',
    category: 'Fleet',
    path: '/ambulances',
    icon: Ambulance,
    keywords: ['ambulances', 'ambulance', 'driver', 'dispatch', 'fleet'],
  },
  {
    id: 'patients',
    title: 'My Patients',
    category: 'Clinical',
    path: '/patients',
    icon: Users,
    keywords: ['patients', 'patient', 'my patients'],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    category: 'System',
    path: '/notifications',
    icon: Bell,
    keywords: ['notifications', 'notification', 'alerts', 'inbox'],
  },
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    category: 'System',
    path: '/analytics',
    icon: BarChart3,
    keywords: ['analytics', 'stats', 'statistics', 'insights'],
  },
  {
    id: 'user_management',
    title: 'User Management',
    category: 'Admin',
    path: '/admin/users',
    icon: ShieldCheck,
    keywords: ['user management', 'users', 'admin', 'roles', 'accounts'],
  },
  {
    id: 'settings',
    title: 'Settings & Profile',
    category: 'System',
    path: '/settings',
    icon: Settings,
    keywords: ['settings', 'setting', 'profile', 'preferences'],
  },
];

/* ============================================================
   TIGHTENED HOSPITAL-SPECIFIC QUERY MATCHING
   ============================================================ */

const HOSPITAL_BRANDS = [
  'apollo',
  'max',
  'fortis',
  'aiims',
  'manipal',
  'narayana',
  'medanta',
  'columbia asia',
  'kims',
  'lilavati',
  'hinduja',
];

function checkHospitalQuery(rawQuery: string): { isHospital: boolean; isSpecific: boolean } {
  const q = rawQuery.trim().toLowerCase();
  if (!q) {
    return { isHospital: false, isSpecific: false };
  }

  // Exact 'hospital' or 'hospitals' navigates to the directory page, not a search query param
  if (q === 'hospital' || q === 'hospitals') {
    return { isHospital: true, isSpecific: false };
  }

  // 1. Word-boundary check for known hospital brands (e.g. apollo, max, fortis)
  for (const brand of HOSPITAL_BRANDS) {
    const brandRegex = new RegExp(`(^|\\s)${brand}($|\\s)`, 'i');
    if (brandRegex.test(q)) {
      return { isHospital: true, isSpecific: true };
    }
  }

  // 2. Multi-word phrases containing hospital or clinic (e.g. "delhi hospital", "max hospital", "city clinic")
  const hospitalPhraseRegex = /(^|\s)(hospital|hospitals|clinic|clinics)($|\s)/i;
  if (hospitalPhraseRegex.test(q)) {
    const words = q.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      return { isHospital: true, isSpecific: true };
    }
  }

  return { isHospital: false, isSpecific: false };
}

export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user } = useAppSelector((state) => state.auth);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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
     GLOBAL SEARCH RESULTS COMPUTATION
     ---------------------------------------------------------- */

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return { pages: [], isHospitalQuery: false, isSpecificHospitalQuery: false };
    }

    // Match application pages using exact/prefix/keyword matching
    const pages = SEARCH_DESTINATIONS.filter((item) => {
      const itemTitle = item.title.toLowerCase();
      if (itemTitle === q || itemTitle.startsWith(q)) {
        return true;
      }
      if (item.path.toLowerCase() === q || item.path.toLowerCase() === `/${q}`) {
        return true;
      }
      if (item.keywords.some((kw) => kw === q || kw.startsWith(q) || (q.length >= 3 && kw.includes(q)))) {
        return true;
      }
      return false;
    });

    const { isHospital, isSpecific } = checkHospitalQuery(q);

    return { pages, isHospitalQuery: isHospital, isSpecificHospitalQuery: isSpecific };
  }, [searchQuery]);

  /* ----------------------------------------------------------
     SEARCH EXECUTION
     ---------------------------------------------------------- */

  const executeSearch = (targetPath?: string) => {
    const raw = searchQuery.trim();
    if (!raw) {
      return;
    }

    // Direct path execution (from clicking dropdown item)
    if (targetPath) {
      navigate(targetPath);
      setIsSearchOpen(false);
      setSearchQuery('');
      return;
    }

    const { pages, isSpecificHospitalQuery } = searchResults;

    // 1. Specific hospital query (e.g. "apollo", "max hospital", "delhi hospital", "fortis")
    if (isSpecificHospitalQuery) {
      navigate(`/hospitals?search=${encodeURIComponent(raw)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
      return;
    }

    // 2. Application page destination (e.g. "dashboard", "hospital", "medical reports", "emergency", "sos", "map", "settings")
    if (pages.length > 0) {
      navigate(pages[0].path);
      setIsSearchOpen(false);
      setSearchQuery('');
      return;
    }

    // 3. Unknown query (e.g. "xyzabc999"): DO NOT navigate! Keep dropdown open showing empty state
    setIsSearchOpen(true);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    executeSearch();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch();
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  /* ----------------------------------------------------------
     CLOSE MENUS WHEN CLICKING OUTSIDE
     ---------------------------------------------------------- */

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(target)
      ) {
        setShowUserMenu(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  /* ----------------------------------------------------------
     CLOSE MENUS WITH ESCAPE
     ---------------------------------------------------------- */

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  /* ----------------------------------------------------------
     FETCH UNREAD NOTIFICATIONS & REAL-TIME WEBSOCKET
     ---------------------------------------------------------- */

  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await notificationsAPI.list();
        const items = res?.data?.data || [];
        if (isMounted && Array.isArray(items)) {
          const unread = items.filter((n: any) => !n.is_read).length;
          setUnreadCount(unread);
        }
      } catch {
        // Silently handle
      }
    };
    fetchUnread();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleWebSocketEvent = useCallback(
    (event: WebSocketEvent) => {
      if (event.type === 'notification' && event.data) {
        const notif = event.data;
        setUnreadCount((prev) => prev + 1);

        toast(
          (t) => (
            <div
              onClick={() => {
                toast.dismiss(t.id);
                if (notif.action_url) {
                  navigate(notif.action_url);
                } else {
                  navigate('/notifications');
                }
              }}
              className="cursor-pointer flex items-start gap-3 p-1"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[var(--text-primary)]">
                  {notif.title}
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                  {notif.message}
                </div>
              </div>
            </div>
          ),
          {
            duration: 5000,
            position: 'top-right',
          }
        );
      }
    },
    [navigate]
  );

  useWebSocket({
    onEvent: handleWebSocketEvent,
    enabled: !!user,
  });

  /* ----------------------------------------------------------
     ACTIONS
     ---------------------------------------------------------- */

  const handleLogout = async () => {
    setShowUserMenu(false);
    await dispatch(logoutUser());
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

        {/* MOBILE MENU TOGGLE */}

        <button
          type="button"
          onClick={handleMobileMenu}
          aria-label="Toggle navigation menu"
          className="aegis-mobile-toggle"
        >
          <Menu
            size={20}
            strokeWidth={1.9}
            aria-hidden="true"
          />
        </button>

        {/* GLOBAL SEARCH BAR */}

        <div ref={searchContainerRef} className="relative">
          <form
            role="search"
            onSubmit={handleSearchSubmit}
            className="aegis-search"
          >
            <Search
              size={18}
              strokeWidth={1.9}
              className="aegis-search-icon"
              aria-hidden="true"
            />

            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setIsSearchOpen(true);
                }
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search anything..."
              aria-label="Search anything"
              autoComplete="off"
            />
          </form>

          {/* GLOBAL SEARCH POPOVER */}

          <AnimatePresence>
            {isSearchOpen && searchQuery.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.14 }}
                className="absolute top-full left-0 mt-2 w-[350px] max-w-[90vw] z-50 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl overflow-hidden p-1.5 backdrop-blur-md"
                style={{
                  boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.25), 0 4px 12px -2px rgba(0, 0, 0, 0.12)',
                }}
              >
                {/* APPLICATION PAGES MATCHES */}
                {searchResults.pages.length > 0 && (
                  <div className="space-y-0.5">
                    <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-[var(--text-muted)]">
                      Navigation & Pages
                    </div>
                    {searchResults.pages.slice(0, 4).map((dest) => {
                      const IconComp = dest.icon;
                      return (
                        <button
                          key={dest.id}
                          type="button"
                          onClick={() => executeSearch(dest.path)}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left hover:bg-[var(--bg-hover)] transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--primary-500)] flex-shrink-0">
                              <IconComp size={15} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                                {dest.title}
                              </div>
                              <div className="text-[11px] text-[var(--text-muted)] truncate">
                                {dest.category} &bull; {dest.path}
                              </div>
                            </div>
                          </div>
                          <ArrowRight
                            size={13}
                            className="text-[var(--text-muted)] opacity-50 group-hover:opacity-100 group-hover:text-[var(--text-primary)] transition-all group-hover:translate-x-0.5 flex-shrink-0 ml-2"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* HOSPITAL SEARCH PROMPT */}
                {searchResults.isSpecificHospitalQuery && (
                  <div className="mt-1 pt-1 border-t border-[var(--border-color)] space-y-0.5">
                    <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-[var(--text-muted)]">
                      Hospital Directory
                    </div>
                    <button
                      type="button"
                      onClick={() => executeSearch(`/hospitals?search=${encodeURIComponent(searchQuery.trim())}`)}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left hover:bg-[var(--bg-hover)] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 flex-shrink-0">
                          <Building2 size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                            Search hospitals for "{searchQuery.trim()}"
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] truncate">
                            Hospitals Directory &bull; Search matching hospitals
                          </div>
                        </div>
                      </div>
                      <ArrowRight
                        size={13}
                        className="text-[var(--text-muted)] opacity-50 group-hover:opacity-100 group-hover:text-[var(--text-primary)] transition-all group-hover:translate-x-0.5 flex-shrink-0 ml-2"
                      />
                    </button>
                  </div>
                )}

                {/* EMPTY NO-MATCH STATE */}
                {searchResults.pages.length === 0 && !searchResults.isSpecificHospitalQuery && (
                  <div className="py-4 px-3 text-center">
                    <SearchX size={20} className="mx-auto mb-1.5 text-[var(--text-muted)] opacity-60" />
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      No matching results found
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      No pages or hospital records match "{searchQuery.trim()}"
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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
          className="aegis-icon-button relative"
        >
          <Bell
            size={21}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
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