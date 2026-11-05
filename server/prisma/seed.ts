import { createDb } from '../src/db/client.js'
import { seed } from '../src/db/seed.js'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')

const db = createDb(url)
try {
	const result = await seed(db)
	console.info(
		`Seeded ${result.products} products and ${result.vouchers} voucher.`,
	)
} finally {
	await db.$disconnect()
}
