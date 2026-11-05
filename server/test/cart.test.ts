import { beforeEach, describe, expect, it } from 'vitest'
import { guest, testApp } from './helpers/api.js'
import { expectContract } from './helpers/contract.js'
import { resetDatabase, useTestDb } from './helpers/db.js'

const db = useTestDb()
const app = testApp(db)

beforeEach(() => resetDatabase(db))

describe('GET /api/cart', () => {
	it('returns an empty cart without creating a session', async () => {
		const shopper = guest(app)
		const res = await shopper.get('/api/cart')
		expect(res.status).toBe(200)
		expect(res.body).toMatchObject({
			cartId: null,
			subtotal: 0,
			shippingPrice: 0,
			totalPrice: 0,
			entries: [],
			appliedVouchers: [],
		})
		expectContract(res, 'get', '/api/cart')
		expect(await db.guestSession.count()).toBe(0)
		expect(await db.cart.count()).toBe(0)
	})
})

describe('POST /api/cart/items', () => {
	it('adds a product and calculates totals on the server', async () => {
		const shopper = guest(app)
		const res = await shopper.addItem('arc-lamp', 2)
		expect(res.status).toBe(200)
		expectContract(res, 'post', '/api/cart/items')
		expect(res.body).toMatchObject({
			subtotal: 178,
			shippingPrice: 5,
			totalPrice: 183,
			VAT: 29.67,
			currencyISO: 'EUR',
			totalNumberOfItems: 2,
			orderDiscounts: 0,
		})
		expect(res.body.entries).toEqual([
			{
				entryNumber: 0,
				quantity: 2,
				totalPrice: { value: 178, currencyISO: 'EUR' },
				product: {
					sku: 'arc-lamp',
					name: 'Arc Desk Lamp',
					dimensions: 'Lighting',
					price: { value: 89, currencyISO: 'EUR' },
					discount: null,
					imageUrl: '/images/arc-lamp.jpg',
				},
			},
		])
	})

	it('uses a cart ID that is not the session ID', async () => {
		const shopper = guest(app)
		const res = await shopper.addItem('arc-lamp')
		expect(res.body.cartId).toMatch(/^[0-9a-f-]{36}$/)
		expect(res.body.cartId).not.toBe(shopper.sessionId)
		expect(JSON.stringify(res.body)).not.toContain(shopper.sessionId)
	})

	it('merges quantities when the same product is added again', async () => {
		const shopper = guest(app)
		await shopper.addItem('arc-lamp', 2)
		await shopper.addItem('linen-throw', 1)
		const res = await shopper.addItem('arc-lamp', 3)
		expect(
			res.body.entries.map((e: { quantity: number }) => e.quantity),
		).toEqual([5, 1])
		expect(await db.cartItem.count()).toBe(2)
	})

	it('ignores client-supplied prices', async () => {
		const shopper = guest(app)
		const res = await shopper.post('/api/cart/items', {
			sku: 'arc-lamp',
			quantity: 1,
			price: 0,
			totalPrice: 0,
		})
		expect(res.body.subtotal).toBe(89)
	})

	it.each([0, -1, 1.5, 100, '2', null])(
		'rejects invalid quantity %s with 400',
		async (quantity) => {
			const res = await guest(app).post('/api/cart/items', {
				sku: 'arc-lamp',
				quantity,
			})
			expect(res.status).toBe(400)
			expect(res.body.error).toBe('Invalid request')
			expectContract(res, 'post', '/api/cart/items')
		},
	)

	it('returns 404 for unknown products', async () => {
		const res = await guest(app).addItem('nope')
		expect(res.status).toBe(404)
		expect(res.body).toEqual({ error: 'Product not found' })
		expectContract(res, 'post', '/api/cart/items')
	})

	it('enforces stock, including merged quantities', async () => {
		const shopper = guest(app)
		expect((await shopper.addItem('arc-lamp', 13)).status).toBe(409)
		await shopper.addItem('arc-lamp', 10)
		const res = await shopper.addItem('arc-lamp', 3)
		expect(res.status).toBe(409)
		expect(res.body).toEqual({ error: 'Requested quantity is unavailable' })
		expectContract(res, 'post', '/api/cart/items')
		expect((await shopper.get('/api/cart')).body.totalNumberOfItems).toBe(10)
	})

	it('rejects unavailable products', async () => {
		const res = await guest(app).addItem('woven-basket')
		expect(res.status).toBe(409)
	})

	it('rejects a merged line above 99 items', async () => {
		await db.product.update({
			where: { sku: 'stone-bowl' },
			data: { stock: 500 },
		})
		const shopper = guest(app)
		await shopper.addItem('stone-bowl', 60)
		const res = await shopper.addItem('stone-bowl', 40)
		expect(res.status).toBe(409)
	})

	it('serialises concurrent additions of the same product', async () => {
		const shopper = guest(app)
		const results = await Promise.all(
			Array.from({ length: 5 }, () => shopper.addItem('ceramic-vase', 2)),
		)
		// Stock is 8: exactly four of the five requests can succeed.
		expect(results.filter((r) => r.status === 200)).toHaveLength(4)
		expect(results.filter((r) => r.status === 409)).toHaveLength(1)
		expect((await shopper.get('/api/cart')).body.totalNumberOfItems).toBe(8)
	})
})

describe('PATCH /api/cart/items/:entryNumber', () => {
	it('updates the quantity of a line', async () => {
		const shopper = guest(app)
		await shopper.addItem('arc-lamp')
		const res = await shopper.patch('/api/cart/items/0', { quantity: 3 })
		expect(res.status).toBe(200)
		expect(res.body.totalNumberOfItems).toBe(3)
		expect(res.body.subtotal).toBe(267)
		expectContract(res, 'patch', '/api/cart/items/{entryNumber}')
	})

	it('checks stock for the new quantity', async () => {
		const shopper = guest(app)
		await shopper.addItem('arc-lamp')
		const res = await shopper.patch('/api/cart/items/0', { quantity: 13 })
		expect(res.status).toBe(409)
		expectContract(res, 'patch', '/api/cart/items/{entryNumber}')
	})

	it('returns 404 for a missing line and 400 for invalid input', async () => {
		const shopper = guest(app)
		await shopper.addItem('arc-lamp')
		const missing = await shopper.patch('/api/cart/items/5', { quantity: 1 })
		expect(missing.status).toBe(404)
		expect(missing.body).toEqual({ error: 'Cart item not found' })
		expectContract(missing, 'patch', '/api/cart/items/{entryNumber}')
		expect(
			(await shopper.patch('/api/cart/items/abc', { quantity: 1 })).status,
		).toBe(400)
		expect(
			(await shopper.patch('/api/cart/items/-1', { quantity: 1 })).status,
		).toBe(400)
		expect(
			(await shopper.patch('/api/cart/items/0', { quantity: 0 })).status,
		).toBe(400)
	})
})

describe('DELETE /api/cart/items/:entryNumber', () => {
	it('removes a line and renumbers the remaining ones', async () => {
		const shopper = guest(app)
		await shopper.addItem('arc-lamp')
		await shopper.addItem('linen-throw')
		await shopper.addItem('oak-tray')
		const res = await shopper.delete('/api/cart/items/1')
		expect(res.status).toBe(200)
		expectContract(res, 'delete', '/api/cart/items/{entryNumber}')
		expect(
			res.body.entries.map(
				(e: { entryNumber: number; product: { sku: string } }) => [
					e.entryNumber,
					e.product.sku,
				],
			),
		).toEqual([
			[0, 'arc-lamp'],
			[1, 'oak-tray'],
		])
	})

	it('returns 404 for a missing line', async () => {
		const res = await guest(app).delete('/api/cart/items/0')
		expect(res.status).toBe(404)
		expectContract(res, 'delete', '/api/cart/items/{entryNumber}')
	})

	it('returns the empty-cart totals after removing the last line', async () => {
		const shopper = guest(app)
		await shopper.addItem('arc-lamp')
		const res = await shopper.delete('/api/cart/items/0')
		expect(res.body).toMatchObject({
			entries: [],
			totalPrice: 0,
			shippingPrice: 0,
		})
	})
})

describe('DELETE /api/cart', () => {
	it('removes every line and the voucher', async () => {
		const shopper = guest(app)
		await shopper.addItem('arc-lamp')
		await shopper.addItem('linen-throw')
		await shopper.put('/api/cart/voucher', { code: 'DEMO10' })
		const res = await shopper.delete('/api/cart')
		expect(res.status).toBe(200)
		expectContract(res, 'delete', '/api/cart')
		expect(res.body).toMatchObject({
			entries: [],
			totalPrice: 0,
			orderDiscounts: 0,
			appliedVouchers: [],
		})
		expect(await db.cartItem.count()).toBe(0)
	})

	it('succeeds for a session without a cart', async () => {
		const res = await guest(app).delete('/api/cart')
		expect(res.status).toBe(200)
		expect(res.body.cartId).toBeNull()
	})
})
