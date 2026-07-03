import { Link, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { isAdminUser } from '../lib/adminAccess';

export default function Login() {
  const { user, isLoading, loginWithGoogle, logout } = useAuth();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState('');
  const accessDeniedFromRoute = Boolean((location.state as { adminAccessDenied?: boolean } | null)?.adminAccessDenied);

  if (isLoading) {
    return (
      <section className="flex min-h-screen items-center justify-center px-4 text-porcelain">
        <div className="state-panel text-sm">Memeriksa sesi login...</div>
      </section>
    );
  }

  if (user && isAdminUser(user)) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogout = async () => {
    setErrorMessage('');

    try {
      await logout();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal logout.');
    }
  };

  const handleLogin = async () => {
    setErrorMessage('');

    try {
      await loginWithGoogle();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal login dengan Google.');
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-16 text-porcelain">
      <div className="surface-card w-full max-w-md p-7">
        <p className="eyebrow">Admin access</p>
        <h1 className="mt-3 text-3xl font-semibold text-porcelain">Masuk ke Panel Admin</h1>
        <p className="mt-3 text-sm leading-6 text-mist">Login dengan Google untuk mengelola produk Adzani Store.</p>

        {user && !isAdminUser(user) && (
          <div className="error-panel mt-5 text-sm" role="alert">
            <p className="font-semibold">Akun ini tidak memiliki akses admin.</p>
            {user.email && <p className="mt-2 break-all text-mist">{user.email}</p>}
          </div>
        )}

        {!user && accessDeniedFromRoute && (
          <div className="error-panel mt-5 text-sm" role="alert">
            Akun ini tidak memiliki akses admin.
          </div>
        )}

        {!user && (
          <button
            type="button"
            onClick={handleLogin}
            aria-label="Login ke panel admin dengan Google"
            className="btn-primary mt-6 w-full"
          >
            Login dengan Google
          </button>
        )}

        {user && !isAdminUser(user) && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link to="/" className="btn-secondary text-center">
              Kembali ke Home
            </Link>
            <button type="button" onClick={handleLogout} className="btn-danger" aria-label="Logout dari akun tanpa akses admin">
              Logout
            </button>
          </div>
        )}

        {errorMessage && <p className="error-panel mt-4 text-sm" role="alert">{errorMessage}</p>}
      </div>
    </section>
  );
}
