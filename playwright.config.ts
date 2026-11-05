import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI
const commerceServerUrl = 'http://127.0.0.1:4000'

export default defineConfig({
	testDir: './e2e',

	fullyParallel: false,
	workers: 1,

	forbidOnly: isCI,
	retries: isCI ? 1 : 0,
	globalTimeout: isCI ? 10 * 60 * 1000 : undefined,

	reporter: isCI ? [['list'], ['html', { open: 'never' }]] : 'list',

	use: {
		baseURL: 'http://127.0.0.1:3100',
		trace: 'retain-on-failure',
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'mobile',
			use: { ...devices['Pixel 7'] },
		},
	],

	// The storefront needs the Express API, which needs a migrated and seeded
	// PostgreSQL database (pnpm server:db:up && server:db:deploy && server:db:seed).
	webServer: [
		{
			command: isCI ? 'pnpm server:start' : 'pnpm server:dev',
			url: `${commerceServerUrl}/health`,
			reuseExistingServer: !isCI,
			timeout: 60_000,
		},
		{
			command: isCI
				? 'pnpm start --port 3100 --hostname 127.0.0.1'
				: 'pnpm dev --port 3100 --hostname 127.0.0.1',
			url: 'http://127.0.0.1:3100',
			env: { COMMERCE_SERVER_URL: commerceServerUrl },
			reuseExistingServer: !isCI,
			timeout: 120_000,
		},
	],
})
