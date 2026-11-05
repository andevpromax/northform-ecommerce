import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		environment: 'node',
		include: ['test/**/*.test.ts'],
		globalSetup: ['test/global-setup.ts'],
		setupFiles: ['test/setup-env.ts'],
		// All files share one test database.
		fileParallelism: false,
		testTimeout: 20_000,
		hookTimeout: 60_000,
	},
})
