/**
 * Aegis AI – Dashboard
 *
 * Main emergency-response dashboard.
 * - Role based statistics
 * - Emergency status
 * - Quick actions
 * - Recent emergencies
 * - Loading / error handling
 * - Responsive friendly
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
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },

  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const { user } = useAppSelector(
    (state) => state.auth
  );

  const [stats, setStats] =
    useState<DashboardStats>({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  /* ============================================================
     USER / ROLE
     ============================================================ */

  const role = user?.role || 'patient';

  const isPatient =
    role === 'patient';

  const isAdmin =
    role === 'hospital_admin' ||
    role === 'government_admin';

  /* ============================================================
     GREETING
     ============================================================ */

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Good Morning';
    }

    if (hour < 17) {
      return 'Good Afternoon';
    }

    return 'Good Evening';
  };

  const firstName =
    user?.full_name
      ?.trim()
      ?.split(/\s+/)[0] || 'User';

  /* ============================================================
     FETCH DASHBOARD DATA
     ============================================================ */

  const fetchStats = useCallback(
    async () => {
      setLoading(true);
      setError(false);

      try {
        const response =
          await analyticsAPI.getDashboard();

        setStats(
          response?.data?.data || {}
        );
      } catch (err) {
        console.error(
          'Failed to fetch dashboard stats:',
          err
        );

        setError(true);
        setStats({});
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /* ============================================================
     STATISTICS
     ============================================================ */

  const adminStats = useMemo(
    () => [
      {
        label: 'Total Hospitals',
        value:
          stats.total_hospitals || 0,
        icon: <Building2 size={22} />,
        color: '#3b82f6',
        gradient:
          'linear-gradient(135deg, #3b82f6, #2563eb)',
      },

      {
        label: 'Available Beds',
        value:
          stats.total_available_beds || 0,
        icon: <Bed size={22} />,
        color: '#10b981',
        gradient:
          'linear-gradient(135deg, #10b981, #059669)',
      },

      {
        label: 'Active Emergencies',
        value:
          stats.active_emergencies || 0,
        icon: <AlertTriangle size={22} />,
        color: '#f43f5e',
        gradient:
          'linear-gradient(135deg, #f43f5e, #e11d48)',
      },

      {
        label: 'Ambulances Available',
        value:
          stats.available_ambulances || 0,
        icon: <Ambulance size={22} />,
        color: '#f59e0b',
        gradient:
          'linear-gradient(135deg, #f59e0b, #d97706)',
      },

      {
        label: 'ICU Available',
        value:
          stats.total_icu_available || 0,
        icon: <HeartPulse size={22} />,
        color: '#8b5cf6',
        gradient:
          'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      },

      {
        label: 'Total Users',
        value:
          stats.total_users || 0,
        icon: <Users size={22} />,
        color: '#06b6d4',
        gradient:
          'linear-gradient(135deg, #06b6d4, #0891b2)',
      },
    ],
    [stats]
  );

  const patientStats = useMemo(
    () => [
      {
        label: 'My Emergencies',
        value:
          stats.total_emergencies || 0,
        icon: <Ambulance size={22} />,
        color: '#3b82f6',
        gradient:
          'linear-gradient(135deg, #3b82f6, #2563eb)',
      },

      {
        label: 'Nearby Hospitals',
        value:
          stats.nearby_hospitals || 0,
        icon: <Building2 size={22} />,
        color: '#8b5cf6',
        gradient:
          'linear-gradient(135deg, #8b5cf6, #7c3aed)',
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
     QUICK ACTIONS
     ============================================================ */

  const quickActions = useMemo(() => {
    const actions = [
      {
        label: 'Find Hospital',
        description:
          'Locate nearby medical centers',
        icon: <Building2 size={20} />,
        path: '/hospitals',
        color: '#3b82f6',
        gradient:
          'linear-gradient(135deg, #3b82f6, #2563eb)',
        roles: [
          'patient',
          'doctor',
          'hospital_admin',
          'government_admin',
        ],
      },

      {
        label: 'AI Predictions',
        description:
          'Assess symptoms & triage',
        icon: <TrendingUp size={20} />,
        path: '/ai/predictions',
        color: '#8b5cf6',
        gradient:
          'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        roles: [
          'patient',
          'doctor',
          'hospital_admin',
        ],
      },

      {
        label: 'View Map',
        description:
          'Live tracking & facilities',
        icon: <MapPin size={20} />,
        path: '/map',
        color: '#10b981',
        gradient:
          'linear-gradient(135deg, #10b981, #059669)',
        roles: [
          'patient',
          'ambulance_driver',
          'hospital_admin',
          'government_admin',
        ],
      },

      {
        label: 'AI Chat',
        description:
          'Talk with Aegis AI',
        icon: <MessageSquare size={20} />,
        path: '/ai/chat',
        color: '#6366f1',
        gradient:
          'linear-gradient(135deg, #6366f1, #4f46e5)',
        roles: [
          'patient',
          'doctor',
        ],
      },

      {
        label: 'Medical Reports',
        description:
          'View your medical records',
        icon: <FileText size={20} />,
        path: '/reports',
        color: '#06b6d4',
        gradient:
          'linear-gradient(135deg, #06b6d4, #0891b2)',
        roles: [
          'patient',
          'doctor',
        ],
      },

      {
        label: 'Notifications',
        description:
          'Recent alerts & updates',
        icon: <Clock size={20} />,
        path: '/notifications',
        color: '#f59e0b',
        gradient:
          'linear-gradient(135deg, #f59e0b, #d97706)',
        roles: [
          'patient',
          'doctor',
          'ambulance_driver',
          'hospital_admin',
          'government_admin',
        ],
      },
    ];

    return actions.filter((action) =>
      action.roles.includes(role)
    );
  }, [role]);

  /* ============================================================
     HELPERS
     ============================================================ */

  const formatStatus = (
    status?: string
  ) => {
    if (!status) {
      return 'Unknown';
    }

    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <motion.div
      className="dashboard-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="dashboard-inner">

        {/* ======================================================
            PAGE HEADER
        ====================================================== */}

        <motion.section
          variants={itemVariants}
          className="dashboard-header"
        >
          <div className="dashboard-heading">

            <span className="dashboard-page-title">
              DASHBOARD
            </span>

            <div className="dashboard-title-row">
              <h1>
                {getGreeting()}, {firstName}

                <span
                  className="dashboard-wave"
                  aria-hidden="true"
                >
                  👋
                </span>
              </h1>
            </div>

            <p>
              Here's your emergency response
              overview for today
            </p>
          </div>

          <div className="dashboard-header-actions">

            {isPatient && (
              <motion.button
                type="button"
                whileHover={{
                  y: -2,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                onClick={() =>
                  navigate('/emergency')
                }
                className="dashboard-sos"
              >
                <Phone size={18} />
                <span>
                  SOS Emergency
                </span>
              </motion.button>
            )}

          </div>
        </motion.section>

        {/* ======================================================
            ERROR STATE
        ====================================================== */}

        {error && (
          <motion.div
            variants={itemVariants}
            className="dashboard-error"
          >
            <div>
              <strong>
                Unable to load dashboard data
              </strong>

              <p>
                Please check your connection
                and try again.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchStats}
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </motion.div>
        )}

        {/* ======================================================
            ACTIVE EMERGENCY
        ====================================================== */}

        {isPatient &&
          stats.active_emergency && (
            <motion.button
              type="button"
              variants={itemVariants}
              className="active-emergency"
              onClick={() =>
                navigate('/emergencies')
              }
            >
              <div className="emergency-left">

                <div className="emergency-icon">
                  <AlertTriangle size={22} />

                  <span className="emergency-pulse" />
                </div>

                <div className="emergency-content">
                  <h3>
                    Active Emergency in Progress
                  </h3>

                  <p>
                    <span>Status:</span>{' '}

                    <strong>
                      {formatStatus(
                        stats.active_emergency.status
                      )}
                    </strong>

                    <span className="emergency-dot">
                      •
                    </span>

                    <span>
                      Severity:
                    </span>{' '}

                    <strong>
                      {
                        stats.active_emergency
                          .severity
                      }
                      /5
                    </strong>
                  </p>
                </div>
              </div>

              <span className="emergency-arrow">
                <ChevronRight size={20} />
              </span>
            </motion.button>
          )}

        {/* ======================================================
            STATISTICS
        ====================================================== */}

        <motion.section
          variants={itemVariants}
          className={`dashboard-stats ${
            isPatient
              ? 'patient-stats'
              : ''
          }`}
        >
          {displayStats.map((stat) => (
            <motion.article
              key={stat.label}
              className="dashboard-stat-card"
              whileHover={{
                y: -2,
              }}
              transition={{
                duration: 0.15,
              }}
            >
              <div className="stat-content">

                <span className="stat-label">
                  {stat.label}
                </span>

                {loading ? (
                  <span
                    className="stat-loading"
                    aria-label="Loading"
                  />
                ) : (
                  <strong className="stat-number">
                    {Number(
                      stat.value || 0
                    ).toLocaleString()}
                  </strong>
                )}
              </div>

              <div
                className="stat-icon"
                style={{
                  background:
                    stat.gradient,

                  boxShadow:
                    `0 8px 24px ${stat.color}30`,
                }}
              >
                {stat.icon}
              </div>
            </motion.article>
          ))}
        </motion.section>

        {/* ======================================================
            QUICK ACTIONS
        ====================================================== */}

        <motion.section
          variants={itemVariants}
          className="quick-actions-section"
        >
          <div className="section-heading">
            <div>
              <h2>
                Quick Actions
              </h2>

              <p>
                Frequently used tools and
                emergency services
              </p>
            </div>
          </div>

          <div className="quick-actions-grid">

            {quickActions.map((action) => (
              <motion.button
                key={action.label}
                type="button"
                whileHover={{
                  y: -3,
                }}
                whileTap={{
                  scale: 0.985,
                }}
                onClick={() =>
                  navigate(action.path)
                }
                className="quick-action-card"
              >
                <span
                  className="quick-action-icon"
                  style={{
                    background:
                      action.gradient,

                    boxShadow:
                      `0 8px 22px ${action.color}30`,
                  }}
                >
                  {action.icon}
                </span>

                <span className="quick-action-content">

                  <strong>
                    {action.label}
                  </strong>

                  <span>
                    {action.description}
                  </span>

                </span>

                <ChevronRight
                  size={18}
                  className="quick-action-arrow"
                />
              </motion.button>
            ))}

          </div>
        </motion.section>

        {/* ======================================================
            RECENT EMERGENCIES
        ====================================================== */}

        {isAdmin &&
          stats.recent_emergencies &&
          stats.recent_emergencies.length > 0 && (
            <motion.section
              variants={itemVariants}
              className="recent-emergencies"
            >
              <div className="section-heading section-heading-row">

                <div>
                  <h2>
                    Recent Emergencies
                  </h2>

                  <p>
                    Latest incoming requests
                    across your jurisdiction
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate('/emergencies')
                  }
                  className="view-all-button"
                >
                  <span>
                    View All
                  </span>

                  <ChevronRight
                    size={16}
                  />
                </button>

              </div>

              <div className="recent-table-card">

                <div className="recent-table-scroll">

                  <table>
                    <thead>
                      <tr>
                        <th>
                          Type
                        </th>

                        <th>
                          Severity
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Time
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {stats.recent_emergencies.map(
                        (emergency) => (
                          <tr
                            key={
                              emergency.id
                            }
                            onClick={() =>
                              navigate(
                                '/emergencies'
                              )
                            }
                          >
                            <td>
                              {
                                emergency.type
                              }
                            </td>

                            <td>
                              <span
                                className={`severity-${emergency.severity}`}
                              >
                                Level{' '}
                                {
                                  emergency.severity
                                }
                              </span>
                            </td>

                            <td>
                              <span
                                className={`status-${emergency.status}`}
                              >
                                {formatStatus(
                                  emergency.status
                                )}
                              </span>
                            </td>

                            <td>
                              {emergency.requested_at
                                ? new Date(
                                    emergency.requested_at
                                  ).toLocaleString()
                                : '-'}
                            </td>
                          </tr>
                        )
                      )}
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
          className="dashboard-footer"
        >
          <div className="footer-brand">
            <ShieldCheck size={15} />

            <span>
              Aegis AI
            </span>
          </div>

          <span>
            © 2026 Aegis AI. All rights reserved.
          </span>
        </motion.footer>

      </div>
    </motion.div>
  );
}