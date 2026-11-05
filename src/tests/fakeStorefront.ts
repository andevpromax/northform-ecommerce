import { vi } from 'vitest'
import { products } from '@/mocks/products'
import { cartFor } from './fakeExpress'

export type StorefrontCall = { url: string; method: string; body: unknown }

// Browser-side stand-in for the storefront /api routes the UI calls, backed by
// one in-memory cart. Lines merge by SKU like the real backend.
export function installFakeStorefront() {
	const state = {
		lines: [] as { sku: string; quantity: number }[],
		calls: [] as StorefrontCall[],
		totalItems: () => state.lines.reduce((sum, line) => sum + line.quantity, 0),
	}
	vi.stubGlobal(
		'fetch',
		vi.fn(async (url: string, init?: RequestInit) => {
			const input = JSON.parse(String(init?.body || '{}'))
			state.calls.push({ url, method: init?.method ?? 'GET', body: input })
			let data: unknown = {}
			if (url.startsWith('/api/cart?'))
				data = { success: true, data: cartFor(state.lines, 'cart-1') }
			else if (url === '/api/products') data = products
			else if (url === '/api/product/add-to-cart') {
				const line = state.lines.find((l) => l.sku === input.sku)
				if (line) line.quantity += input.quantity
				else state.lines.push({ sku: input.sku, quantity: input.quantity })
				data = { success: true, cartId: 'cart-1', isAnonymous: true, ...input }
			} else if (url === '/api/cart/change-entry-quantity') {
				state.lines[input.entryNumber].quantity = input.quantity
				data = { success: true }
			} else if (url === '/api/cart/delete-entry') {
				state.lines.splice(input.entryNumber, 1)
				data = { success: true }
			} else if (url.startsWith('/api/user/payment-methods'))
				data = {
					data: {
						paymentMethods: [
							{
								type: 'success',
								name: 'Simulated success',
								isExternalPaymentMethod: false,
							},
							{
								type: 'failure',
								name: 'Simulated decline',
								isExternalPaymentMethod: false,
							},
						],
						storedPaymentMethodList: [],
					},
				}
			return new Response(JSON.stringify(data), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			})
		}),
	)
	return state
}
