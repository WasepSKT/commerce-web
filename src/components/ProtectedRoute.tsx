import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    // App-level global loader already shows during auth hydration.
    // Return null here to avoid rendering a second fullscreen overlay.
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}