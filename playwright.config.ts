import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

// Build próprio para E2E: aponta o Supabase para um host fictício, interceptado com page.route.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 740 } },
    },
  ],
  webServer: {
    command: `npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: 'http://supabase.e2e.test',
      VITE_SUPABASE_ANON_KEY: 'e2e-anon-key',
      VITE_ALLOWED_EMAIL_DOMAINS: 'empresa.com,empresa.com.br',
      VITE_APP_VERSION: 'e2e',
    },
  },
})
