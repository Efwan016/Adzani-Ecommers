import { Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { user, isLoading, loginWithGoogle } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  if (isLoading) {
    return (
      <section className="flex min-h-screen items-center justify-center px-4 text-porcelain">
        <div className="state-panel text-sm">Memeriksa sesi login...</div>
      </section>
    );
  }

  if (user) {
    return <Navigate to="/admin" replace />;
  }

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

        <button
          type="button"
          onClick={handleLogin}
          className="btn-primary mt-6 w-full"
        >
          Login dengan Google
        </button>

        {errorMessage && <p className="error-panel mt-4 text-sm">{errorMessage}</p>}
      </div>
    </section>
  );
}
