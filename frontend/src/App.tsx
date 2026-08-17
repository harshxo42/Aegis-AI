/**
 * Aegis AI – Main React App
 *
 * Production-oriented application shell:
 * - Centralized routing
 * - Authentication guards
 * - Lazy-loaded pages
 * - Global error boundary
 * - Global toast notifications
 * - Emergency detail routing
 */

import React, { Suspense, useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { useAppDispatch } from '@/store';
import { fetchCurrentUser } from '@/store/authSlice';

// Layout & Guards
import AppLayout from '@/components/layout/AppLayout';
import {
  ProtectedRoute,
  PublicRoute,
} from '@/routes/guards';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

/* ============================================================
   LAZY LOADED PAGES
   ============================================================ */

const LoginPage = React.lazy(
  () => import('@/features/auth/LoginPage')
);

const RegisterPage = React.lazy(
  () => import('@/features/auth/RegisterPage')
);

const DashboardPage = React.lazy(
  () => import('@/features/dashboard/DashboardPage')
);

const EmergencySOSPage = React.lazy(
  () => import('@/features/emergency/EmergencySOSPage')
);

const EmergenciesListPage = React.lazy(
  () => import('@/features/emergency/EmergenciesListPage')
);

/*
 * IMPORTANT:
 * This route is required for:
 * /emergencies/:id
 *
 * The "View Details" button from the emergency list
 * navigates to this route.
 */
const EmergencyDetailsPage = React.lazy(
  () => import('@/features/emergency/EmergencyDetailsPage')
);

const HospitalsPage = React.lazy(
  () => import('@/features/hospital/HospitalsPage')
);

const HospitalDetailsPage = React.lazy(
  () => import('@/features/hospital/HospitalDetailsPage')
);

const AIPredictionsPage = React.lazy(
  () => import('@/features/ai/AIPredictionsPage')
);

const AIChatPage = React.lazy(
  () => import('@/features/ai/AIChatPage')
);

const MedicalReportsPage = React.lazy(
  () => import('@/features/ai/MedicalReportsPage')
);

const NotificationsPage = React.lazy(
  () => import('@/features/notifications/NotificationsPage')
);

const AmbulanceDashboardPage = React.lazy(
  () => import('@/features/ambulance/AmbulanceDashboardPage')
);

const AnalyticsPage = React.lazy(
  () => import('@/features/analytics/AnalyticsPage')
);

const SettingsPage = React.lazy(
  () => import('@/features/settings/SettingsPage')
);

const LiveMapPage = React.lazy(
  () => import('@/features/maps/LiveMapPage')
);

const PatientsPage = React.lazy(
  () => import('@/features/patients/PatientsPage')
);

const UserManagementPage = React.lazy(
  () => import('@/features/admin/UserManagementPage')
);

/* ============================================================
   LOADING FALLBACK
   ============================================================ */

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[var(--primary-500)] border-t-transparent rounded-full animate-spin" />

        <p
          className="text-sm"
          style={{
            color: 'var(--text-muted)',
          }}
        >
          Loading Aegis AI...
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   APP
   ============================================================ */

export default function App() {
  const dispatch = useAppDispatch();

  /*
   * Restore authenticated session on application startup.
   *
   * We intentionally check localStorage first so that
   * fetchCurrentUser() is only called when an access token
   * exists.
   */
  useEffect(() => {
    const storedAuth = localStorage.getItem('aegis_auth');

    if (!storedAuth) {
      return;
    }

    try {
      const parsed = JSON.parse(storedAuth);

      if (parsed?.accessToken) {
        dispatch(fetchCurrentUser());
      }
    } catch (error) {
      console.warn(
        'Unable to restore authentication session.',
        error
      );

      localStorage.removeItem('aegis_auth');
    }
  }, [dispatch]);

  return (
    <BrowserRouter>
      {/* ======================================================
          GLOBAL TOASTS
      ======================================================= */}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'glass-card text-sm',
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          },
        }}
      />

      {/* ======================================================
          GLOBAL ERROR BOUNDARY
      ======================================================= */}

      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ==================================================
                PUBLIC ROUTES
            =================================================== */}

            <Route
              path="/"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />

            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* ==================================================
                PROTECTED APPLICATION
            =================================================== */}

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* ==================================================
                  DASHBOARD
              =================================================== */}

              <Route
                path="/dashboard"
                element={<DashboardPage />}
              />

              {/* ==================================================
                  EMERGENCY
              =================================================== */}

              <Route
                path="/emergency"
                element={
                  <ProtectedRoute
                    allowedRoles={['patient']}
                  >
                    <EmergencySOSPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/emergencies"
                element={<EmergenciesListPage />}
              />

              <Route
                path="/emergencies/:id"
                element={<EmergencyDetailsPage />}
              />

              {/* ==================================================
                  HOSPITALS
              =================================================== */}

              <Route
                path="/hospitals"
                element={<HospitalsPage />}
              />

              <Route
                path="/hospitals/:id"
                element={<HospitalDetailsPage />}
              />

              {/* ==================================================
                  AI
              =================================================== */}

              <Route
                path="/ai/predictions"
                element={<AIPredictionsPage />}
              />

              <Route
                path="/ai/chat"
                element={<AIChatPage />}
              />

              {/* ==================================================
                  MEDICAL REPORTS
              =================================================== */}

              <Route
                path="/reports"
                element={<MedicalReportsPage />}
              />

              {/* ==================================================
                  MAP
              =================================================== */}

              <Route
                path="/map"
                element={<LiveMapPage />}
              />

              {/* ==================================================
                  PATIENTS
              =================================================== */}

              <Route
                path="/patients"
                element={
                  <ProtectedRoute
                    allowedRoles={['doctor', 'hospital_admin']}
                  >
                    <PatientsPage />
                  </ProtectedRoute>
                }
              />

              {/* ==================================================
                  AMBULANCES
              =================================================== */}

              <Route
                path="/ambulances"
                element={<AmbulanceDashboardPage />}
              />

              {/* ==================================================
                  NOTIFICATIONS
              =================================================== */}

              <Route
                path="/notifications"
                element={<NotificationsPage />}
              />

              {/* ==================================================
                  ANALYTICS
              =================================================== */}

              <Route
                path="/analytics"
                element={
                  <ProtectedRoute
                    allowedRoles={['hospital_admin', 'government_admin']}
                  >
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />

              {/* ==================================================
                  ADMIN
              =================================================== */}

              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute
                    allowedRoles={['government_admin']}
                  >
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* ==================================================
                  SETTINGS
              =================================================== */}

              <Route
                path="/settings"
                element={<SettingsPage />}
              />
            </Route>

            {/* ==================================================
                FALLBACK
            =================================================== */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}