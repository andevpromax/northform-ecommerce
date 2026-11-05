import { execFileSync } from 'node:child_process'
import { resolveTestDatabaseUrl, serverRoot } from './helpers/test-database.js'

// Applies all migrations to the test database once per run.
export default function setup() {
	const url = resolveTestDatabaseUrl()
	execFileSync(`${serverRoot}node_modules/.bin/prisma`, ['migrate', 'deploy'], {
		cwd: serverRoot,
		env: { ...process.env, DATABASE_URL: url },
		stdio: 'pipe',
	})
}
