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
  // Status colors
  // ---------------------------------------------------------
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'var(--warning-400)';

      case 'dispatched':
        return 'var(--primary-400)';

      case 'en_route':
        return 'var(--accent-400)';

      case 'arrived':
        return 'var(--accent-500)';

      case 'in_treatment':
        return 'var(--primary-500)';

      case 'resolved':
        return 'var(--text-muted)';

      case 'cancelled':
        return 'var(--danger-400)';

      default:
        return 'var(--text-secondary)';
    }
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Activity
              size={28}
              style={{ color: 'var(--danger-400)' }}
            />
            Emergencies
          </h1>

          <p className="text-sm mt-1 text-gray-400">
            {user?.role === 'patient'
              ? 'Your emergency history and active requests'
              : 'Manage emergency requests and dispatches'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            title="Refresh emergencies"
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-gray-400 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? 'animate-spin' : ''
              }
            />
          </button>

          {/* Filters */}
          <div className="flex flex-wrap gap-1 bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-color)]">
            {(['active', 'resolved', 'all'] as EmergencyFilter[]).map(
              (currentFilter) => (
                <button
                  key={currentFilter}
                  type="button"
                  onClick={() => setFilter(currentFilter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    filter === currentFilter
                      ? 'bg-[var(--bg-secondary)] text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
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
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map((item) => (
            <div
              key={item}
              className="glass-card p-6 flex gap-4"
            >
              <div className="skeleton h-12 w-12 rounded-full flex-shrink-0" />

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
          <div className="glass-card p-12 text-center border-dashed">
            <AlertTriangle
              size={48}
              className="mx-auto mb-4 text-gray-600"
            />

            <p className="text-lg font-medium text-gray-300">
              {getEmptyMessage()}
            </p>

            {filter === 'active' && (
              <p className="text-sm text-gray-500 mt-2">
                Active emergency requests will appear here
                after they are successfully submitted.
              </p>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  refreshing ? 'animate-spin' : ''
                }
              />
              Refresh
            </button>
          </div>
        ) : (
          /* =================================================
             EMERGENCY CARDS
          ================================================== */
          emergencies.map((emergency, index) => {
            const statusColor = getStatusColor(
              emergency.status
            );

            const isCritical = emergency.severity >= 4;

            return (
              <motion.div
                key={emergency.id}
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: index * 0.05,
                }}
                className="glass-card p-5 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group"
                onClick={() =>
                  navigate(
                    `/emergencies/${emergency.id}`
                  )
                }
                style={{
                  borderLeft: isCritical
                    ? '4px solid var(--danger-500)'
                    : '4px solid transparent',
                }}
              >
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  {/* Left content */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background:
                          'rgba(239, 68, 68, 0.1)',
                      }}
                    >
                      <Activity
                        size={24}
                        style={{
                          color:
                            'var(--danger-400)',
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg capitalize text-white group-hover:text-[var(--danger-400)] transition-colors">
                          {emergency.emergency_type}{' '}
                          Emergency
                        </h3>

                        <span
                          className={`severity-${emergency.severity} px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0`}
                        >
                          Lvl {emergency.severity}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1 min-w-0">
                          <MapPin
                            size={14}
                            className="flex-shrink-0"
                          />

                          <span className="truncate max-w-[420px]">
                            {emergency.location_address ||
                              'Location provided via GPS'}
                          </span>
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock size={14} />

                          {formatDistanceToNow(
                            new Date(
                              emergency.requested_at
                            ),
                            {
                              addSuffix: true,
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right content */}
                  <div className="flex items-center justify-between w-full md:w-auto md:flex-col md:items-end gap-2 border-t md:border-t-0 border-[var(--border-color)] pt-3 md:pt-0">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                      style={{
                        color: statusColor,
                        background: `${statusColor}20`,
                        border: `1px solid ${statusColor}40`,
                      }}
                    >
                      {emergency.status.replace(
                        /_/g,
                        ' '
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();

                        navigate(
                          `/emergencies/${emergency.id}`
                        );
                      }}
                      className="flex items-center gap-1 text-sm text-[var(--primary-400)] font-medium group-hover:underline"
                    >
                      View Details
                      <ChevronRight size={16} />
                    </button>
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