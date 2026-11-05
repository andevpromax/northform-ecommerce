// @vitest-environment node
import { afterEach, beforeEach, describe, it, expect } from 'vitest'
import { vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/product/add-to-cart/route'
import { GET as getCart } from '@/app/api/cart/route'
import { GET as unknownEndpoint } from '@/app/api/[...segments]/route'
import { type ExpressCall, installFakeExpress } from './fakeExpress'

const request = (path: string, body: unknown, cookie?: string) =>
	new NextRequest(`http://localhost/api/${path}`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			...(cookie ? { cookie } : {}),
		},
		body: JSON.stringify(body),
	})

let express: ExpressCall[]
beforeEach(() => {
	express = installFakeExpress()
})
afterEach(() => {
	vi.unstubAllEnvs()
	vi.unstubAllGlobals()
})

describe('Route contract', () => {
	it('validates body, exposes no-stack errors, and rejects cross-origin mutations', async () => {
		const invalid = await POST(
			request('product/add-to-cart', { sku: 'arc-lamp', quantity: -2 }),
		)
		expect(invalid.status).toBe(400)
		const req = request('product/add-to-cart', { sku: 'arc-lamp', quantity: 1 })
		req.headers.set('origin', 'https://untrusted.example')
		expect((await POST(req)).status).toBe(403)
		// Rejected at the HTTP boundary: the backend is never called.
		expect(express).toEqual([])
	})
	it('sets an HttpOnly session and returns the original cart envelope', async () => {
		const res = await POST(
			request('product/add-to-cart', { sku: 'arc-lamp', quantity: 1 }),
		)
		expect(res.status).toBe(200)
		expect(res.headers.get('set-cookie')).toContain('HttpOnly')
		const cookie = res.headers.get('set-cookie')!.split(';')[0]
		const c = await getCart(
			new NextRequest('http://localhost/api/cart', { headers: { cookie } }),
		)
		const body = await c.json()
		expect(body.success).toBe(true)
		expect(body.data.totalPrice).toBe(94)
		expect(c.headers.get('cache-control')).toContain('no-store')
		// The same guest session reached Express on both requests.
		const sessionId = cookie.split('=')[1]
		expect(express.map((call) => call.headers['x-session-id'])).toEqual([
			sessionId,
			sessionId,
		])
	})
	it('accepts a same-origin browser host behind Next URL normalization', async () => {
		const req = request('product/add-to-cart', { sku: 'arc-lamp', quantity: 1 })
		req.headers.set('host', '127.0.0.1:3100')
		req.headers.set('origin', 'http://127.0.0.1:3100')
		expect((await POST(req)).status).toBe(200)
	})

	it('handles malformed JSON and unknown endpoints', async () => {
		const req = new NextRequest('http://localhost/api/product/add-to-cart', {
			method: 'POST',
			body: '{',
		})
		expect((await POST(req)).status).toBe(400)
		expect(
			(await unknownEndpoint(new NextRequest('http://localhost/api/unknown')))
				.status,
		).toBe(404)
	})
})
