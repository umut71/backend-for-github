import { defineConfig } from '@playwright/test';

/**
 * ADIM 5 — Playwright E2E yapılandırması.
 * Lokal: backend zaten 3000'de çalışıyorsa yeniden başlatmaz (reuseExistingServer).
 * CI: `npm run build` sonrası dist/src/main.js otomatik başlatılır.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.API_BASE || 'http://localhost:3000',
  },
  webServer: {
    command: 'node dist/src/main.js',
    url: 'http://localhost:3000/health',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
