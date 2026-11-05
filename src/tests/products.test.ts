// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getProductsRoute } from '@/app/api/products/route'
import { GET as getProductRoute } from '@/app/api/products/[sku]/route'
import { products } from '@/mocks/products'

const get = (path: string) => {
	const request = new NextRequest(`http://localhost/api/${path}`)
	const [, sku] = path.split('/')
	return sku === undefined
		? getProductsRoute(request)
		: getProductRoute(request, { params: Promise.resolve({ sku }) })
}
const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	})

afterEach(() => {
	vi.unstubAllEnvs()
	vi.unstubAllGlobals()
})

// Express is the only product source; there is no bundled-data fallback.
describe('Products API without COMMERCE_SERVER_URL', () => {
	it('returns 503 without calling fetch or serving bundled products', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.stubEnv('COMMERCE_SERVER_URL', '')
		const fetch = vi.fn()
		vi.stubGlobal('fetch', fetch)
		for (const path of ['products', 'products/arc-lamp']) {
			const res = await get(path)
			expect(res.status).toBe(503)
			expect(await res.json()).toEqual({
				error: 'Product service is not configured',
			})
		}
		expect(fetch).not.toHaveBeenCalled()
		error.mockRestore()
	})
})

describe('Products API proxied to Express', () => {
	it('fetches the product list from the configured server', async () => {
		vi.stubEnv('COMMERCE_SERVER_URL', 'http://127.0.0.1:4000')
		const fetch = vi.fn().mockResolvedValue(json(products))
		vi.stubGlobal('fetch', fetch)
		const res = await get('products')
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual(products)
		expect(res.headers.get('cache-control')).toContain('no-store')
		expect(String(fetch.mock.calls[0][0])).toBe(
			'http://127.0.0.1:4000/api/products',
		)
	})

	it('fetches a single product by SKU', async () => {
		vi.stubEnv('COMMERCE_SERVER_URL', 'http://127.0.0.1:4000')
		const fetch = vi.fn().mockResolvedValue(json(products[0]))
		vi.stubGlobal('fetch', fetch)
		const res = await get('products/arc-lamp')
		expect(res.status).toBe(200)
		expect(await res.json()).toEqual(products[0])
		expect(String(fetch.mock.calls[0][0])).toBe(
			'http://127.0.0.1:4000/api/products/arc-lamp',
		)
	})

	it('passes through 404 for unknown SKUs', async () => {
		vi.stubEnv('COMMERCE_SERVER_URL', 'http://127.0.0.1:4000')
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue(json({ error: 'Product not found' }, 404)),
		)
		const res = await get('products/nope')
		expect(res.status).toBe(404)
		expect(await res.json()).toEqual({ error: 'Product not found' })
	})

	it('returns 502 instead of falling back to mocks when Express is down', async () => {
		vi.stubEnv('COMMERCE_SERVER_URL', 'http://127.0.0.1:4000')
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed')))
		const res = await get('products')
		expect(res.status).toBe(502)
		expect(await res.json()).toEqual({ error: 'Product service unavailable' })
	})

	it('returns 502 for upstream errors and malformed payloads', async () => {
		vi.stubEnv('COMMERCE_SERVER_URL', 'http://127.0.0.1:4000')
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({}, 500)))
		expect((await get('products')).status).toBe(502)
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json([{ id: 1 }])))
		expect((await get('products')).status).toBe(502)
		// A 404 on the list endpoint means misconfiguration, not a missing product.
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({}, 404)))
		expect((await get('products')).status).toBe(502)
	})
})
