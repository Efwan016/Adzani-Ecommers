import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('UI runtime error caught by ErrorBoundary:', error, errorInfo);
    }
    import('../../lib/monitor')
      .then(({ captureError }) => captureError(error, 'ErrorBoundary'))
      .catch(() => {});
  }

  private reloadPage = () => {
    window.location.reload();
  };

  private goHome = () => {
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center px-4 py-10 text-porcelain" aria-labelledby="error-boundary-title">
          <section className="surface-card w-full max-w-2xl p-6 text-center sm:p-8">
            <p className="eyebrow">Terjadi kendala</p>
            <h1 id="error-boundary-title" className="mt-3 text-3xl font-semibold tracking-tight text-porcelain sm:text-4xl">
              Tampilan belum bisa dimuat.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-mist sm:text-base">
              Maaf, ada bagian halaman yang mengalami error. Kamu bisa memuat ulang halaman atau kembali ke Home untuk lanjut belanja.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={this.reloadPage} className="btn-primary w-full sm:w-auto" aria-label="Reload halaman saat ini">
                Reload halaman
              </button>
              <button type="button" onClick={this.goHome} className="btn-secondary w-full sm:w-auto" aria-label="Kembali ke halaman Home">
                Kembali ke Home
              </button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
