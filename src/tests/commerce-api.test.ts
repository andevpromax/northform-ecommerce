// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as cart from '@/app/api/cart/route'
import * as changeQuantity from '@/app/api/cart/change-entry-quantity/route'
import * as deleteEntry from '@/app/api/cart/delete-entry/route'
import * as voucher from '@/app/api/cart/voucher/route'
import * as createOrder from '@/app/api/order/createOrder/route'
import * as orderById from '@/app/api/orders/[id]/route'
import * as latestOrder from '@/app/api/orders/latest/route'
import * as payments from '@/app/api/payments/[id]/route'
import * as addToCart from '@/app/api/product/add-to-cart/route'
import * as paymentMethods from '@/app/api/user/payment-methods/route'
import { EXPRESS_URL, cartFor } from './fakeExpress'

type Canned = Record<string, [number, unknown]>
type Call = { method: string; url: string; headers: Headers; body: unknown }

const sessionId = randomUUID()
const cookie = `showcase-session=${sessionId}`
const expressCart = cartFor([{ sku: 'arc-lamp', quantity: 2 }], randomUUID())
const order = {
	id: randomUUID(),
	createdAt: '2026-11-05T14:00:00.000Z',
	customer: {
		firstName: 'Alex',
		lastName: 'Taylor',
		email: 'alex@example.test',
		streetAndNumber: '12 Example Street',
		city: 'London',
		zipCode: 'SW1A 1AA',
		country: 'United Kingdom',
	},
	cart: { ...expressCart, cartId: null },
	status: 'awaiting_payment',
	paymentStatus: 'Pending',
	attempts: 0,
}

let calls: Call[]
function express(canned: Canned) {
	vi.stubGlobal(
		'fetch',
		vi.fn(async (input: URL | string, init: RequestInit = {}) => {
			const url = new URL(String(input))
			const method = init.method ?? 'GET'
			calls.push({
				method,
				url: url.pathname,
				headers: new Headers(init.headers),
				body: init.body ? JSON.parse(String(init.body)) : undefined,
			})
			const [status, body] = canned[`${method} ${url.pathname}`] ?? [
				404,
				{ error: 'Endpoint not found' },
			]
			return new Response(JSON.stringify(body), {
				status,
				headers: { 'content-type': 'application/json' },
			})
		}),
	)
}

const req = (
	path: string,
	{
		method = 'GET',
		body,
		cookies = cookie,
	}: { method?: string; body?: unknown; cookies?: string } = {},
) =>
	new NextRequest(`http://localhost/api/${path}`, {
		method,
		headers: {
			...(cookies ? { cookie: cookies } : {}),
			...(body === undefined ? {} : { 'content-type': 'application/json' }),
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	})
const params = <T>(value: T) => ({ params: Promise.resolve(value) })

beforeEach(() => {
	calls = []
	vi.stubEnv('COMMERCE_SERVER_URL', EXPRESS_URL)
	vi.stubEnv('INTERNAL_API_TOKEN', '')
})
afterEach(() => {
	vi.unstubAllEnvs()
	vi.unstubAllGlobals()
})

describe('cart routes → Express', () => {
	it('GET /api/cart wraps the Express cart in the legacy envelope', async () => {
		express({ 'GET /api/cart': [200, expressCart] })
		const res = await cart.GET(req('cart?locale=en-GB'))
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual({ success: true, data: expressCart })
		expect(calls).toMatchObject([{ method: 'GET', url: '/api/cart' }])
		expect(calls[0].headers.get('x-session-id')).toBe(sessionId)
	})

	it('POST /api/product/add-to-cart → POST /api/cart/items', async () => {
		express({ 'POST /api/cart/items': [200, expressCart] })
		const res = await addToCart.POST(
			req('product/add-to-cart', {
				method: 'POST',
				body: { sku: 'arc-lamp', quantity: 2, locale: 'en-GB', price: 0 },
			}),
		)
		expect(await res.json()).toEqual({
			success: true,
			cartId: expressCart.cartId,
			isAnonymous: true,
			sku: 'arc-lamp',
			quantity: 2,
		})
		// Only the validated fields are forwarded; prices are never sent.
		expect(calls[0].body).toEqual({ sku: 'arc-lamp', quantity: 2 })
	})

	it('never uses the session ID as the cart ID', async () => {
		express({ 'POST /api/cart/items': [200, expressCart] })
		const res = await addToCart.POST(
			req('product/add-to-cart', {
				method: 'POST',
				body: { sku: 'arc-lamp', quantity: 1 },
			}),
		)
		expect(JSON.stringify(await res.json())).not.toContain(sessionId)
	})

	it('maps quantity changes and deletions to the entry resource', async () => {
		express({
			'PATCH /api/cart/items/1': [200, expressCart],
			'DELETE /api/cart/items/0': [200, expressCart],
			'DELETE /api/cart': [200, expressCart],
		})
		const changed = await changeQuantity.POST(
			req('cart/change-entry-quantity', {
				method: 'POST',
				body: { entryNumber: 1, quantity: 3, locale: 'en-GB' },
			}),
		)
		const deleted = await deleteEntry.POST(
			req('cart/delete-entry', { method: 'POST', body: { entryNumber: 0 } }),
		)
		const cleared = await cart.DELETE(req('cart', { method: 'DELETE' }))
		for (const res of [changed, deleted, cleared])
			expect(await res.json()).toEqual({ success: true })
		expect(calls.map((c) => [c.method, c.url, c.body])).toEqual([
			['PATCH', '/api/cart/items/1', { quantity: 3 }],
			['DELETE', '/api/cart/items/0', undefined],
			['DELETE', '/api/cart', undefined],
		])
	})

	it('maps the legacy voucher body to PUT/DELETE /api/cart/voucher', async () => {
		express({
			'PUT /api/cart/voucher': [200, expressCart],
			'DELETE /api/cart/voucher': [200, expressCart],
		})
		const body = { voucherId: 'DEMO10', cartId: 'x', locale: 'en-GB' }
		expect(
			await (
				await voucher.POST(req('cart/voucher', { method: 'POST', body }))
			).json(),
		).toEqual({ success: true })
		expect(
			await (
				await voucher.DELETE(req('cart/voucher', { method: 'DELETE', body }))
			).json(),
		).toEqual({ success: true })
		expect(calls.map((c) => [c.method, c.url, c.body])).toEqual([
			['PUT', '/api/cart/voucher', { code: 'DEMO10' }],
			['DELETE', '/api/cart/voucher', undefined],
		])
	})

	it('passes backend business errors through with their status', async () => {
		express({
			'POST /api/cart/items': [
				409,
				{ error: 'Requested quantity is unavailable' },
			],
			'PUT /api/cart/voucher': [404, { error: 'Voucher not found' }],
		})
		const stock = await addToCart.POST(
			req('product/add-to-cart', {
				method: 'POST',
				body: { sku: 'arc-lamp', quantity: 13 },
			}),
		)
		expect(stock.status).toBe(409)
		expect(await stock.json()).toEqual({
			error: 'Requested quantity is unavailable',
		})
		const code = await voucher.POST(
			req('cart/voucher', { method: 'POST', body: { voucherId: 'NOPE' } }),
		)
		expect(code.status).toBe(404)
	})
})

describe('order and payment routes → Express', () => {
	const customer = order.customer

	it('POST /api/order/createOrder returns the legacy 201 envelope', async () => {
		express({ 'POST /api/orders': [201, order] })
		const idempotencyKey = randomUUID()
		const res = await createOrder.POST(
			req('order/createOrder', {
				method: 'POST',
				body: {
					locale: 'en-GB',
					customer,
					idempotencyKey,
					paymentMethodType: 'simulation',
					paymentMethodId: '',
					encryptedSecurityCode: '',
					totalPrice: 0,
				},
			}),
		)
		expect(res.status).toBe(201)
		expect(await res.json()).toEqual({
			status: 'success',
			data: {
				order: { code: order.id, guid: order.id, status: 'awaiting_payment' },
				adyen: { resultCode: 'Pending', action: null },
			},
		})
		expect(calls[0].body).toEqual({
			customer,
			idempotencyKey,
			paymentMethodType: 'simulation',
		})
	})

	it('keeps the legacy 201 for idempotent replays', async () => {
		express({ 'POST /api/orders': [200, order] })
		const res = await createOrder.POST(
			req('order/createOrder', {
				method: 'POST',
				body: {
					customer,
					idempotencyKey: randomUUID(),
					paymentMethodType: 'simulation',
				},
			}),
		)
		expect(res.status).toBe(201)
	})

	it('reads orders and returns null when there is no latest order', async () => {
		express({
			[`GET /api/orders/${order.id}`]: [200, order],
			'GET /api/orders/latest': [404, { error: 'No orders found' }],
		})
		const found = await orderById.GET(
			req(`orders/${order.id}`),
			params({ id: order.id }),
		)
		expect(await found.json()).toEqual(order)
		const latest = await latestOrder.GET(req('orders/latest'))
		expect(latest.status).toBe(200)
		expect(await latest.json()).toBeNull()
	})

	it('cannot address other Express resources through the order id', async () => {
		express({})
		await orderById.GET(req('orders/x'), params({ id: '../cart' }))
		expect(calls[0].url).toBe('/api/orders/..%2Fcart')
	})

	it('maps payments and derives the payment status from the order', async () => {
		const paid = {
			...order,
			status: 'confirmed',
			paymentStatus: 'Authorised',
			attempts: 1,
		}
		express({
			[`POST /api/orders/${order.id}/payments`]: [200, paid],
			[`GET /api/orders/${order.id}`]: [200, paid],
		})
		const body = { outcome: 'success', idempotencyKey: randomUUID() }
		const res = await payments.POST(
			req(`payments/${order.id}`, { method: 'POST', body }),
			params({ id: order.id }),
		)
		expect(await res.json()).toEqual(paid)
		expect(calls[0].body).toEqual(body)
		const status = await payments.GET(
			req(`payments/${order.id}`),
			params({ id: order.id }),
		)
		expect(await status.json()).toEqual({ status: 'Authorised', attempts: 1 })
	})

	it('wraps the payment methods in the legacy envelope', async () => {
		const methods = {
			paymentMethods: [
				{
					type: 'success',
					name: 'Simulated payment — succeed',
					isExternalPaymentMethod: false,
				},
			],
			storedPaymentMethodList: [],
		}
		express({ 'GET /api/payment-methods': [200, methods] })
		const res = await paymentMethods.GET(
			req('user/payment-methods?locale=en-GB'),
		)
		expect(await res.json()).toEqual({ data: methods })
	})
})

describe('guest session and transport', () => {
	it('replaces a malformed session cookie with a new UUID', async () => {
		express({ 'GET /api/cart': [200, expressCart] })
		const res = await cart.GET(
			req('cart', { cookies: 'showcase-session=not-a-uuid' }),
		)
		const forwarded = calls[0].headers.get('x-session-id')!
		expect(forwarded).toMatch(/^[0-9a-f-]{36}$/)
		expect(res.headers.get('set-cookie')).toContain(
			`showcase-session=${forwarded}`,
		)
	})

	it('marks the cookie Secure behind an HTTPS proxy', async () => {
		express({ 'GET /api/cart': [200, expressCart] })
		const request = req('cart')
		request.headers.set('x-forwarded-proto', 'https')
		expect((await cart.GET(request)).headers.get('set-cookie')).toContain(
			'Secure',
		)
	})

	it('sends the internal token server-side only and never returns it', async () => {
		const token = 'next-to-express-secret-0123456789abcdef'
		vi.stubEnv('INTERNAL_API_TOKEN', token)
		express({ 'GET /api/cart': [200, expressCart] })
		const res = await cart.GET(req('cart'))
		expect(calls[0].headers.get('x-internal-token')).toBe(token)
		expect(JSON.stringify(await res.json())).not.toContain(token)
		expect(JSON.stringify([...res.headers])).not.toContain(token)
	})

	it('returns 502 instead of in-memory data when Express is down', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockRejectedValue(new TypeError('fetch failed')),
		)
		const res = await cart.GET(req('cart'))
		expect(res.status).toBe(502)
		expect(await res.json()).toEqual({ error: 'Commerce service unavailable' })
	})

	it('treats token rejections and unknown routes as integration errors', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		express({ 'GET /api/cart': [401, { error: 'Unauthorized' }] })
		expect((await cart.GET(req('cart'))).status).toBe(502)
		express({})
		expect((await latestOrder.GET(req('orders/latest'))).status).toBe(502)
		error.mockRestore()
	})

	it('returns 503 when the backend is not configured', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.stubEnv('COMMERCE_SERVER_URL', '')
		const fetch = vi.fn()
		vi.stubGlobal('fetch', fetch)
		const res = await cart.GET(req('cart'))
		expect(res.status).toBe(503)
		expect(fetch).not.toHaveBeenCalled()
		error.mockRestore()
	})
})
