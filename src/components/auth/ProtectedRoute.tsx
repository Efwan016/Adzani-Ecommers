import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isAdminUser } from '../../lib/adminAccess';

type ProtectedRouteProps = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <section className="flex min-h-screen items-center justify-center px-4 text-porcelain">
        <div className="state-panel text-sm">Memeriksa sesi admin...</div>
      </section>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminUser(user)) {
    return <Navigate to="/login" replace state={{ adminAccessDenied: true }} />;
  }

  return children;
}
