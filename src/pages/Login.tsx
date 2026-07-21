import { Link, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { isAdminUser } from '../lib/adminAccess';
import { RouteSeo } from '../lib/seo';

const LOGIN_SEO = {
  title: 'Login Admin | Adzani Store',
  description: 'Masuk ke panel admin Adzani Store untuk mengelola katalog produk, stok, dan pesanan WhatsApp.',
  noIndex: true,
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M21.6 12.23c0-.79-.07-1.54-.2-2.27H12v4.3h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.55Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.58A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.41 13.91A5.98 5.98 0 0 1 6.41 10.1V7.52H3.07a10 10 0 0 0 0 12.78l3.34-2.58Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.05c1.47 0 2.8.5 3.84 1.49l2.87-2.87A9.95 9.95 0 0 0 12 2a10 10 0 0 0-8.93 5.52l3.34 2.58C7.2 7.81 9.4 6.05 12 6.05Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function Login() {
  const { user, isLoading, loginWithGoogle, logout } = useAuth();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState('');
  const accessDeniedFromRoute = Boolean((location.state as { adminAccessDenied?: boolean } | null)?.adminAccessDenied);

  if (isLoading) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 text-porcelain">
      <RouteSeo meta={LOGIN_SEO} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(166,216,194,0.16),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(216,168,140,0.12),_transparent_30%)]" />
      <div className="surface-card relative w-full max-w-md rounded-[1.35rem] border border-white/10 p-8 text-center shadow-[0_35px_90px_rgba(0,0,0,0.28)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-sage/30 bg-sage/10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-sage border-t-transparent" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-porcelain">Memeriksa sesi login…</h1>
        <p className="mt-3 text-sm leading-7 text-mist">Harap tunggu sebentar sebelum masuk ke panel admin.</p>
      </div>
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
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16 text-porcelain">
      <RouteSeo meta={LOGIN_SEO} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(166,216,194,0.16),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(216,168,140,0.12),_transparent_30%)]" />
      <div className="surface-card relative w-full max-w-5xl overflow-hidden rounded-[1.4rem] border border-white/10 shadow-[0_35px_100px_rgba(0,0,0,0.28)] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1a2a22] via-[#14201b] to-[#0f1513] p-8 sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_58%)]" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-sage">
              <span className="h-2 w-2 rounded-full bg-sage" />
              Admin access
            </p>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-porcelain sm:text-4xl">
              Masuk ke panel admin
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-mist">
              Kelola produk, stok, dan pesanan Adzani Store dari satu tempat yang lebih tenang, lebih rapi, dan lebih cepat.
            </p>

            <div className="mt-8 space-y-3 text-sm text-mist">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <span className="h-2.5 w-2.5 rounded-full bg-sage" />
                <span>Login aman dengan akun Google resmi.</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <span className="h-2.5 w-2.5 rounded-full bg-sage" />
                <span>Kontrol penuh atas katalog dan status pesanan.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center bg-[rgba(8,12,11,0.48)] p-8 sm:p-10 lg:p-12">
          <div className="w-full">
            {user && !isAdminUser(user) && (
              <div className="rounded-[1.1rem] border border-[#eba6a0]/25 bg-[#eba6a0]/10 p-4 text-sm text-[#ffd7d4]" role="alert">
                <p className="font-semibold">Akun ini tidak memiliki akses admin.</p>
                {user.email && <p className="mt-2 break-all text-mist">{user.email}</p>}
              </div>
            )}

            {!user && accessDeniedFromRoute && (
              <div className="rounded-[1.1rem] border border-[#eba6a0]/25 bg-[#eba6a0]/10 p-4 text-sm text-[#ffd7d4]" role="alert">
                Akun ini tidak memiliki akses admin.
              </div>
            )}

            {!user && (
              <div className="mt-6 rounded-[1.1rem] border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-porcelain">Lanjutkan dengan akun Google</p>
                <p className="mt-2 text-sm leading-7 text-mist">
                  Gunakan akun yang sudah diizinkan untuk mengakses dashboard admin.
                </p>
                <button
                  type="button"
                  onClick={handleLogin}
                  aria-label="Login ke panel admin dengan Google"
                  className="btn-primary mt-6 flex w-full items-center justify-center gap-3"
                >
                  <GoogleIcon />
                  <span>Login dengan Google</span>
                </button>
              </div>
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

            {errorMessage && (
              <p className="mt-4 rounded-[1.1rem] border border-[#eba6a0]/25 bg-[#eba6a0]/10 p-4 text-sm text-[#ffd7d4]" role="alert">
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
