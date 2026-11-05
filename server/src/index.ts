import { createApp } from './app.js'
import { loadConfig } from './config.js'
import { createDb } from './db/client.js'
import { expireSessions } from './services/session.service.js'

const config = loadConfig()
const db = createDb(config.DATABASE_URL)

const server = createApp({
	db,
	internalToken: config.INTERNAL_API_TOKEN,
}).listen(config.PORT, config.HOST, (error) => {
	if (error) throw error
	console.info(
		`Express API listening on http://${config.HOST}:${config.PORT}` +
			(config.INTERNAL_API_TOKEN ? ' (internal token required)' : ''),
	)
})

const sweep = async () => {
	try {
		const result = await expireSessions(db, config.SESSION_TTL_HOURS)
		if (result.carts || result.sessions)
			console.info(
				`Expired ${result.carts} carts and ${result.sessions} guest sessions`,
			)
	} catch (error) {
		console.error('Session expiry failed', error)
	}
}
const sweepTimer = setInterval(sweep, 15 * 60_000)
sweepTimer.unref()

const shutdown = () => {
	clearInterval(sweepTimer)
	server.close(async () => {
		await db.$disconnect()
		process.exit(0)
	})
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
