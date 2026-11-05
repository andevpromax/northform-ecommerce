import { beforeEach, describe, expect, it } from 'vitest'
import { guest, testApp } from './helpers/api.js'
import { expectContract } from './helpers/contract.js'
import { resetDatabase, useTestDb } from './helpers/db.js'

const db = useTestDb()
const app = testApp(db)

beforeEach(() => resetDatabase(db))

async function shopperWithItems() {
	const shopper = guest(app)
	await shopper.addItem('arc-lamp', 2)
	await shopper.addItem('linen-throw', 1)
	return shopper
}

describe('PUT /api/cart/voucher', () => {
	it('applies DEMO10 and recalculates totals', async () => {
		const shopper = await shopperWithItems()
		const res = await shopper.put('/api/cart/voucher', { code: 'DEMO10' })
		expect(res.status).toBe(200)
		expectContract(res, 'put', '/api/cart/voucher')
		expect(res.body).toMatchObject({
			subtotal: 232,
			orderDiscounts: 23.2,
			VAT: 34.8,
			shippingPrice: 5,
			totalPrice: 213.8,
			appliedVouchers: [
				{
					code: 'DEMO10',
					voucherCode: 'DEMO10',
					description: '10% demo discount',
					appliedValue: { value: 23.2 },
				},
			],
		})
	})

	it('keeps the discount in step with later cart changes', async () => {
		const shopper = await shopperWithItems()
		await shopper.put('/api/cart/voucher', { code: 'DEMO10' })
		const res = await shopper.delete('/api/cart/items/1')
		expect(res.body).toMatchObject({ subtotal: 178, orderDiscounts: 17.8 })
	})

	it('can be applied to an empty cart without discounting anything', async () => {
		const res = await guest(app).put('/api/cart/voucher', { code: 'DEMO10' })
		expect(res.status).toBe(200)
		expect(res.body.orderDiscounts).toBe(0)
		expect(res.body.appliedVouchers).toHaveLength(1)
	})

	it('returns 404 for unknown codes, including other casing', async () => {
		const shopper = await shopperWithItems()
		for (const code of ['NOPE', 'demo10']) {
			const res = await shopper.put('/api/cart/voucher', { code })
			expect(res.status).toBe(404)
			expect(res.body).toEqual({ error: 'Voucher not found' })
			expectContract(res, 'put', '/api/cart/voucher')
		}
	})

	it.each([
		['inactive', { active: false }, 'Voucher is not active'],
		[
			'expired',
			{ validUntil: new Date(Date.now() - 1000) },
			'Voucher has expired',
		],
		[
			'not yet valid',
			{ validFrom: new Date(Date.now() + 86_400_000) },
			'Voucher is not yet valid',
		],
	])('returns 409 for %s vouchers', async (_name, data, error) => {
		await db.voucher.update({ where: { code: 'DEMO10' }, data })
		const res = await (await shopperWithItems()).put('/api/cart/voucher', {
			code: 'DEMO10',
		})
		expect(res.status).toBe(409)
		expect(res.body).toEqual({ error })
		expectContract(res, 'put', '/api/cart/voucher')
	})

	it('stops discounting when an applied voucher expires', async () => {
		const shopper = await shopperWithItems()
		await shopper.put('/api/cart/voucher', { code: 'DEMO10' })
		await db.voucher.update({
			where: { code: 'DEMO10' },
			data: { validUntil: new Date(Date.now() - 1000) },
		})
		const res = await shopper.get('/api/cart')
		expect(res.body).toMatchObject({ orderDiscounts: 0, appliedVouchers: [] })
	})

	it.each(['', 'DEMO 10', '<script>', 'x'.repeat(51)])(
		'rejects malformed code %j with 400',
		async (code) => {
			const res = await guest(app).put('/api/cart/voucher', { code })
			expect(res.status).toBe(400)
			expectContract(res, 'put', '/api/cart/voucher')
		},
	)

	it('supports fixed-amount vouchers', async () => {
		await db.voucher.create({
			data: {
				code: 'FLAT20',
				description: '€20 off',
				discountType: 'FIXED',
				discountValue: 2000,
			},
		})
		const res = await (await shopperWithItems()).put('/api/cart/voucher', {
			code: 'FLAT20',
		})
		expect(res.body).toMatchObject({ orderDiscounts: 20, totalPrice: 217 })
	})
})

describe('DELETE /api/cart/voucher', () => {
	it('removes the discount', async () => {
		const shopper = await shopperWithItems()
		await shopper.put('/api/cart/voucher', { code: 'DEMO10' })
		const res = await shopper.delete('/api/cart/voucher')
		expect(res.status).toBe(200)
		expectContract(res, 'delete', '/api/cart/voucher')
		expect(res.body).toMatchObject({
			orderDiscounts: 0,
			totalPrice: 237,
			appliedVouchers: [],
		})
	})

	it('is a no-op without a cart', async () => {
		const res = await guest(app).delete('/api/cart/voucher')
		expect(res.status).toBe(200)
		expect(res.body.cartId).toBeNull()
	})
})
