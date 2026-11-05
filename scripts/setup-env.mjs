import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const serverEnvPath = join(root, 'server', '.env')
const nextEnvPath = join(root, '.env.local')

const read = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : null)

const secret = (bytes) => randomBytes(bytes).toString('hex')

function getValue(text, key) {
	const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'))
	const value = match?.[1].trim() ?? ''

	if (
		(value.startsWith('"') && value.endsWith('"')) ||
		(value.startsWith("'") && value.endsWith("'"))
	) {
		return value.slice(1, -1)
	}

	return value
}

function setValue(text, key, value) {
	const line = `${key}=${value}`
	const pattern = new RegExp(`^${key}=.*$`, 'm')

	return pattern.test(text)
		? text.replace(pattern, line)
		: `${text.replace(/\n?$/, '\n')}${line}\n`
}

function fillEmpty(text, key, value) {
	return getValue(text, key) ? text : setValue(text, key, value)
}

function requireValidToken(value) {
	if (value && (value.length < 32 || /\s/.test(value))) {
		throw new Error(
			'INTERNAL_API_TOKEN must contain at least 32 characters and no whitespace.',
		)
	}
}

function validateDatabaseUrl(value, key, config) {
	let url

	try {
		url = new URL(value)
	} catch {
		throw new Error(`${key} is not a valid PostgreSQL URL.`)
	}

	if (!['postgresql:', 'postgres:'].includes(url.protocol)) {
		throw new Error(`${key} must use the postgresql:// protocol.`)
	}

	if (
		decodeURIComponent(url.username) !== config.user ||
		decodeURIComponent(url.password) !== config.password ||
		decodeURIComponent(url.pathname.slice(1)) !== config.database ||
		(url.port || '5432') !== config.port
	) {
		throw new Error(
			`${key} must match POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_PORT and the expected database name.`,
		)
	}

	return url
}

function setup() {
	const oldServerEnv = read(serverEnvPath)
	const oldNextEnv = read(nextEnvPath)

	let serverEnv =
		oldServerEnv ?? readFileSync(join(root, 'server', '.env.example'), 'utf8')

	let nextEnv = oldNextEnv ?? readFileSync(join(root, '.env.example'), 'utf8')

	// 1. Default configuration
	serverEnv = fillEmpty(serverEnv, 'HOST', '127.0.0.1')
	serverEnv = fillEmpty(serverEnv, 'PORT', '4000')
	serverEnv = fillEmpty(serverEnv, 'POSTGRES_USER', 'northform')
	serverEnv = fillEmpty(serverEnv, 'POSTGRES_DB', 'northform')
	serverEnv = fillEmpty(serverEnv, 'POSTGRES_PORT', '5432')

	const user = getValue(serverEnv, 'POSTGRES_USER')
	const database = getValue(serverEnv, 'POSTGRES_DB')
	const port = getValue(serverEnv, 'POSTGRES_PORT')
	const apiPort = getValue(serverEnv, 'PORT')

	// 2. Validate ports and database names
	for (const [key, value] of [
		['PORT', apiPort],
		['POSTGRES_PORT', port],
	]) {
		if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) {
			throw new Error(`${key} must be a port between 1 and 65535.`)
		}
	}

	if (!/^[A-Za-z0-9_]+$/.test(user) || !/^[A-Za-z0-9_]+$/.test(database)) {
		throw new Error(
			'POSTGRES_USER and POSTGRES_DB may contain only letters, numbers and underscores.',
		)
	}

	// 3. PostgreSQL password
	let password = getValue(serverEnv, 'POSTGRES_PASSWORD')

	if (password === 'change-me') {
		if (oldServerEnv !== null) {
			throw new Error(
				'POSTGRES_PASSWORD is still "change-me". Set a real password, or remove server/.env before first setup. Do not remove an existing database volume.',
			)
		}

		password = secret(24)
		serverEnv = setValue(serverEnv, 'POSTGRES_PASSWORD', password)
	} else if (!password) {
		password = secret(24)
		serverEnv = setValue(serverEnv, 'POSTGRES_PASSWORD', password)
	}

	if (/\s/.test(password)) {
		throw new Error('POSTGRES_PASSWORD must not contain whitespace.')
	}

	// 4. Database connection strings
	const buildUrl = (name) =>
		`postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@127.0.0.1:${port}/${encodeURIComponent(name)}`

	if (oldServerEnv === null) {
		serverEnv = setValue(serverEnv, 'DATABASE_URL', buildUrl(database))
		serverEnv = setValue(
			serverEnv,
			'TEST_DATABASE_URL',
			buildUrl(`${database}_test`),
		)
	} else {
		serverEnv = fillEmpty(serverEnv, 'DATABASE_URL', buildUrl(database))
		serverEnv = fillEmpty(
			serverEnv,
			'TEST_DATABASE_URL',
			buildUrl(`${database}_test`),
		)
	}

	const mainUrl = validateDatabaseUrl(
		getValue(serverEnv, 'DATABASE_URL'),
		'DATABASE_URL',
		{ user, password, port, database },
	)

	const testUrl = validateDatabaseUrl(
		getValue(serverEnv, 'TEST_DATABASE_URL'),
		'TEST_DATABASE_URL',
		{ user, password, port, database: `${database}_test` },
	)

	if (mainUrl.hostname !== testUrl.hostname) {
		throw new Error(
			'DATABASE_URL and TEST_DATABASE_URL must point to the same database host.',
		)
	}

	// 5. Next.js API URL
	const host = getValue(serverEnv, 'HOST')
	const reachableHost = host === '0.0.0.0' || host === '::' ? '127.0.0.1' : host

	const urlHost =
		reachableHost.includes(':') && !reachableHost.startsWith('[')
			? `[${reachableHost}]`
			: reachableHost

	nextEnv = fillEmpty(
		nextEnv,
		'COMMERCE_SERVER_URL',
		`http://${urlHost}:${apiPort}`,
	)

	try {
		const url = new URL(getValue(nextEnv, 'COMMERCE_SERVER_URL'))

		if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
			throw new Error()
		}
	} catch {
		throw new Error('COMMERCE_SERVER_URL must be a valid HTTP(S) URL.')
	}

	// 6. Shared internal API token
	const serverToken = getValue(serverEnv, 'INTERNAL_API_TOKEN')
	const nextToken = getValue(nextEnv, 'INTERNAL_API_TOKEN')

	requireValidToken(serverToken)
	requireValidToken(nextToken)

	if (serverToken && nextToken && serverToken !== nextToken) {
		throw new Error(
			'INTERNAL_API_TOKEN differs between server/.env and .env.local. Make both values identical.',
		)
	}

	const token = serverToken || nextToken || secret(32)

	serverEnv = fillEmpty(serverEnv, 'INTERNAL_API_TOKEN', token)
	nextEnv = fillEmpty(nextEnv, 'INTERNAL_API_TOKEN', token)

	// 7. Write files only after successful validation
	const changes = []

	if (oldServerEnv !== serverEnv) {
		writeFileSync(serverEnvPath, serverEnv, { mode: 0o600 })

		changes.push(
			oldServerEnv === null ? 'Created server/.env' : 'Updated server/.env',
		)
	}

	if (oldNextEnv !== nextEnv) {
		writeFileSync(nextEnvPath, nextEnv, { mode: 0o600 })

		changes.push(
			oldNextEnv === null ? 'Created .env.local' : 'Updated .env.local',
		)
	}

	// 8. Report without exposing secrets
	process.stdout.write(
		changes.length
			? `${changes.join('\n')}\nSetup complete. Restart Next.js and Express if already running.\n`
			: 'Environment files are already configured. No changes made.\n',
	)

	if (oldServerEnv === null) {
		process.stdout.write(
			'Note: An existing PostgreSQL Docker volume retains its original password. This script does not reset the database.\n',
		)
	}
}

try {
	setup()
} catch (error) {
	process.stderr.write(
		`Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`,
	)
	process.exitCode = 1
}
