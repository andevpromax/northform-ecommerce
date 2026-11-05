import { afterAll } from 'vitest'
import { type Db, createDb } from '../../src/db/client.js'
import { seed } from '../../src/db/seed.js'

const tables = [
	'payment_transactions',
	'order_items',
	'orders',
	'cart_items',
	'carts',
	'guest_sessions',
	'vouchers',
	'products',
]

// One client per test file, disconnected when the file finishes.
export function useTestDb(): Db {
	const db = createDb(process.env.DATABASE_URL as string)
	afterAll(() => db.$disconnect())
	return db
}

// Test database only (see setup-env.ts): wipe all rows and restore seed data.
export async function resetDatabase(db: Db) {
	await db.$executeRawUnsafe(
		`TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`,
	)
	await seed(db)
}
