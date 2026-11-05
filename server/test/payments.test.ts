import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { guest, testApp } from './helpers/api.js'
import { expectContract } from './helpers/contract.js'
import { resetDatabase, useTestDb } from './helpers/db.js'

const db = useTestDb()
const app = testApp(db)

beforeEach(() => resetDatabase(db))

async function placeOrder() {
	const shopper = guest(app)
	await shopper.addItem('arc-lamp', 2)
	const { body } = await shopper.createOrder()
	return { shopper, orderId: body.id as string }
}

const path = '/api/orders/{orderId}/payments'

describe('GET /api/payment-methods', () => {
	it('lists the simulated success and failure methods', async () => {
		const res = await request(app).get('/api/payment-methods')
		expect(res.status).toBe(200)
		expectContract(res, 'get', '/api/payment-methods')
		expect(res.body).toEqual({
			paymentMethods: [
				{
					type: 'success',
					name: 'Simulated payment — succeed',
					isExternalPaymentMethod: false,
				},
				{
					type: 'failure',
					name: 'Simulated payment — decline',
					isExternalPaymentMethod: false,
				},
			],
			storedPaymentMethodList: [],
		})
	})
})

describe('POST /api/orders/:orderId/payments', () => {
	it('authorises a successful payment and confirms the order', async () => {
		const { shopper, orderId } = await placeOrder()
		const res = await shopper.pay(orderId, 'success')
		expect(res.status).toBe(200)
		expectContract(res, 'post', path)
		expect(res.body).toMatchObject({
			id: orderId,
			status: 'confirmed',
			paymentStatus: 'Authorised',
			attempts: 1,
		})
		const transactions = await db.paymentTransaction.findMany()
		expect(transactions).toEqual([
			expect.objectContaining({
				orderId,
				outcome: 'SUCCESS',
				resultStatus: 'AUTHORISED',
				amountCents: 18300,
				currency: 'EUR',
			}),
		])
	})

	it('records a declined payment', async () => {
		const { shopper, orderId } = await placeOrder()
		const res = await shopper.pay(orderId, 'failure')
		expect(res.status).toBe(200)
		expectContract(res, 'post', path)
		expect(res.body).toMatchObject({
			status: 'payment_failed',
			paymentStatus: 'Refused',
			attempts: 1,
		})
	})

	it('allows retrying after a decline', async () => {
		const { shopper, orderId } = await placeOrder()
		await shopper.pay(orderId, 'failure')
		const res = await shopper.pay(orderId, 'success')
		expect(res.body).toMatchObject({
			status: 'confirmed',
			paymentStatus: 'Authorised',
			attempts: 2,
		})
	})

	it('replays a repeated key without a new attempt', async () => {
		const { shopper, orderId } = await placeOrder()
		const key = randomUUID()
		const first = await shopper.pay(orderId, 'failure', key)
		const second = await shopper.pay(orderId, 'failure', key)
		expect(second.status).toBe(200)
		expect(second.body).toEqual(first.body)
		expect(await db.paymentTransaction.count()).toBe(1)
	})

	it('rejects a key reused for another outcome or order', async () => {
		const { shopper, orderId } = await placeOrder()
		const key = randomUUID()
		await shopper.pay(orderId, 'failure', key)
		const otherOutcome = await shopper.pay(orderId, 'success', key)
		expect(otherOutcome.status).toBe(409)
		expect(otherOutcome.body).toEqual({ error: 'Payment key conflict' })
		expectContract(otherOutcome, 'post', path)

		await shopper.addItem('oak-tray')
		const { body: second } = await shopper.createOrder()
		expect((await shopper.pay(second.id, 'failure', key)).status).toBe(409)
	})

	it('never charges an authorised order again', async () => {
		const { shopper, orderId } = await placeOrder()
		await shopper.pay(orderId, 'success')
		const res = await shopper.pay(orderId, 'failure')
		expect(res.body).toMatchObject({
			status: 'confirmed',
			paymentStatus: 'Authorised',
			attempts: 1,
		})
		expect(await db.paymentTransaction.count()).toBe(1)
	})

	it('authorises once under concurrent payment requests', async () => {
		const { shopper, orderId } = await placeOrder()
		const results = await Promise.all(
			Array.from({ length: 5 }, () => shopper.pay(orderId, 'success')),
		)
		expect(results.every((r) => r.status === 200)).toBe(true)
		expect(
			await db.paymentTransaction.count({
				where: { resultStatus: 'AUTHORISED' },
			}),
		).toBe(1)
	})

	it('limits payment attempts to 20', async () => {
		const { shopper, orderId } = await placeOrder()
		await db.paymentTransaction.createMany({
			data: Array.from({ length: 20 }, () => ({
				orderId,
				idempotencyKey: randomUUID(),
				outcome: 'FAILURE' as const,
				resultStatus: 'REFUSED' as const,
				amountCents: 18300,
				currency: 'EUR',
			})),
		})
		const res = await shopper.pay(orderId, 'success')
		expect(res.status).toBe(429)
		expectContract(res, 'post', path)
	})

	it("cannot pay another session's order", async () => {
		const { orderId } = await placeOrder()
		const res = await guest(app).pay(orderId, 'success')
		expect(res.status).toBe(404)
		expectContract(res, 'post', path)
		expect(await db.paymentTransaction.count()).toBe(0)
	})

	it('validates the outcome and key, and stores no card data', async () => {
		const { shopper, orderId } = await placeOrder()
		const invalid = await shopper.post(`/api/orders/${orderId}/payments`, {
			outcome: 'maybe',
			idempotencyKey: randomUUID(),
		})
		expect(invalid.status).toBe(400)
		expectContract(invalid, 'post', path)
		expect(
			(
				await shopper.post(`/api/orders/${orderId}/payments`, {
					outcome: 'success',
				})
			).status,
		).toBe(400)

		const withCard = await shopper.post(`/api/orders/${orderId}/payments`, {
			outcome: 'success',
			idempotencyKey: randomUUID(),
			cardNumber: '4111111111111111',
			cvc: '737',
		})
		expect(withCard.status).toBe(200)
		const rows = await db.paymentTransaction.findMany()
		expect(JSON.stringify(rows)).not.toContain('4111111111111111')
		expect(Object.keys(rows[0]).sort()).toEqual([
			'amountCents',
			'createdAt',
			'currency',
			'id',
			'idempotencyKey',
			'orderId',
			'outcome',
			'resultStatus',
		])
	})
})
