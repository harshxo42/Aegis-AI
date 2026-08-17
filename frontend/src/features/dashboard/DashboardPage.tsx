/**
 * Aegis AI – Dashboard
 *
 * Professional healthcare operations and emergency response command dashboard.
 * - Role-based statistics
 * - Emergency status
 * - Quick operational shortcuts
 * - Recent emergencies monitor
 * - High-contrast Light & Dark theme support
 * - Responsive layout (320px to 1440px+)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useAppSelector } from '@/store';
import { analyticsAPI } from '@/api/client';
import type { DashboardStats } from '@/types';

import {
  Building2,
  Bed,
  HeartPulse,
  Ambulance,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  ChevronRight,
  Phone,
  ShieldCheck,
  MapPin,
  MessageSquare,
  FileText,
  RefreshCw,
} from 'lucide-react';

const containerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
    },
  },
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const { user } = useAppSelector((state) => state.auth);

  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /* ============================================================
     USER / ROLE
     ============================================================ */

  const role = user?.role || 'patient';
  const isPatient = role === 'patient';
  const isAdmin = role === 'hospital_admin' || role === 'government_admin';

  /* ============================================================
     GREETING
     ============================================================ */

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.full_name?.trim()?.split(/\s+/)[0] || 'User';

  /* ============================================================
     FETCH DASHBOARD DATA
     ============================================================ */

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const response = await analyticsAPI.getDashboard();
      setStats(response?.data?.data || {});
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError(true);
      setStats({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /* ============================================================
     STATISTICS CONFIGURATION
     ============================================================ */

  const adminStats = useMemo(
    () => [
      {
        label: 'Total Hospitals',
        value: stats.total_hospitals || 0,
        subtext: 'Registered centers',
        icon: <Building2 size={20} />,
        accentClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      },
      {
        label: 'Available Beds',
        value: stats.total_available_beds || 0,
        subtext: 'Across all centers',
        icon: <Bed size={20} />,
        accentClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      },
      {
        label: 'Active Emergencies',
        value: stats.active_emergencies || 0,
        subtext: 'In progress',
        icon: <AlertTriangle size={20} />,
        accentClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      },
      {
        label: 'Ambulances Ready',
        value: stats.available_ambulances || 0,
        subtext: 'Ready for dispatch',
        icon: <Ambulance size={20} />,
        accentClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      },
      {
        label: 'ICU Available',
        value: stats.total_icu_available || 0,
        subtext: 'Critical care beds',
        icon: <HeartPulse size={20} />,
        accentClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      },
      {
        label: 'Total Users',
        value: stats.total_users || 0,
        subtext: 'Active accounts',
        icon: <Users size={20} />,
        accentClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      },
    ],
    [stats]
  );

  const patientStats = useMemo(
    () => [
      {
        label: 'My Emergencies',
        value: stats.total_emergencies || 0,
        subtext: 'Submitted requests',
        icon: <Ambulance size={20} />,
        accentClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      },
      {
        label: 'Nearby Hospitals',
        value: stats.nearby_hospitals || 0,
        subtext: 'Within service radius',
        icon: <Building2 size={20} />,
        accentClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      },
    ],
    [stats]
  );

  const displayStats = isPatient
    ? patientStats
    : isAdmin
      ? adminStats
      : adminStats.slice(0, 4);

  /* ============================================================
     QUICK ACTIONS CONFIGURATION
     ============================================================ */

  const quickActions = useMemo(() => {
    const actions = [
      {
        label: 'Find Hospital',
        description: 'Locate medical centers & availability',
        icon: <Building2 size={18} />,
        path: '/hospitals',
        accentClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        roles: ['patient', 'doctor', 'hospital_admin', 'government_admin'],
      },
      {
        label: 'AI Predictions',
        description: 'Assess symptoms & triage guidance',
        icon: <TrendingUp size={18} />,
        path: '/ai/predictions',
        accentClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        roles: ['patient', 'doctor', 'hospital_admin'],
      },
      {
        label: 'Live Map',
        description: 'Emergency routing & facilities map',
        icon: <MapPin size={18} />,
        path: '/map',
        accentClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        roles: ['patient', 'ambulance_driver', 'hospital_admin', 'government_admin'],
      },
      {
        label: 'AI Chat',
        description: 'Consult with Aegis AI assistant',
        icon: <MessageSquare size={18} />,
        path: '/ai/chat',
        accentClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        roles: ['patient', 'doctor'],
      },
      {
        label: 'Medical Reports',
        description: 'Access diagnostic records & analysis',
        icon: <FileText size={18} />,
        path: '/reports',
        accentClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
        roles: ['patient', 'doctor'],
      },
      {
        label: 'Notifications',
        description: 'System alerts & emergency updates',
        icon: <Clock size={18} />,
        path: '/notifications',
        accentClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        roles: [
          'patient',
          'doctor',
          'ambulance_driver',
          'hospital_admin',
          'government_admin',
        ],
      },
    ];

    return actions.filter((action) => action.roles.includes(role));
  }, [role]);

  /* ============================================================
     HELPERS
     ============================================================ */

  const formatStatus = (status?: string) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getSeverityBadge = (severity: number) => {
    if (severity >= 4) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          Level {severity} Critical
        </span>
      );
    }
    if (severity === 3) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          Level {severity} Moderate
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
        Level {severity} Low
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            {formatStatus(status)}
          </span>
        );
      case 'dispatched':
      case 'en_route':
      case 'arrived':
      case 'in_treatment':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            {formatStatus(status)}
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            {formatStatus(status)}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            {formatStatus(status)}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
            {formatStatus(status)}
          </span>
        );
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <motion.div
      className="space-y-6 max-w-7xl mx-auto pb-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}
      <motion.section
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-5"
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-500)] block mb-1">
            Operations Overview
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            {getGreeting()}, {firstName}
            <span className="text-xl" aria-hidden="true">
              👋
            </span>
          </h1>

          <p className="text-sm text-[var(--text-muted)] mt-1">
            Real-time emergency coordination and hospital infrastructure metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isPatient && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/emergency')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
            >
              <Phone size={17} />
              <span>SOS Emergency</span>
            </motion.button>
          )}

          <button
            type="button"
            onClick={fetchStats}
            title="Refresh dashboard metrics"
            disabled={loading}
            className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50"
            aria-label="Refresh dashboard"
          >
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </motion.section>

      {/* ======================================================
          ERROR STATE
      ====================================================== */}
      {error && (
        <motion.div
          variants={itemVariants}
          className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <div>
              <strong className="text-sm block">Unable to load dashboard data</strong>
              <p className="text-xs opacity-90">Please check your connection and try again.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchStats}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/40 bg-white dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/50 transition-colors"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* ======================================================
          ACTIVE EMERGENCY BANNER (PATIENT)
      ====================================================== */}
      {isPatient && stats.active_emergency && (
        <motion.button
          type="button"
          variants={itemVariants}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
          onClick={() => navigate('/emergencies')}
          className="w-full text-left p-4 sm:p-5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/15 transition-all flex items-center justify-between gap-4 shadow-xs group"
        >
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <AlertTriangle size={22} className="animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Active Emergency In Progress
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mt-0.5 truncate">
                Emergency Request Active
              </h3>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)] mt-1.5">
                <span>Status:</span>
                <strong className="text-[var(--text-primary)]">
                  {formatStatus(stats.active_emergency.status)}
                </strong>
                <span>•</span>
                <span>Severity:</span>
                <strong className="text-[var(--text-primary)]">
                  {stats.active_emergency.severity} / 5
                </strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm font-semibold text-rose-600 dark:text-rose-400 group-hover:translate-x-1 transition-transform flex-shrink-0">
            <span>View Details</span>
            <ChevronRight size={18} />
          </div>
        </motion.button>
      )}

      {/* ======================================================
          STATISTICS CARDS
      ====================================================== */}
      <motion.section variants={itemVariants}>
        <div
          className={`grid gap-4 ${
            isPatient
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
          }`}
        >
          {displayStats.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-light)] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-all"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs sm:text-[13px] font-bold text-[var(--text-secondary)] leading-tight">
                  {stat.label}
                </span>

                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center border flex-shrink-0 ${stat.accentClass}`}
                >
                  {stat.icon}
                </div>
              </div>

              <div>
                {loading ? (
                  <div className="h-8 w-20 bg-[var(--bg-tertiary)] rounded-md animate-pulse" />
                ) : (
                  <strong className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] block">
                    {Number(stat.value || 0).toLocaleString()}
                  </strong>
                )}

                <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
                  {stat.subtext}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ======================================================
          QUICK ACTIONS
      ====================================================== */}
      <motion.section variants={itemVariants} className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Quick Actions
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Frequently accessed emergency management tools
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <motion.button
              key={action.label}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => navigate(action.path)}
              className="text-left bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] hover:border-[var(--border-light)] rounded-xl p-4 shadow-xs transition-all flex flex-col justify-between group h-full"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 ${action.accentClass}`}
                >
                  {action.icon}
                </div>

                <ChevronRight
                  size={16}
                  className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 transition-all"
                />
              </div>

              <div>
                <strong className="text-sm font-semibold text-[var(--text-primary)] block truncate">
                  {action.label}
                </strong>
                <span className="text-xs text-[var(--text-muted)] mt-0.5 block line-clamp-2">
                  {action.description}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* ======================================================
          RECENT EMERGENCIES (ADMIN JURISDICTION)
      ====================================================== */}
      {isAdmin && stats.recent_emergencies && stats.recent_emergencies.length > 0 && (
        <motion.section variants={itemVariants} className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Recent Emergencies
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Latest incoming requests across active jurisdiction
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/emergencies')}
              className="text-xs font-semibold text-[var(--primary-500)] hover:text-[var(--primary-400)] flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[540px]">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Emergency Type</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Requested Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/60">
                  {stats.recent_emergencies.map((emergency) => (
                    <tr
                      key={emergency.id}
                      onClick={() => navigate('/emergencies')}
                      className="hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-[var(--text-primary)] capitalize">
                        {emergency.type}
                      </td>
                      <td className="py-3.5 px-4">
                        {getSeverityBadge(emergency.severity)}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(emergency.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-[var(--text-muted)]">
                        {emergency.requested_at
                          ? new Date(emergency.requested_at).toLocaleString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>
      )}

      {/* ======================================================
          FOOTER
      ====================================================== */}
      <motion.footer
        variants={itemVariants}
        className="pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--text-muted)]"
      >
        <div className="flex items-center gap-1.5 font-medium text-[var(--text-secondary)]">
          <ShieldCheck size={16} className="text-[var(--primary-500)]" />
          <span>Aegis AI Clinical Emergency Operations</span>
        </div>

        <span>© 2026 Aegis AI. All rights reserved.</span>
      </motion.footer>
    </motion.div>
  );
}