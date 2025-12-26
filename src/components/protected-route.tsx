import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth-provider';

export function ProtectedRoute() {
  const { isValid, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
export function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, isValid, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isValid || !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function UserOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, isValid, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!isValid || isSuperAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}


