import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'
import { createDb } from '../src/db/client.js'
import { guest, testApp } from './helpers/api.js'
import { expectContract } from './helpers/contract.js'
import { resetDatabase, useTestDb } from './helpers/db.js'

const db = useTestDb()
const app = testApp(db)

beforeEach(() => resetDatabase(db))

describe('X-Session-Id', () => {
	it.each([
		['missing', undefined],
		['not a UUID', 'session-123'],
		['empty', ''],
	])('rejects a %s header with 400', async (_name, value) => {
		const req = request(app).get('/api/cart')
		const res = await (value === undefined
			? req
			: req.set('X-Session-Id', value))
		expect(res.status).toBe(400)
		expect(res.body).toEqual({
			error: 'Missing or invalid X-Session-Id header',
		})
		expectContract(res, 'get', '/api/cart')
	})

	it('isolates carts between sessions', async () => {
		const alice = guest(app)
		const bob = guest(app)
		await alice.addItem('arc-lamp', 2)
		await bob.addItem('oak-tray', 1)
		expect((await alice.get('/api/cart')).body.entries[0].product.sku).toBe(
			'arc-lamp',
		)
		expect((await bob.get('/api/cart')).body.entries[0].product.sku).toBe(
			'oak-tray',
		)
		// Bob cannot change Alice's line by position.
		await bob.delete('/api/cart/items/0')
		expect((await alice.get('/api/cart')).body.totalNumberOfItems).toBe(2)
	})

	it('treats UUID casing as the same session', async () => {
		const id = randomUUID()
		await guest(app, id.toUpperCase()).addItem('arc-lamp')
		expect(
			(await guest(app, id).get('/api/cart')).body.totalNumberOfItems,
		).toBe(1)
	})
})

describe('X-Internal-Token', () => {
	const token = 'internal-token-for-tests-0123456789abcdef'
	const secured = testApp(db, token)

	it.each([
		['/api/cart', 'get', '/api/cart'],
		['/api/payment-methods', 'get', '/api/payment-methods'],
		['/api/orders/latest', 'get', '/api/orders/latest'],
	])('protects %s when configured', async (url, method, path) => {
		const missing = await request(secured)
			.get(url)
			.set('X-Session-Id', randomUUID())
		expect(missing.status).toBe(401)
		expect(missing.body).toEqual({ error: 'Unauthorized' })
		expectContract(missing, method, path)
		const wrong = await request(secured)
			.get(url)
			.set('X-Session-Id', randomUUID())
			.set('X-Internal-Token', `${token}x`)
		expect(wrong.status).toBe(401)
	})

	it('accepts the configured token', async () => {
		const res = await request(secured)
			.post('/api/cart/items')
			.set('X-Session-Id', randomUUID())
			.set('X-Internal-Token', token)
			.send({ sku: 'arc-lamp', quantity: 1 })
		expect(res.status).toBe(200)
		expect(JSON.stringify(res.body)).not.toContain(token)
	})

	it('checks the token before the session header', async () => {
		const res = await request(secured).get('/api/cart')
		expect(res.status).toBe(401)
	})

	it('leaves the public catalogue, health and docs open', async () => {
		expect((await request(secured).get('/api/products')).status).toBe(200)
		expect((await request(secured).get('/health')).status).toBe(200)
		expect((await request(secured).get('/openapi.json')).status).toBe(200)
	})
})

describe('request parsing and errors', () => {
	it('rejects malformed JSON with 400', async () => {
		const res = await request(app)
			.post('/api/cart/items')
			.set('X-Session-Id', randomUUID())
			.set('Content-Type', 'application/json')
			.send('{"sku": "arc-lamp",')
		expect(res.status).toBe(400)
		expect(res.body).toEqual({ error: 'Invalid JSON' })
		expectContract(res, 'post', '/api/cart/items')
	})

	it('rejects bodies over 16 KB with 413', async () => {
		const res = await guest(app).post('/api/cart/items', {
			sku: 'arc-lamp',
			quantity: 1,
			padding: 'x'.repeat(17_000),
		})
		expect(res.status).toBe(413)
		expect(res.body).toEqual({ error: 'Request too large' })
		expectContract(res, 'post', '/api/cart/items')
	})

	it('rejects non-JSON bodies as invalid requests', async () => {
		const res = await request(app)
			.post('/api/cart/items')
			.set('X-Session-Id', randomUUID())
			.type('form')
			.send('sku=arc-lamp&quantity=1')
		expect(res.status).toBe(400)
	})

	it('describes validation failures without echoing input', async () => {
		const res = await guest(app).post('/api/cart/items', {
			sku: 'arc-lamp',
			quantity: 500,
		})
		expect(res.body).toEqual({
			error: 'Invalid request',
			details: [
				{
					path: 'quantity',
					message: 'Number must be less than or equal to 99',
				},
			],
		})
	})

	it('returns 404 for unsupported methods', async () => {
		expect((await guest(app).put('/api/cart/items', {})).status).toBe(404)
		expect((await request(app).post('/api/products')).status).toBe(404)
	})

	it('hides internal errors behind a generic 500', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		const unreachable = createDb('postgresql://nobody:secret@127.0.0.1:1/none')
		const broken = createApp({ db: unreachable })
		const res = await request(broken).get('/api/products')
		expect(res.status).toBe(500)
		expect(res.body).toEqual({ error: 'Unexpected server error' })
		expect(JSON.stringify(res.body)).not.toContain('secret')
		await unreachable.$disconnect()
		error.mockRestore()
	})
})
