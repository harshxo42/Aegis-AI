/**
 * Aegis AI – Route Guards
 *
 * Protects routes based on authentication and user roles.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !user && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-10 h-10 border-4 border-[var(--primary-500)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}


export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

/**
 * HOC: Wraps a component and restricts access to specific roles.
 */
export function withRoleAccess<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: UserRole[]
) {
  return function RoleGuardedComponent(props: P) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}

// Role-specific HOCs for enterprise architecture
export const withAdmin = <P extends object>(Component: React.ComponentType<P>) => 
  withRoleAccess(Component, ['hospital_admin', 'government_admin']);

export const withDoctor = <P extends object>(Component: React.ComponentType<P>) => 
  withRoleAccess(Component, ['doctor', 'hospital_admin']);

export const withPatient = <P extends object>(Component: React.ComponentType<P>) => 
  withRoleAccess(Component, ['patient']);

export const withAmbulance = <P extends object>(Component: React.ComponentType<P>) => 
  withRoleAccess(Component, ['ambulance_driver']);
