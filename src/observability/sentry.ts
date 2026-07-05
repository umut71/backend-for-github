/**
 * ADIM 8 — Sentry başlatma parçacığı (opsiyonel bağımlılık).
 * SENTRY_DSN tanımlıysa ve @sentry/node kuruluysa etkinleşir;
 * aksi halde sessizce atlanır (backend bağımlılık eklemeden çalışır).
 *
 * Etkinleştirmek için:
 *   npm i @sentry/node
 *   Render env: SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/node') as {
      init: (opts: Record<string, unknown>) => void;
    };
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_RATE || '0.1'),
      release: process.env.RENDER_GIT_COMMIT || undefined,
    });
    console.log('🛰️  Sentry etkin (DSN tanımlı)');
  } catch {
    console.warn(
      '⚠️  SENTRY_DSN tanımlı ama @sentry/node kurulu değil — "npm i @sentry/node" çalıştırın',
    );
  }
}
