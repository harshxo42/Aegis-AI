/**
 * Aegis AI – Emergencies List Page
 *
 * View active and past emergencies. Role-based view.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { emergenciesAPI } from '@/api/client';
import type { EmergencyRequest } from '@/types';
import {
  AlertTriangle,
  MapPin,
  Activity,
  Clock,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useAppSelector } from '@/store';

type EmergencyFilter = 'active' | 'resolved' | 'all';

const ACTIVE_STATUSES = [
  'requested',
  'dispatched',
  'en_route',
  'arrived',
  'in_treatment',
];

const RESOLVED_STATUSES = ['resolved'];

export default function EmergenciesListPage() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] =
    useState<EmergencyFilter>('active');

  // ---------------------------------------------------------
  // Fetch emergencies
  // ---------------------------------------------------------
  const fetchEmergencies = useCallback(
    async (showRefreshLoader = false) => {
      try {
        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        /*
         * IMPORTANT:
         *
         * "active" is a frontend filter, not necessarily a backend
         * status value.
         *
         * The actual statuses used by this app are:
         * requested, dispatched, en_route, arrived,
         * in_treatment, resolved, cancelled.
         *
         * Therefore we fetch the complete list and filter it here.
         */
        const response = await emergenciesAPI.list({});

        const rawData = response?.data?.data;

        const data: EmergencyRequest[] = Array.isArray(rawData)
          ? rawData
          : [];

        let filteredData: EmergencyRequest[];

        if (filter === 'active') {
          filteredData = data.filter((emergency) =>
            ACTIVE_STATUSES.includes(emergency.status)
          );
        } else if (filter === 'resolved') {
          filteredData = data.filter((emergency) =>
            RESOLVED_STATUSES.includes(emergency.status)
          );
        } else {
          filteredData = data;
        }

        setEmergencies(filteredData);
      } catch (error) {
        console.error(
          'Failed to fetch emergencies:',
          error
        );

        setEmergencies([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter]
  );

  // ---------------------------------------------------------
  // Initial/filter-based fetch
  // ---------------------------------------------------------
  useEffect(() => {
    fetchEmergencies();
  }, [fetchEmergencies]);

  // ---------------------------------------------------------
  // Refresh current list
  // ---------------------------------------------------------
  const handleRefresh = () => {
    fetchEmergencies(true);
  };

  // ---------------------------------------------------------
  // Status pill helper
  // ---------------------------------------------------------
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            Requested
          </span>
        );
      case 'dispatched':
      case 'en_route':
      case 'arrived':
      case 'in_treatment':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            {status.replace(/_/g, ' ')}
          </span>
        );
      case 'resolved':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            Resolved
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
            {status.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  const renderSeverityBadge = (severity: number) => {
    if (severity >= 4) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex-shrink-0">
          Level {severity} Critical
        </span>
      );
    }
    if (severity === 3) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex-shrink-0">
          Level {severity} Moderate
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex-shrink-0">
        Level {severity} Low
      </span>
    );
  };

  // ---------------------------------------------------------
  // Empty state text
  // ---------------------------------------------------------
  const getEmptyMessage = () => {
    if (filter === 'active') {
      return 'No active emergencies found';
    }

    if (filter === 'resolved') {
      return 'No resolved emergencies found';
    }

    return 'No emergencies found';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-[var(--text-primary)]">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <Activity size={22} />
            </div>
            Incident Command Queue
          </h1>

          <p className="text-sm mt-1 text-[var(--text-muted)]">
            {user?.role === 'patient'
              ? 'Your emergency history and active response tickets'
              : 'Live triage queue, active dispatches, and emergency records'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            title="Refresh emergencies"
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? 'animate-spin' : ''
              }
            />
          </button>

          {/* Filters */}
          <div className="flex flex-wrap gap-1 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)]">
            {(['active', 'resolved', 'all'] as EmergencyFilter[]).map(
              (currentFilter) => (
                <button
                  key={currentFilter}
                  type="button"
                  onClick={() => setFilter(currentFilter)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    filter === currentFilter
                      ? 'bg-[var(--primary-600)] text-white shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {currentFilter}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          LIST
      ====================================================== */}
      <div className="space-y-3.5">
        {loading ? (
          [1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 flex gap-4"
            >
              <div className="skeleton h-12 w-12 rounded-xl flex-shrink-0" />

              <div className="flex-1 space-y-3">
                <div className="skeleton h-5 w-1/4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            </div>
          ))
        ) : emergencies.length === 0 ? (
          /* =================================================
             EMPTY STATE
          ================================================== */
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] border-dashed rounded-xl p-12 text-center">
            <AlertTriangle
              size={44}
              className="mx-auto mb-3 text-[var(--text-muted)] opacity-60"
            />

            <p className="text-base font-semibold text-[var(--text-primary)]">
              {getEmptyMessage()}
            </p>

            {filter === 'active' && (
              <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-sm mx-auto">
                Active emergency requests will appear here in real-time as they are submitted.
              </p>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={
                  refreshing ? 'animate-spin' : ''
                }
              />
              Refresh Queue
            </button>
          </div>
        ) : (
          /* =================================================
             EMERGENCY CARDS
          ================================================== */
          emergencies.map((emergency, index) => {
            const isCritical = emergency.severity >= 4;

            return (
              <motion.div
                key={emergency.id}
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: Math.min(index * 0.03, 0.2),
                }}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-light)] rounded-xl p-5 hover:bg-[var(--bg-hover)] transition-all cursor-pointer group shadow-xs"
                onClick={() =>
                  navigate(
                    `/emergencies/${emergency.id}`
                  )
                }
                style={{
                  borderLeft: isCritical
                    ? '4px solid var(--danger-500)'
                    : '4px solid var(--border-color)',
                }}
              >
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  {/* Left content */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isCritical
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      <Activity
                        size={20}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                        <h3 className="font-bold text-base capitalize text-[var(--text-primary)] group-hover:text-[var(--primary-500)] transition-colors">
                          {emergency.emergency_type}{' '}
                          Emergency
                        </h3>

                        {renderSeverityBadge(emergency.severity)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1 min-w-0">
                          <MapPin
                            size={13}
                            className="flex-shrink-0 text-[var(--primary-500)]"
                          />

                          <span className="truncate max-w-[420px] text-[var(--text-secondary)]">
                            {emergency.location_address ||
                              'GPS coordinates registered'}
                          </span>
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock size={13} />

                          {emergency.requested_at ? (
                            <span>
                              {formatDistanceToNow(
                                new Date(
                                  emergency.requested_at
                                ),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </span>
                          ) : (
                            <span>-</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right content */}
                  <div className="flex items-center justify-between w-full md:w-auto md:flex-col md:items-end gap-2.5 border-t md:border-t-0 border-[var(--border-color)] pt-3 md:pt-0">
                    {renderStatusBadge(emergency.status)}

                    <span
                      className="flex items-center gap-1 text-xs text-[var(--primary-500)] font-semibold group-hover:underline"
                    >
                      View Details
                      <ChevronRight size={15} />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}