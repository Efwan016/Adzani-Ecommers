/**
 * Privacy-friendly, CSP-safe monitoring.
 *
 * No external SDKs are loaded — if VITE_MONITOR_URL is not set, every call is a
 * no-op (no network requests, does not violate the project's CSP-clean stance).
 * When set, errors and events are POSTed as small JSON payloads to an internal
 * endpoint. No PII (names, phones, order contents) is ever attached by default.
 */

type MonitorEvent = {
  name: string;
  props?: Record<string, unknown>;
};

type ErrorPayload = {
  type: 'error' | 'unhandledrejection';
  message: string;
  stack?: string;
  context?: string;
  url: string;
  userAgent: string;
  timestamp: string;
};

function getMonitorUrl(): string | undefined {
  const url = import.meta.env?.VITE_MONITOR_URL as string | undefined;
  return url && url.trim() ? url.trim() : undefined;
}

function postJson(payload: unknown) {
  const url = getMonitorUrl();
  if (!url) return;

  try {
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Swallow: monitoring must never break the app.
  }
}

export function captureError(error: unknown, context?: string) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const payload: ErrorPayload = {
    type: 'error',
    message,
    stack,
    context,
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    timestamp: new Date().toISOString(),
  };
  postJson(payload);
}

export function trackEvent(event: MonitorEvent) {
  postJson({
    type: 'event',
    name: event.name,
    props: event.props ?? {},
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    timestamp: new Date().toISOString(),
  });
}

/** Wire global error handlers. Call once at app boot (main.tsx). */
export function installGlobalErrorHandlers() {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    captureError(event.error ?? event.message, 'window.onerror');
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    captureError(reason, 'unhandledrejection');
  });
}
