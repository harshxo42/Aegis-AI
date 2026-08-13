/**
 * Aegis AI – Main React App
 *
 * Configures routing, Toaster, and global providers.
 */

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAppDispatch } from '@/store';
import { fetchCurrentUser } from '@/store/authSlice';

// Layout & Guards
import AppLayout from '@/components/layout/AppLayout';
import { ProtectedRoute, PublicRoute } from '@/routes/guards';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

// Pages
const LoginPage = React.lazy(() => import('@/features/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('@/features/auth/RegisterPage'));
const DashboardPage = React.lazy(() => import('@/features/dashboard/DashboardPage'));
const EmergencySOSPage = React.lazy(() => import('@/features/emergency/EmergencySOSPage'));
const EmergenciesListPage = React.lazy(() => import('@/features/emergency/EmergenciesListPage'));
const HospitalsPage = React.lazy(() => import('@/features/hospital/HospitalsPage'));
const HospitalDetailsPage = React.lazy(() => import('@/features/hospital/HospitalDetailsPage'));
const AIPredictionsPage = React.lazy(() => import('@/features/ai/AIPredictionsPage'));
const MedicalReportsPage = React.lazy(() => import('@/features/ai/MedicalReportsPage'));
const NotificationsPage = React.lazy(() => import('@/features/notifications/NotificationsPage'));
const AIChatPage = React.lazy(() => import('@/features/ai/AIChatPage'));
const AmbulanceDashboardPage = React.lazy(() => import('@/features/ambulance/AmbulanceDashboardPage'));
const AnalyticsPage = React.lazy(() => import('@/features/analytics/AnalyticsPage'));

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
    <div className="w-10 h-10 border-4 border-[var(--primary-500)] border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check if token exists in localStorage to fetch user
    const stored = localStorage.getItem('aegis_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.accessToken) {
          dispatch(fetchCurrentUser());
        }
      } catch {
        // Ignore
      }
    }
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'glass-card text-sm',
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
          },
        }}
      />
      
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
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

            {/* Protected Routes inside AppLayout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              
              {/* Patient Only */}
              <Route
                path="/emergency"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <EmergencySOSPage />
                  </ProtectedRoute>
                }
              />

              {/* Shared Routes */}
              <Route path="/emergencies" element={<EmergenciesListPage />} />
              <Route path="/hospitals" element={<HospitalsPage />} />
              <Route path="/hospitals/:id" element={<HospitalDetailsPage />} />

              {/* Placeholder for missing routes to prevent 404s during development */}
              <Route path="/map" element={<div className="p-8">Live Map (Coming Soon)</div>} />
              <Route path="/ai/predictions" element={<AIPredictionsPage />} />
              <Route path="/ai/chat" element={<AIChatPage />} />
              <Route path="/reports" element={<MedicalReportsPage />} />
              <Route path="/patients" element={<div className="p-8">My Patients (Coming Soon)</div>} />
              <Route path="/ambulances" element={<AmbulanceDashboardPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/admin/users" element={<div className="p-8">User Management (Coming Soon)</div>} />
              <Route path="/settings" element={<div className="p-8">Settings (Coming Soon)</div>} />
            </Route>

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
