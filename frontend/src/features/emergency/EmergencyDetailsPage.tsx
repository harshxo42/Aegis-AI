/**
 * Aegis AI – Emergency Details Page
 *
 * View an individual emergency request and its current status.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

import { emergenciesAPI } from '@/api/client';
import type { EmergencyRequest } from '@/types';

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

        /*
         * We use the existing emergency list API because the current
         * project already exposes emergenciesAPI.list().
         *
         * The requested emergency is then selected by ID.
         */
        const response = await emergenciesAPI.list({});

        const rawData = response?.data?.data;

        const data: EmergencyRequest[] = Array.isArray(rawData)
          ? rawData
          : [];

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

        <div className="glass-card p-6 space-y-6">
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
          className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Emergencies
        </button>

        <div className="glass-card p-12 text-center">
          <AlertTriangle
            size={48}
            className="mx-auto mb-4 text-[var(--danger-400)]"
          />

          <h1 className="text-xl font-semibold text-white">
            Emergency Not Found
          </h1>

          <p className="text-gray-400 mt-2">
            {error || 'This emergency request is no longer available.'}
          </p>

          <button
            type="button"
            onClick={() => navigate('/emergencies')}
            className="mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{
              background:
                'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
            }}
          >
            View Emergencies
          </button>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(emergency.status);
  const currentStep = getCurrentStep(emergency.status);
  const isActive = ACTIVE_STATUSES.includes(
    emergency.status
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Back + Refresh */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/emergencies')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Emergencies
        </button>

        <button
          type="button"
          onClick={() => fetchEmergency(true)}
          disabled={refreshing}
          className="w-10 h-10 rounded-xl flex items-center justify-center border border-[var(--border-color)] bg-[var(--bg-tertiary)] text-gray-400 hover:text-white transition-all disabled:opacity-50"
          title="Refresh status"
        >
          <RefreshCw
            size={17}
            className={refreshing ? 'animate-spin' : ''}
          />
        </button>
      </div>

      {/* =====================================================
          MAIN HEADER
      ====================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
        style={{
          borderLeft:
            emergency.severity >= 4
              ? '4px solid var(--danger-500)'
              : '4px solid transparent',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
              }}
            >
              <Activity
                size={28}
                style={{
                  color: 'var(--danger-400)',
                }}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-white capitalize">
                  {emergency.emergency_type} Emergency
                </h1>

                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    color: 'var(--danger-400)',
                    background:
                      'rgba(239, 68, 68, 0.12)',
                  }}
                >
                  LEVEL {emergency.severity}
                </span>
              </div>

              <p className="text-sm text-gray-400 mt-2">
                Emergency ID: {emergency.id}
              </p>
            </div>
          </div>

          <div
            className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider self-start"
            style={{
              color: statusColor,
              background: `${statusColor}20`,
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
          className="rounded-xl p-4 flex items-start gap-3"
          style={{
            background:
              'rgba(245, 158, 11, 0.08)',
            border:
              '1px solid rgba(245, 158, 11, 0.25)',
          }}
        >
          <ShieldAlert
            size={21}
            className="flex-shrink-0"
            style={{
              color: 'var(--warning-400)',
            }}
          />

          <div>
            <p className="font-semibold text-white">
              Emergency response is active
            </p>

            <p className="text-sm text-gray-400 mt-1">
              Your emergency request is being processed.
              Keep your phone available and follow the
              instructions from emergency responders.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          STATUS TIMELINE
      ====================================================== */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Response Status
            </h2>

            <p className="text-sm text-gray-400 mt-1">
              Track the progress of your emergency request
            </p>
          </div>

          <Ambulance
            size={24}
            style={{
              color: statusColor,
            }}
          />
        </div>

        <div className="space-y-5">
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
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      background: completed
                        ? `${statusColor}20`
                        : 'var(--bg-tertiary)',
                      border: completed
                        ? `1px solid ${statusColor}60`
                        : '1px solid var(--border-color)',
                    }}
                  >
                    {completed ? (
                      <CheckCircle2
                        size={18}
                        style={{
                          color: statusColor,
                        }}
                      />
                    ) : (
                      <span className="text-xs text-gray-500">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {index < STATUS_STEPS.length - 1 && (
                    <div
                      className="w-px h-8 mt-1"
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
                    className={`font-medium ${
                      current
                        ? 'text-white'
                        : completed
                          ? 'text-gray-300'
                          : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </p>

                  {current && (
                    <p className="text-xs mt-1 text-gray-400">
                      Current status
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
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background:
                  'rgba(16, 185, 129, 0.1)',
              }}
            >
              <MapPin
                size={20}
                style={{
                  color: 'var(--accent-400)',
                }}
              />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                Emergency Location
              </h2>

              <p className="text-xs text-gray-500">
                Location provided with your request
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">
                Address
              </p>

              <p className="text-gray-200 mt-1">
                {emergency.location_address ||
                  'Location provided via GPS'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">
                  Latitude
                </p>

                <p className="text-gray-200 mt-1">
                  {emergency.location_lat}
                </p>
              </div>

              <div>
                <p className="text-gray-500">
                  Longitude
                </p>

                <p className="text-gray-200 mt-1">
                  {emergency.location_lng}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Request Info */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background:
                  'rgba(59, 130, 246, 0.1)',
              }}
            >
              <Clock
                size={20}
                style={{
                  color: 'var(--primary-400)',
                }}
              />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                Request Information
              </h2>

              <p className="text-xs text-gray-500">
                Emergency request details
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-gray-500">
                Requested
              </p>

              <p className="text-gray-200 mt-1">
                {formatDistanceToNow(
                  new Date(emergency.requested_at),
                  {
                    addSuffix: true,
                  }
                )}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Date & Time
              </p>

              <p className="text-gray-200 mt-1">
                {format(
                  new Date(emergency.requested_at),
                  'dd MMM yyyy, hh:mm a'
                )}
              </p>
            </div>

            <div>
              <p className="text-gray-500">
                Current Status
              </p>

              <p
                className="font-semibold capitalize mt-1"
                style={{
                  color: statusColor,
                }}
              >
                {getStatusLabel(emergency.status)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          DESCRIPTION
      ====================================================== */}
      {emergency.description && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle
              size={20}
              style={{
                color: 'var(--warning-400)',
              }}
            />

            <h2 className="font-semibold text-white">
              Additional Details
            </h2>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {emergency.description}
          </p>
        </div>
      )}

      {/* Footer note */}
      <div className="text-center text-xs text-gray-500">
        <p>
          Emergency information refreshes when you use
          the refresh button above.
        </p>
      </div>
    </div>
  );
}