import { existsSync } from 'node:fs'
import { defineConfig } from 'prisma/config'

// The Prisma CLI does not load .env files itself. Variables already present in
// the environment (CI, test runner) take precedence over the file.
if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
		seed: 'tsx prisma/seed.ts',
	},
	datasource: {
		url: process.env.DATABASE_URL,
	},
})
