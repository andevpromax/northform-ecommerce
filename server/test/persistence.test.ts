import { beforeEach, describe, expect, it } from 'vitest'
import { createDb } from '../src/db/client.js'
import { seed } from '../src/db/seed.js'
import { expireSessions } from '../src/services/session.service.js'
import { guest, testApp } from './helpers/api.js'
import { resetDatabase, useTestDb } from './helpers/db.js'

const db = useTestDb()

beforeEach(() => resetDatabase(db))

describe('PostgreSQL persistence', () => {
	it('keeps carts, orders and payments across a server restart', async () => {
		// First "process": its own connection pool and Express app.
		const before = createDb(process.env.DATABASE_URL as string)
		const first = guest(testApp(before))
		await first.addItem('arc-lamp', 2)
		const { body: order } = await first.createOrder()
		await first.pay(order.id, 'failure')
		await first.addItem('oak-tray', 1)
		await first.put('/api/cart/voucher', { code: 'DEMO10' })
		await before.$disconnect()

		// Second "process" with the same guest session.
		const after = createDb(process.env.DATABASE_URL as string)
		const second = guest(testApp(after), first.sessionId)
		const cart = await second.get('/api/cart')
		expect(cart.body).toMatchObject({
			totalNumberOfItems: 1,
			subtotal: 38,
			orderDiscounts: 3.8,
		})
		const stored = await second.get(`/api/orders/${order.id}`)
		expect(stored.body).toMatchObject({
			status: 'payment_failed',
			paymentStatus: 'Refused',
			attempts: 1,
			cart: { totalPrice: 183 },
		})
		expect((await second.pay(order.id, 'success')).body.status).toBe(
			'confirmed',
		)
		await after.$disconnect()
	})

	it('seeds idempotently without touching carts or orders', async () => {
		const shopper = guest(testApp(db))
		await shopper.addItem('arc-lamp')
		await db.product.update({ where: { sku: 'arc-lamp' }, data: { stock: 1 } })
		await seed(db)
		await seed(db)
		expect(await db.product.count()).toBe(10)
		expect(await db.voucher.count()).toBe(1)
		expect(
			(await db.product.findUniqueOrThrow({ where: { sku: 'arc-lamp' } }))
				.stock,
		).toBe(12)
		expect(await db.cartItem.count()).toBe(1)
	})

	it('enforces database constraints independently of the API', async () => {
		const shopper = guest(testApp(db))
		await shopper.addItem('arc-lamp')
		await expect(
			db.cartItem.updateMany({ data: { quantity: 0 } }),
		).rejects.toThrow()
		await expect(
			db.product.update({ where: { sku: 'arc-lamp' }, data: { stock: -1 } }),
		).rejects.toThrow()
	})
})

describe('guest session expiry', () => {
	it('clears idle carts but keeps sessions that own orders', async () => {
		const app = testApp(db)
		const buyer = guest(app)
		await buyer.addItem('arc-lamp')
		const { body: order } = await buyer.createOrder()
		await buyer.addItem('oak-tray')
		const browser = guest(app)
		await browser.addItem('linen-throw')
		const active = guest(app)
		await active.addItem('stone-bowl')

		const stale = new Date(Date.now() - 25 * 3_600_000)
		await db.guestSession.updateMany({
			where: { id: { in: [buyer.sessionId, browser.sessionId] } },
			data: { lastSeenAt: stale },
		})

		expect(await expireSessions(db, 24)).toEqual({ carts: 2, sessions: 1 })
		expect((await buyer.get('/api/cart')).body.entries).toEqual([])
		expect((await buyer.get(`/api/orders/${order.id}`)).status).toBe(200)
		expect(
			await db.guestSession.findUnique({ where: { id: browser.sessionId } }),
		).toBeNull()
		expect((await active.get('/api/cart')).body.totalNumberOfItems).toBe(1)
	})
})
