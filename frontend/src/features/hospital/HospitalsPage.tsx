/**
 * Aegis AI – Hospital Listing Page
 *
 * Production-ready hospital discovery page with:
 * - Debounced search
 * - City/type filters
 * - Refresh
 * - Loading skeletons
 * - Error recovery
 * - Empty states
 * - Hospital availability metrics
 * - Navigation to hospital details
 * - Defensive API response parsing
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import {
  Ambulance,
  Bed,
  Building2,
  ChevronRight,
  Droplets,
  FlaskConical,
  HeartPulse,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Wifi,
  X,
  AlertCircle,
} from 'lucide-react';

import { hospitalsAPI } from '@/api/client';
import type { Hospital } from '@/types';

/* ============================================================
   HELPERS
============================================================ */

type HospitalResponsePayload = unknown;

function extractHospitalList(payload: HospitalResponsePayload): Hospital[] {
  /*
   * Backend response formats can differ depending on the
   * API wrapper / FastAPI response model.
   *
   * Supported:
   *
   * 1. { data: [...] }
   * 2. { data: { data: [...] } }
   * 3. { data: { items: [...] } }
   * 4. { data: { hospitals: [...] } }
   * 5. { items: [...] }
   * 6. { hospitals: [...] }
   * 7. [...]
   */

  if (Array.isArray(payload)) {
    return payload as Hospital[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const root = payload as Record<string, unknown>;

  if (Array.isArray(root.data)) {
    return root.data as Hospital[];
  }

  if (
    root.data &&
    typeof root.data === 'object'
  ) {
    const nested = root.data as Record<string, unknown>;

    if (Array.isArray(nested.data)) {
      return nested.data as Hospital[];
    }

    if (Array.isArray(nested.items)) {
      return nested.items as Hospital[];
    }

    if (Array.isArray(nested.hospitals)) {
      return nested.hospitals as Hospital[];
    }

    if (Array.isArray(nested.results)) {
      return nested.results as Hospital[];
    }
  }

  if (Array.isArray(root.items)) {
    return root.items as Hospital[];
  }

  if (Array.isArray(root.hospitals)) {
    return root.hospitals as Hospital[];
  }

  if (Array.isArray(root.results)) {
    return root.results as Hospital[];
  }

  return [];
}

function getHospitalId(hospital: Hospital): string {
  return String(hospital.id);
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function HospitalsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const querySearch = searchParams.get('search') || searchParams.get('q') || '';

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState(querySearch);
  const [cityFilter, setCityFilter] = useState(searchParams.get('city') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('hospital_type') || '');

  const [debouncedSearch, setDebouncedSearch] = useState(querySearch.trim());

  /* ==========================================================
     SYNC SEARCH PARAMS FROM URL
  ========================================================== */

  useEffect(() => {
    const urlQuery = searchParams.get('search') || searchParams.get('q') || '';
    setSearch(urlQuery);
    setDebouncedSearch(urlQuery.trim());

    const urlCity = searchParams.get('city') || '';
    setCityFilter(urlCity);

    const urlType = searchParams.get('hospital_type') || '';
    setTypeFilter(urlType);
  }, [searchParams]);

  /* ==========================================================
     DEBOUNCE SEARCH
  ========================================================== */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  /* ==========================================================
     FETCH HOSPITALS
  ========================================================== */

  const fetchHospitals = useCallback(
    async (isRefresh = false) => {
      try {
        setError('');

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const params: Record<string, string> = {};

        if (debouncedSearch) {
          params.search = debouncedSearch;
        }

        if (cityFilter) {
          params.city = cityFilter;
        }

        if (typeFilter) {
          params.hospital_type = typeFilter;
        }

        const response = await hospitalsAPI.list(params);

        /*
         * Axios response:
         *
         * response.data = backend response body
         *
         * We intentionally parse defensively because APIs may
         * return slightly different wrappers.
         */
        const hospitalList = extractHospitalList(
          response?.data
        );

        setHospitals(hospitalList);
      } catch (err) {
        console.error(
          '[Aegis AI] Failed to fetch hospitals:',
          err
        );

        setHospitals([]);

        if (
          err &&
          typeof err === 'object' &&
          'response' in err
        ) {
          const axiosError = err as {
            response?: {
              status?: number;
              data?: {
                detail?: string;
                message?: string;
              };
            };
          };

          const status = axiosError.response?.status;
          const backendMessage =
            axiosError.response?.data?.detail ||
            axiosError.response?.data?.message;

          if (status === 401) {
            setError(
              'Your session has expired. Please login again.'
            );
          } else if (status === 403) {
            setError(
              'You do not have permission to view hospitals.'
            );
          } else if (backendMessage) {
            setError(String(backendMessage));
          } else {
            setError(
              'Unable to load hospitals. Please try again.'
            );
          }
        } else {
          setError(
            'Unable to load hospitals. Please try again.'
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      debouncedSearch,
      cityFilter,
      typeFilter,
    ]
  );

  /* ==========================================================
     INITIAL + FILTER FETCH
  ========================================================== */

  useEffect(() => {
    void fetchHospitals();
  }, [fetchHospitals]);

  /* ==========================================================
     FILTER HELPERS
  ========================================================== */

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCityFilter('');
    setTypeFilter('');
    setSearchParams({}, { replace: true });
  };

  const hasFilters = Boolean(
    search.trim() ||
      cityFilter ||
      typeFilter ||
      searchParams.toString()
  );

  /* ==========================================================
     SUMMARY
  ========================================================== */

  const summary = useMemo(() => {
    const emergencyHospitals =
      hospitals.filter(
        (hospital) =>
          Boolean(hospital.has_emergency)
      ).length;

    const totalBeds =
      hospitals.reduce(
        (total, hospital) =>
          total +
          (Number(hospital.available_beds) || 0),
        0
      );

    const totalICU =
      hospitals.reduce(
        (total, hospital) =>
          total +
          (Number(hospital.icu_available) || 0),
        0
      );

    const verified =
      hospitals.filter(
        (hospital) =>
          Boolean(hospital.is_verified)
      ).length;

    return {
      hospitals: hospitals.length,
      emergencyHospitals,
      totalBeds,
      totalICU,
      verified,
    };
  }, [hospitals]);

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex-shrink-0"
            >
              <Building2
                size={23}
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                Hospitals Directory
              </h1>

              <p
                className="text-sm mt-1"
                style={{
                  color: 'var(--text-muted)',
                }}
              >
                Find hospitals, emergency services, beds and ICU availability.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void fetchHospitals(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-[var(--bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? 'animate-spin'
                : ''
            }
          />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </div>

      {/* ======================================================
          SUMMARY
      ======================================================= */}

      {!loading &&
        !error &&
        hospitals.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <SummaryCard
              label="Hospitals"
              value={summary.hospitals}
              icon={<Building2 size={18} />}
            />

            <SummaryCard
              label="24/7 Emergency"
              value={
                summary.emergencyHospitals
              }
              icon={<Ambulance size={18} />}
            />

            <SummaryCard
              label="Available Beds"
              value={summary.totalBeds}
              icon={<Bed size={18} />}
            />

            <SummaryCard
              label="ICU Available"
              value={summary.totalICU}
              icon={<HeartPulse size={18} />}
            />

            <SummaryCard
              label="Verified"
              value={summary.verified}
              icon={<ShieldCheck size={18} />}
            />
          </div>
        )}

      {/* ======================================================
          SEARCH + FILTERS
      ======================================================= */}

      <div
        className="bg-[var(--bg-card)] p-4 rounded-xl shadow-xs"
        style={{
          border:
            '1px solid var(--border-color)',
        }}
      >
        <div className="flex flex-col xl:flex-row gap-3">
          {/* Search */}

          <div className="relative flex-1 min-w-0">
            <Search
              size={18}
              className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: '14px',
                color: 'var(--text-muted)',
              }}
            />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search hospitals by name, specialty, or location..."
              className="w-full rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              style={{
                color:
                  'var(--text-primary)',
                background:
                  'var(--bg-tertiary)',
                border:
                  '1px solid var(--border-color)',
                paddingLeft: '44px',
                paddingRight: search
                  ? '42px'
                  : '14px',
                height: '44px',
              }}
            />

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setDebouncedSearch('');
                  setSearchParams(
                    (prev) => {
                      const next = new URLSearchParams(prev);
                      next.delete('search');
                      next.delete('q');
                      return next;
                    },
                    { replace: true }
                  );
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/5"
                aria-label="Clear search"
              >
                <X
                  size={15}
                  style={{
                    color:
                      'var(--text-muted)',
                  }}
                />
              </button>
            )}
          </div>

          {/* City */}

          <select
            value={cityFilter}
            onChange={(event) =>
              setCityFilter(
                event.target.value
              )
            }
            className="rounded-xl text-sm outline-none flex-shrink-0 xl:w-44"
            style={{
              background:
                'var(--bg-tertiary)',
              border:
                '1px solid var(--border-color)',
              color:
                'var(--text-primary)',
              paddingLeft: '14px',
              paddingRight: '14px',
              height: '44px',
            }}
          >
            <option value="">
              All Cities
            </option>
            <option value="New Delhi">
              New Delhi
            </option>
            <option value="Mumbai">
              Mumbai
            </option>
            <option value="Mohali">
              Mohali
            </option>
            <option value="Bengaluru">
              Bengaluru
            </option>
            <option value="Chandigarh">
              Chandigarh
            </option>
            <option value="Hyderabad">
              Hyderabad
            </option>
            <option value="Pune">
              Pune
            </option>
          </select>

          {/* Type */}

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value
              )
            }
            className="rounded-xl text-sm outline-none flex-shrink-0 xl:w-44"
            style={{
              background:
                'var(--bg-tertiary)',
              border:
                '1px solid var(--border-color)',
              color:
                'var(--text-primary)',
              paddingLeft: '14px',
              paddingRight: '14px',
              height: '44px',
            }}
          >
            <option value="">
              All Types
            </option>

            <option value="government">
              Government
            </option>

            <option value="private">
              Private
            </option>
          </select>

          {/* Clear */}

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5"
              style={{
                background:
                  'rgba(239, 68, 68, 0.08)',
                color:
                  'var(--danger-400)',
                border:
                  '1px solid rgba(239, 68, 68, 0.18)',
                height: '44px',
              }}
            >
              <X size={15} />
              Clear
            </button>
          )}
        </div>

        {/* Result info */}

        {!loading && !error && (
          <div className="flex items-center justify-between mt-3 px-1">
            <p
              className="text-xs"
              style={{
                color:
                  'var(--text-muted)',
              }}
            >
              {hospitals.length} hospital
              {hospitals.length === 1
                ? ''
                : 's'}{' '}
              found
            </p>

            {hasFilters && (
              <span
                className="text-xs"
                style={{
                  color:
                    'var(--primary-400)',
                }}
              >
                Filters applied
              </span>
            )}
          </div>
        )}
      </div>

      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && !loading && (
        <div
          className="bg-rose-500/10 border border-rose-500/25 p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4 text-rose-600 dark:text-rose-400"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/15 flex-shrink-0"
          >
            <AlertCircle
              size={20}
              className="text-rose-600 dark:text-rose-400"
            />
          </div>

          <div className="flex-1">
            <p className="font-semibold text-sm text-[var(--text-primary)]">
              Hospitals could not be loaded
            </p>

            <p
              className="text-xs mt-1"
              style={{
                color:
                  'var(--text-muted)',
              }}
            >
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void fetchHospitals(true)
            }
            className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--bg-hover)] transition-colors"
            style={{
              background:
                'var(--bg-card)',
              border:
                '1px solid var(--border-color)',
              color:
                'var(--text-primary)',
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ======================================================
          LOADING
      ======================================================= */}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 space-y-4"
              >
                <div className="flex justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="skeleton h-5 w-3/5" />
                    <div className="skeleton h-3 w-2/5" />
                  </div>

                  <div className="skeleton h-7 w-16 rounded-lg" />
                </div>

                <div className="flex gap-3">
                  <div className="skeleton h-16 flex-1 rounded-xl" />
                  <div className="skeleton h-16 flex-1 rounded-xl" />
                  <div className="skeleton h-16 flex-1 rounded-xl" />
                </div>

                <div className="skeleton h-4 w-full" />
              </div>
            )
          )}
        </div>
      )}

      {/* ======================================================
          EMPTY STATE
      ======================================================= */}

      {!loading &&
        !error &&
        hospitals.length === 0 && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-12 text-center">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
            >
              <Building2
                size={30}
              />
            </div>

            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {hasFilters ? 'No matching hospitals found' : 'No hospitals are currently available.'}
            </p>

            <p
              className="text-sm mt-2 max-w-md mx-auto"
              style={{
                color:
                  'var(--text-muted)',
              }}
            >
              {hasFilters
                ? 'Try changing your search or filters to find available hospitals.'
                : 'There are currently no active hospital records in the system.'}
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--primary-600)] text-white hover:bg-[var(--primary-500)] transition-colors"
              >
                <X size={15} />
                Clear Filters
              </button>
            )}
          </div>
        )}

      {/* ======================================================
          HOSPITAL CARDS
      ======================================================= */}

      {!loading &&
        !error &&
        hospitals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hospitals.map(
              (hospital, index) => {
                const hospitalId =
                  getHospitalId(hospital);

                return (
                  <motion.div
                    key={hospitalId}
                    initial={{
                      opacity: 0,
                      y: 12,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: Math.min(
                        index * 0.04,
                        0.25
                      ),
                    }}
                    onClick={() =>
                      navigate(
                        `/hospitals/${hospitalId}`
                      )
                    }
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-light)] rounded-xl p-5 cursor-pointer group transition-all duration-200 hover:-translate-y-0.5 shadow-xs"
                  >
                    {/* Header */}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        >
                          <Building2
                            size={19}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-base text-[var(--text-primary)] truncate group-hover:text-[var(--primary-500)] transition-colors">
                              {hospital.name}
                            </h3>

                            {hospital.is_verified && (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              >
                                <ShieldCheck
                                  size={10}
                                />
                                VERIFIED
                              </span>
                            )}
                          </div>

                          <div
                            className="flex items-center gap-1 mt-1 text-xs"
                            style={{
                              color:
                                'var(--text-muted)',
                            }}
                          >
                            <MapPin
                              size={12}
                            />

                            <span>
                              {
                                hospital.city
                              }
                              ,{' '}
                              {
                                hospital.state
                              }
                            </span>

                            {hospital.distance_km !==
                              undefined &&
                              hospital.distance_km !==
                                null && (
                                <>
                                  <span>
                                    •
                                  </span>

                                  <span
                                    className="text-[var(--primary-500)] font-medium"
                                  >
                                    {
                                      hospital.distance_km
                                    }{' '}
                                    km away
                                  </span>
                                </>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Rating */}

                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400"
                      >
                        <Star
                          size={12}
                          fill="currentColor"
                        />

                        <span
                          className="text-xs font-semibold"
                        >
                          {hospital.rating
                            ? Number(
                                hospital.rating
                              ).toFixed(1)
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Badges */}

                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                      {hospital.hospital_type && (
                        <span
                          className="text-xs px-2.5 py-1 rounded-lg font-medium capitalize"
                          style={{
                            background:
                              hospital.hospital_type ===
                              'government'
                                ? 'rgba(59, 130, 246, 0.10)'
                                : 'rgba(139, 92, 246, 0.10)',
                            color:
                              hospital.hospital_type ===
                              'government'
                                ? 'var(--primary-500)'
                                : 'var(--accent-500)',
                            border:
                              hospital.hospital_type ===
                              'government'
                                ? '1px solid rgba(59, 130, 246, 0.20)'
                                : '1px solid rgba(139, 92, 246, 0.20)',
                          }}
                        >
                          {
                            hospital.hospital_type
                          }
                        </span>
                      )}

                      {hospital.has_emergency && (
                        <span
                          className="text-xs px-2.5 py-1 rounded-lg font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        >
                          24/7 Emergency
                        </span>
                      )}
                    </div>

                    {/* Availability */}

                    <div className="grid grid-cols-3 gap-2.5 mt-4">
                      <AvailabilityStat
                        icon={
                          <Bed size={16} />
                        }
                        value={
                          hospital.available_beds ??
                          0
                        }
                        label="Beds"
                        iconColor="var(--primary-500)"
                      />

                      <AvailabilityStat
                        icon={
                          <HeartPulse
                            size={16}
                          />
                        }
                        value={
                          hospital.icu_available ??
                          0
                        }
                        label="ICU"
                        iconColor="var(--danger-500)"
                      />

                      <AvailabilityStat
                        icon={
                          <Ambulance
                            size={16}
                          />
                        }
                        value={
                          hospital.has_ambulance
                            ? 'Yes'
                            : 'No'
                        }
                        label="Ambulance"
                        iconColor="var(--warning-500)"
                      />
                    </div>

                    {/* Facilities + CTA */}

                    <div
                      className="flex items-center gap-3 mt-4 pt-3"
                      style={{
                        borderTop:
                          '1px solid var(--border-color)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {hospital.has_pharmacy && (
                          <span
                            title="Pharmacy available"
                            className="flex items-center"
                          >
                            <FlaskConical
                              size={15}
                              style={{
                                color:
                                  'var(--text-muted)',
                              }}
                            />
                          </span>
                        )}

                        {hospital.has_lab && (
                          <span
                            title="Laboratory available"
                            className="flex items-center"
                          >
                            <Wifi
                              size={15}
                              style={{
                                color:
                                  'var(--text-muted)',
                              }}
                            />
                          </span>
                        )}

                        {hospital.has_blood_bank && (
                          <span
                            title="Blood bank available"
                            className="flex items-center"
                          >
                            <Droplets
                              size={15}
                              style={{
                                color:
                                  'var(--text-muted)',
                              }}
                            />
                          </span>
                        )}

                        {!hospital.has_pharmacy &&
                          !hospital.has_lab &&
                          !hospital.has_blood_bank && (
                            <span
                              className="text-xs"
                              style={{
                                color:
                                  'var(--text-muted)',
                              }}
                            >
                              Facility information unavailable
                            </span>
                          )}
                      </div>

                      <div className="flex-1" />

                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary-500)] group-hover:text-[var(--primary-400)] transition-colors"
                      >
                        View Details

                        <ChevronRight
                          size={15}
                          className="group-hover:translate-x-0.5 transition-transform"
                        />
                      </span>
                    </div>
                  </motion.div>
                );
              }
            )}
          </div>
        )}
    </motion.div>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div
      className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-xs"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{
              color:
                'var(--text-muted)',
            }}
          >
            {label}
          </p>

          <p className="text-xl font-bold text-[var(--text-primary)] mt-1">
            {value}
          </p>
        </div>

        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   AVAILABILITY STAT
============================================================ */

function AvailabilityStat({
  icon,
  value,
  label,
  iconColor,
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  iconColor: string;
}) {
  return (
    <div
      className="text-center py-2.5 px-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]/60"
    >
      <div
        className="flex justify-center mb-1"
        style={{
          color: iconColor,
        }}
      >
        {icon}
      </div>

      <p
        className="text-sm font-bold text-[var(--text-primary)]"
      >
        {value}
      </p>

      <p
        className="text-[11px]"
        style={{
          color:
            'var(--text-muted)',
        }}
      >
        {label}
      </p>
    </div>
  );
}