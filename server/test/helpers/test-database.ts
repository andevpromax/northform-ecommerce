import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const serverRoot = fileURLToPath(new URL('../..', import.meta.url))

// Tests only ever touch TEST_DATABASE_URL. Refuse anything that could be the
// development database, so a test run can never reset real data.
export function resolveTestDatabaseUrl(): string {
	const envFile = `${serverRoot}.env`
	if (existsSync(envFile)) process.loadEnvFile(envFile)

	const url = process.env.TEST_DATABASE_URL
	if (!url)
		throw new Error(
			'TEST_DATABASE_URL is not set. Copy server/.env.example to server/.env.',
		)
	const name = new URL(url).pathname.slice(1)
	if (!name.endsWith('_test'))
		throw new Error(
			`Refusing to run tests: database "${name}" does not end with "_test".`,
		)
	if (process.env.DATABASE_URL && sameDatabase(url, process.env.DATABASE_URL))
		throw new Error(
			'Refusing to run tests: TEST_DATABASE_URL points at DATABASE_URL.',
		)
	return url
}

function sameDatabase(a: string, b: string) {
	const [x, y] = [new URL(a), new URL(b)]
	return x.host === y.host && x.pathname === y.pathname
}
