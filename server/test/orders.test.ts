import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it } from 'vitest'
import { customer, guest, testApp } from './helpers/api.js'
import { expectContract } from './helpers/contract.js'
import { resetDatabase, useTestDb } from './helpers/db.js'

const db = useTestDb()
const app = testApp(db)

beforeEach(() => resetDatabase(db))

async function shopperWithCart() {
	const shopper = guest(app)
	await shopper.addItem('arc-lamp', 2)
	await shopper.addItem('linen-throw', 1)
	await shopper.put('/api/cart/voucher', { code: 'DEMO10' })
	return shopper
}

describe('POST /api/orders', () => {
	it('creates a pending order with a server-calculated snapshot', async () => {
		const shopper = await shopperWithCart()
		const res = await shopper.createOrder()
		expect(res.status).toBe(201)
		expectContract(res, 'post', '/api/orders')
		expect(res.body).toMatchObject({
			customer,
			status: 'awaiting_payment',
			paymentStatus: 'Pending',
			attempts: 0,
			cart: {
				cartId: null,
				subtotal: 232,
				orderDiscounts: 23.2,
				VAT: 34.8,
				shippingPrice: 5,
				totalPrice: 213.8,
				totalNumberOfItems: 3,
				appliedVouchers: [{ code: 'DEMO10' }],
			},
		})
		expect(res.body.cart.entries).toHaveLength(2)
		expect(JSON.stringify(res.body)).not.toContain(shopper.sessionId)
	})

	it('persists the order, its items and the customer address', async () => {
		const shopper = await shopperWithCart()
		const { body } = await shopper.createOrder()
		const stored = await db.order.findUniqueOrThrow({
			where: { id: body.id },
			include: { items: { orderBy: { entryNumber: 'asc' } } },
		})
		expect(stored).toMatchObject({
			sessionId: shopper.sessionId,
			subtotalCents: 23200,
			discountCents: 2320,
			vatCents: 3480,
			shippingCents: 500,
			totalCents: 21380,
			voucherCode: 'DEMO10',
			city: 'London',
		})
		expect(
			stored.items.map((i) => [i.sku, i.quantity, i.lineTotalCents]),
		).toEqual([
			['arc-lamp', 2, 17800],
			['linen-throw', 1, 5400],
		])
	})

	it('empties the cart and removes the voucher', async () => {
		const shopper = await shopperWithCart()
		await shopper.createOrder()
		const cart = await shopper.get('/api/cart')
		expect(cart.body).toMatchObject({
			entries: [],
			appliedVouchers: [],
			totalPrice: 0,
		})
	})

	it('keeps the snapshot immutable when products change later', async () => {
		const shopper = await shopperWithCart()
		const { body } = await shopper.createOrder()
		await db.product.update({
			where: { sku: 'arc-lamp' },
			data: { priceCents: 1, name: 'Renamed' },
		})
		const res = await shopper.get(`/api/orders/${body.id}`)
		expect(res.body.cart.entries[0].product).toMatchObject({
			name: 'Arc Desk Lamp',
			price: { value: 89 },
		})
		expect(res.body.cart.totalPrice).toBe(213.8)
	})

	it('ignores client-supplied totals and prices', async () => {
		const shopper = guest(app)
		await shopper.addItem('arc-lamp', 2)
		const res = await shopper.createOrder(randomUUID(), {
			totalPrice: 0,
			cart: { totalPrice: 0 },
		})
		expect(res.body.cart.totalPrice).toBe(183)
	})

	it('returns 409 for an empty cart', async () => {
		const res = await guest(app).createOrder()
		expect(res.status).toBe(409)
		expect(res.body).toEqual({ error: 'Your cart is empty' })
		expectContract(res, 'post', '/api/orders')
	})

	it('re-checks stock when the order is placed', async () => {
		const shopper = guest(app)
		await shopper.addItem('arc-lamp', 5)
		await db.product.update({ where: { sku: 'arc-lamp' }, data: { stock: 4 } })
		const res = await shopper.createOrder()
		expect(res.status).toBe(409)
		expect(res.body).toEqual({ error: 'Requested quantity is unavailable' })
		expect(await db.order.count()).toBe(0)
		expect((await shopper.get('/api/cart')).body.totalNumberOfItems).toBe(5)
	})

	describe('idempotency', () => {
		it('returns the same order for a repeated key', async () => {
			const shopper = await shopperWithCart()
			const key = randomUUID()
			const first = await shopper.createOrder(key)
			const second = await shopper.createOrder(key)
			expect(first.status).toBe(201)
			expect(second.status).toBe(200)
			expectContract(second, 'post', '/api/orders')
			expect(second.body).toEqual(first.body)
			expect(await db.order.count()).toBe(1)
		})

		it('rejects a repeated key with different customer details', async () => {
			const shopper = await shopperWithCart()
			const key = randomUUID()
			await shopper.createOrder(key)
			const res = await shopper.createOrder(key, {
				customer: { ...customer, firstName: 'Sam' },
			})
			expect(res.status).toBe(409)
			expect(res.body.error).toMatch(/Idempotency key/)
		})

		it('creates exactly one order for concurrent duplicate requests', async () => {
			const shopper = await shopperWithCart()
			const key = randomUUID()
			const results = await Promise.all(
				Array.from({ length: 5 }, () => shopper.createOrder(key)),
			)
			expect(results.map((r) => r.status).sort()).toEqual([
				200, 200, 200, 200, 201,
			])
			expect(new Set(results.map((r) => r.body.id)).size).toBe(1)
			expect(await db.order.count()).toBe(1)
		})

		it('scopes keys to the session', async () => {
			const key = randomUUID()
			const a = await shopperWithCart()
			const b = await shopperWithCart()
			const [first, second] = [
				await a.createOrder(key),
				await b.createOrder(key),
			]
			expect(first.status).toBe(201)
			expect(second.status).toBe(201)
			expect(first.body.id).not.toBe(second.body.id)
		})
	})

	describe('customer validation', () => {
		it.each([
			['invalid email', { email: 'not-email' }],
			['empty first name', { firstName: '' }],
			['HTML in the street', { streetAndNumber: '<script>' }],
			['short postal code', { zipCode: 'x' }],
			['unsupported country', { country: 'France' }],
			['repeated characters', { lastName: 'Aaaa' }],
			['leading space', { firstName: ' Alex' }],
			['digits in the city', { city: 'L0ndon' }],
		])('rejects %s', async (_name, change) => {
			const shopper = await shopperWithCart()
			const res = await shopper.createOrder(randomUUID(), {
				customer: { ...customer, ...change },
			})
			expect(res.status).toBe(400)
			expectContract(res, 'post', '/api/orders')
		})

		it('rejects other payment method types and malformed keys', async () => {
			const shopper = await shopperWithCart()
			expect(
				(await shopper.createOrder(randomUUID(), { paymentMethodType: 'card' }))
					.status,
			).toBe(400)
			expect((await shopper.createOrder('not-a-uuid')).status).toBe(400)
		})

		it('accepts names and addresses with diacritics', async () => {
			const shopper = await shopperWithCart()
			const res = await shopper.createOrder(randomUUID(), {
				customer: {
					...customer,
					firstName: 'Zoë',
					lastName: "O'Brien-Müller",
					streetAndNumber: 'Königstraße 5/2',
					city: 'München',
					zipCode: '80331',
					country: 'Germany',
				},
			})
			expect(res.status).toBe(201)
		})
	})

	it('limits orders per session to 50', async () => {
		const shopper = guest(app)
		await shopper.addItem('stone-bowl')
		const { body } = await shopper.createOrder()
		const template = await db.order.findUniqueOrThrow({
			where: { id: body.id },
		})
		const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = template
		await db.order.createMany({
			data: Array.from({ length: 49 }, () => ({
				...rest,
				idempotencyKey: randomUUID(),
			})),
		})
		await shopper.addItem('stone-bowl')
		const res = await shopper.createOrder()
		expect(res.status).toBe(429)
		expectContract(res, 'post', '/api/orders')
	})
})

describe('GET /api/orders/:orderId', () => {
	it('returns the order to its own session', async () => {
		const shopper = await shopperWithCart()
		const { body } = await shopper.createOrder()
		const res = await shopper.get(`/api/orders/${body.id}`)
		expect(res.status).toBe(200)
		expectContract(res, 'get', '/api/orders/{orderId}')
		expect(res.body).toEqual(body)
	})

	it('hides orders of other sessions', async () => {
		const shopper = await shopperWithCart()
		const { body } = await shopper.createOrder()
		const res = await guest(app).get(`/api/orders/${body.id}`)
		expect(res.status).toBe(404)
		expect(res.body).toEqual({ error: 'Order not found' })
		expectContract(res, 'get', '/api/orders/{orderId}')
	})

	it('returns 404 for unknown and malformed ids', async () => {
		const shopper = guest(app)
		expect((await shopper.get(`/api/orders/${randomUUID()}`)).status).toBe(404)
		expect((await shopper.get('/api/orders/not-a-uuid')).status).toBe(404)
	})
})

describe('GET /api/orders/latest', () => {
	it('returns the most recent order of the session', async () => {
		const shopper = guest(app)
		await shopper.addItem('arc-lamp')
		await shopper.createOrder()
		await shopper.addItem('oak-tray')
		const second = await shopper.createOrder()
		const res = await shopper.get('/api/orders/latest')
		expect(res.status).toBe(200)
		expectContract(res, 'get', '/api/orders/latest')
		expect(res.body.id).toBe(second.body.id)
	})

	it('returns 404 when the session has no orders', async () => {
		await (await shopperWithCart()).createOrder()
		const res = await guest(app).get('/api/orders/latest')
		expect(res.status).toBe(404)
		expect(res.body).toEqual({ error: 'No orders found' })
		expectContract(res, 'get', '/api/orders/latest')
	})
})
