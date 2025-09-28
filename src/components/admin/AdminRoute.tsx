import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/ui/Loading';

interface AdminRouteProps {
  children: ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) {
    // App-level global loader already shows during auth hydration.
    // Return null here to avoid rendering a second fullscreen overlay.
    return null;
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
