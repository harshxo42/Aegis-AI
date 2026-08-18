/**
 * Aegis AI – Emergency Details Page
 *
 * View an individual emergency request and its current status.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Clock,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Ambulance,
  CheckCircle2,
  Ban,
  X,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

import { emergenciesAPI } from '@/api/client';
import type { EmergencyRequest } from '@/types';
import { useWebSocket, type WebSocketEvent } from '@/hooks/useWebSocket';


const ACTIVE_STATUSES = [
  'requested',
  'dispatched',
  'en_route',
  'arrived',
  'in_treatment',
];

const STATUS_STEPS = [
  {
    key: 'requested',
    label: 'Request Submitted',
  },
  {
    key: 'dispatched',
    label: 'Ambulance Dispatched',
  },
  {
    key: 'en_route',
    label: 'Ambulance En Route',
  },
  {
    key: 'arrived',
    label: 'Ambulance Arrived',
  },
  {
    key: 'in_treatment',
    label: 'Treatment Started',
  },
  {
    key: 'resolved',
    label: 'Emergency Resolved',
  },
];

export default function EmergencyDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [emergency, setEmergency] =
    useState<EmergencyRequest | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Real-time WebSocket event listener
  const handleWebSocketEvent = useCallback(
    (event: WebSocketEvent) => {
      if (!id) return;

      if (
        event.type === 'emergency_status_updated' &&
        event.data &&
        String(event.data.id) === String(id)
      ) {
        setEmergency((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            ...event.data,
          };
        });
        const statusLabel = event.data.status?.replace('_', ' ') || 'updated';
        toast.success(`Emergency status updated to ${statusLabel}`);
      } else if (
        event.type === 'emergency_cancelled' &&
        event.data &&
        String(event.data.id) === String(id)
      ) {
        setEmergency((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            status: 'cancelled',
            resolved_at: event.data.resolved_at || new Date().toISOString(),
          };
        });
        setShowCancelModal(false);
        toast.error('This emergency request was cancelled.');
      }
    },
    [id]
  );

  const { isConnected } = useWebSocket({
    channels: id ? [`emergency_${id}`] : [],
    onEvent: handleWebSocketEvent,
    enabled: !!id,
  });


  const fetchEmergency = useCallback(
    async (showRefreshLoader = false) => {
      if (!id) {
        setError('Emergency ID is missing.');
        setLoading(false);
        return;
      }

      try {
        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        try {
          const directRes = await emergenciesAPI.getById(id);
          const directData = directRes?.data?.data || directRes?.data;
          if (directData && String(directData.id) === String(id)) {
            setEmergency(directData);
            setError('');
            return;
          }
        } catch {
          // Fallback to searching the list if single endpoint is restricted
        }

        const response = await emergenciesAPI.list({});
        const rawData = response?.data?.data || response?.data;
        const data: EmergencyRequest[] = Array.isArray(rawData) ? rawData : [];

        const found = data.find(
          (item) => String(item.id) === String(id)
        );

        if (!found) {
          setEmergency(null);
          setError('Emergency request could not be found.');
          return;
        }

        setEmergency(found);
        setError('');
      } catch (err: any) {
        console.error(
          'Failed to fetch emergency details:',
          err
        );

        setError(
          err?.response?.data?.message ||
            'Failed to load emergency details.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    fetchEmergency();
  }, [fetchEmergency]);

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

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  const getCurrentStep = (status: string) => {
    const index = STATUS_STEPS.findIndex(
      (step) => step.key === status
    );

    return index === -1 ? 0 : index;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="skeleton h-10 w-48 rounded-xl" />

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-6">
          <div className="skeleton h-8 w-1/3 rounded-lg" />
          <div className="skeleton h-5 w-1/2 rounded-lg" />
          <div className="skeleton h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !emergency) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/emergencies')}
          className="mb-6 flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-medium"
        >
          <ArrowLeft size={18} />
          Back to Emergencies
        </button>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-12 text-center shadow-xs">
          <AlertTriangle
            size={48}
            className="mx-auto mb-4 text-rose-500"
          />

          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Emergency Not Found
          </h1>

          <p className="text-[var(--text-muted)] mt-2 text-sm">
            {error || 'This emergency request is no longer available.'}
          </p>

          <button
            type="button"
            onClick={() => navigate('/emergencies')}
            className="mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--primary-600)] hover:bg-[var(--primary-500)] transition-colors shadow-xs"
          >
            View Emergencies
          </button>
        </div>
      </div>
    );
  }

  const handleConfirmCancel = async () => {
    if (!emergency || cancelling) return;
    try {
      setCancelling(true);
      await emergenciesAPI.cancel(emergency.id);
      toast.success('Emergency request cancelled successfully.');
      setShowCancelModal(false);
      await fetchEmergency(true);
    } catch (err: any) {
      console.error('Failed to cancel emergency:', err);
      toast.error(
        err?.response?.data?.message ||
          'Failed to cancel emergency request. Please try again.'
      );
    } finally {
      setCancelling(false);
    }
  };

  const statusColor = getStatusColor(emergency.status);
  const currentStep = getCurrentStep(emergency.status);
  const isActive = ACTIVE_STATUSES.includes(
    emergency.status
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/emergencies')}
          className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors font-medium"
        >
          <ArrowLeft size={18} />
          Back to Emergencies
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{isConnected ? 'Live Sync' : 'Connecting...'}</span>
          </div>

          {isActive && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              disabled={cancelling}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <Ban size={15} />
              <span>Cancel Emergency</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchEmergency(true)}
            disabled={refreshing}
            className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh status"
          >
            <RefreshCw
              size={17}
              className={refreshing ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>



      {/* =====================================================
          MAIN HEADER
      ====================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs"
        style={{
          borderLeft:
            emergency.severity >= 4
              ? '4px solid var(--danger-500)'
              : '4px solid var(--border-color)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                emergency.severity >= 4
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
              }`}
            >
              <Activity
                size={28}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] capitalize">
                  {emergency.emergency_type} Emergency
                </h1>

                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                >
                  LEVEL {emergency.severity}
                </span>
              </div>

              <p className="text-xs text-[var(--text-muted)] mt-1.5 font-mono">
                Tracking ID: {emergency.id}
              </p>
            </div>
          </div>

          <div
            className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider self-start"
            style={{
              color: statusColor,
              background: `${statusColor}18`,
              border: `1px solid ${statusColor}40`,
            }}
          >
            {getStatusLabel(emergency.status)}
          </div>
        </div>
      </motion.div>

      {/* =====================================================
          ACTIVE STATUS BANNER
      ====================================================== */}
      {isActive && (
        <div
          className="rounded-xl p-4 flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300"
        >
          <ShieldAlert
            size={22}
            className="flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5"
          />

          <div>
            <p className="font-bold text-sm text-[var(--text-primary)]">
              Active Dispatch In Progress
            </p>

            <p className="text-xs text-[var(--text-muted)] mt-1">
              Your emergency request is being processed. Keep your phone line clear and follow instructions from emergency responders.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          STATUS TIMELINE
      ====================================================== */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6 border-b border-[var(--border-color)] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Operational Progression
            </h2>

            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Live lifecycle status of this emergency event
            </p>
          </div>

          <Ambulance
            size={24}
            style={{
              color: statusColor,
            }}
          />
        </div>

        <div className="space-y-4">
          {STATUS_STEPS.map((step, index) => {
            const completed =
              index <= currentStep;

            const current =
              index === currentStep;

            return (
              <div
                key={step.key}
                className="flex items-start gap-4"
              >
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{
                      background: completed
                        ? `${statusColor}20`
                        : 'var(--bg-tertiary)',
                      border: completed
                        ? `1px solid ${statusColor}80`
                        : '1px solid var(--border-color)',
                      color: completed ? statusColor : 'var(--text-muted)',
                    }}
                  >
                    {completed ? (
                      <CheckCircle2
                        size={16}
                      />
                    ) : (
                      <span>
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {index < STATUS_STEPS.length - 1 && (
                    <div
                      className="w-0.5 h-6 mt-1"
                      style={{
                        background:
                          index < currentStep
                            ? statusColor
                            : 'var(--border-color)',
                      }}
                    />
                  )}
                </div>

                <div className="pt-1">
                  <p
                    className={`text-sm font-semibold ${
                      current
                        ? 'text-[var(--text-primary)] font-bold'
                        : completed
                          ? 'text-[var(--text-secondary)]'
                          : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {step.label}
                  </p>

                  {current && (
                    <p className="text-[11px] text-[var(--primary-500)] font-medium">
                      Active Step
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================
          DETAILS GRID
      ====================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Location */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex-shrink-0"
            >
              <MapPin
                size={20}
              />
            </div>

            <div>
              <h2 className="font-bold text-sm text-[var(--text-primary)]">
                Incident Location
              </h2>

              <p className="text-xs text-[var(--text-muted)]">
                Coordinates & registered address
              </p>
            </div>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
              <p className="text-xs text-[var(--text-muted)] font-semibold uppercase">
                Address
              </p>

              <p className="text-sm font-medium text-[var(--text-primary)] mt-1">
                {emergency.location_address ||
                  'GPS location pinned by caller'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-muted)] font-semibold uppercase">
                  Latitude
                </p>

                <p className="text-sm font-mono text-[var(--text-primary)] mt-1">
                  {emergency.location_lat ?? '-'}
                </p>
              </div>

              <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-muted)] font-semibold uppercase">
                  Longitude
                </p>

                <p className="text-sm font-mono text-[var(--text-primary)] mt-1">
                  {emergency.location_lng ?? '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Request Info */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex-shrink-0"
            >
              <Clock
                size={20}
              />
            </div>

            <div>
              <h2 className="font-bold text-sm text-[var(--text-primary)]">
                Request Metadata
              </h2>

              <p className="text-xs text-[var(--text-muted)]">
                Dispatch log timestamps
              </p>
            </div>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
              <p className="text-xs text-[var(--text-muted)] font-semibold uppercase">
                Time Elapsed
              </p>

              <p className="text-sm font-medium text-[var(--text-primary)] mt-1">
                {emergency.requested_at ? (
                  formatDistanceToNow(
                    new Date(emergency.requested_at),
                    {
                      addSuffix: true,
                    }
                  )
                ) : (
                  '-'
                )}
              </p>
            </div>

            <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
              <p className="text-xs text-[var(--text-muted)] font-semibold uppercase">
                Logged Timestamp
              </p>

              <p className="text-sm font-medium text-[var(--text-primary)] mt-1">
                {emergency.requested_at
                  ? format(
                      new Date(emergency.requested_at),
                      'dd MMM yyyy, hh:mm a'
                    )
                  : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          DESCRIPTION
      ====================================================== */}
      {emergency.description && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle
              size={18}
              className="text-amber-500"
            />

            <h2 className="font-bold text-sm text-[var(--text-primary)]">
              Caller Notes & Triage Description
            </h2>
          </div>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap p-3.5 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
            {emergency.description}
          </p>
        </div>
      )}

      {/* Footer note */}
      <div className="text-center text-xs text-[var(--text-muted)]">
        <p>
          Emergency information refreshes automatically when status transitions occur or on manual refresh.
        </p>
      </div>

      {/* =====================================================
          CONFIRMATION MODAL
      ====================================================== */}
      <AnimatePresence>
        {showCancelModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xl overflow-hidden p-6 space-y-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <h3
                      id="cancel-modal-title"
                      className="text-base font-bold text-[var(--text-primary)]"
                    >
                      Cancel Emergency SOS?
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                      Are you sure you want to cancel this emergency request? Any active ambulance dispatch and hospital intake alert will be stood down immediately.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <span>This action is permanent and cannot be undone. If you still require urgent assistance, keep the emergency active.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-50 cursor-pointer"
                >
                  Keep Active
                </button>

                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleConfirmCancel}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {cancelling ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <Ban size={14} />
                      <span>Confirm Cancellation</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}