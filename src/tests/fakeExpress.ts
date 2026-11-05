import { vi } from 'vitest'
import { products } from '@/mocks/products'

export const EXPRESS_URL = 'http://express.test'

export type ExpressCall = {
	method: string
	path: string
	headers: Record<string, string>
	body: unknown
}

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	})

// Minimal stand-in for the Express cart API (one cart per X-Session-Id), so
// Route Handler tests run without a network or database. Totals follow the
// backend rules for carts without a voucher.
export function cartFor(
	lines: { sku: string; quantity: number }[],
	cartId: string,
) {
	const entries = lines.map((line, entryNumber) => {
		const p = products.find((product) => product.sku === line.sku)!
		return {
			entryNumber,
			quantity: line.quantity,
			totalPrice: { value: p.price * line.quantity, currencyISO: 'EUR' },
			product: {
				sku: p.sku,
				name: p.name,
				dimensions: p.category,
				price: { value: p.price, currencyISO: 'EUR' },
				discount: null,
				imageUrl: p.image,
			},
		}
	})
	const subtotal = entries.reduce((sum, e) => sum + e.totalPrice.value, 0)
	const shippingPrice = subtotal ? 5 : 0
	return {
		cartId: lines.length ? cartId : null,
		subtotal,
		VAT: Math.round((subtotal / 6) * 100) / 100,
		shippingPrice,
		totalPrice: subtotal + shippingPrice,
		currencyISO: 'EUR',
		referenceId: null,
		fiscalCode: null,
		totalNumberOfItems: lines.reduce((sum, l) => sum + l.quantity, 0),
		entries,
		orderDiscounts: 0,
		appliedVouchers: [],
	}
}

export function installFakeExpress() {
	vi.stubEnv('COMMERCE_SERVER_URL', EXPRESS_URL)
	const calls: ExpressCall[] = []
	const carts = new Map<string, { sku: string; quantity: number }[]>()
	vi.stubGlobal(
		'fetch',
		vi.fn(async (input: URL | string, init: RequestInit = {}) => {
			const url = new URL(String(input))
			const headers = Object.fromEntries(new Headers(init.headers).entries())
			const body = init.body ? JSON.parse(String(init.body)) : undefined
			const method = init.method ?? 'GET'
			calls.push({ method, path: url.pathname, headers, body })
			const session = headers['x-session-id']
			const lines = carts.get(session) ?? []
			if (url.pathname === '/api/cart' && method === 'GET')
				return json(cartFor(lines, `cart-of-${session}`))
			if (url.pathname === '/api/cart/items' && method === 'POST') {
				carts.set(session, [...lines, body])
				return json(cartFor(carts.get(session)!, `cart-of-${session}`))
			}
			return json({ error: 'Endpoint not found' }, 404)
		}),
	)
	return calls
}
