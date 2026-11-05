import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { products as frontendProducts } from '../../src/mocks/products.js'
import { expectContract } from './helpers/contract.js'
import { resetDatabase, useTestDb } from './helpers/db.js'
import { testApp } from './helpers/api.js'

const db = useTestDb()
const app = testApp(db)

beforeAll(() => resetDatabase(db))

describe('GET /health', () => {
	it('returns 200 with status ok', async () => {
		const res = await request(app).get('/health')
		expect(res.status).toBe(200)
		expect(res.body).toEqual({ status: 'ok' })
	})
})

describe('GET /api/products', () => {
	it('returns all 10 products from PostgreSQL as a bare JSON array', async () => {
		const res = await request(app).get('/api/products')
		expect(res.status).toBe(200)
		expect(res.headers['content-type']).toMatch(/application\/json/)
		expect(res.headers['cache-control']).toBe('no-store')
		expect(res.body).toHaveLength(10)
		expectContract(res, 'get', '/api/products')
	})

	it('matches the storefront product data, values and order', async () => {
		const res = await request(app).get('/api/products')
		expect(res.body).toEqual(frontendProducts)
	})

	it('reads from the database, not from bundled fixtures', async () => {
		await db.product.update({
			where: { sku: 'oak-tray' },
			data: { stock: 3 },
		})
		const res = await request(app).get('/api/products/oak-tray')
		expect(res.body.stock).toBe(3)
		await resetDatabase(db)
	})
})

describe('GET /api/products/:sku', () => {
	it('returns a single product as a bare JSON object', async () => {
		const res = await request(app).get('/api/products/arc-lamp')
		expect(res.status).toBe(200)
		expect(res.body).toEqual(frontendProducts[0])
		expectContract(res, 'get', '/api/products/{sku}')
	})

	it('returns unavailable products too', async () => {
		const res = await request(app).get('/api/products/woven-basket')
		expect(res.status).toBe(200)
		expect(res.body).toMatchObject({ available: false, stock: 0 })
	})

	it('returns 404 with the error envelope for unknown SKUs', async () => {
		const res = await request(app).get('/api/products/does-not-exist')
		expect(res.status).toBe(404)
		expect(res.body).toEqual({ error: 'Product not found' })
		expectContract(res, 'get', '/api/products/{sku}')
	})
})

describe('routing', () => {
	it('returns 404 JSON for unknown endpoints', async () => {
		const res = await request(app).get('/unknown')
		expect(res.status).toBe(404)
		expect(res.body).toEqual({ error: 'Endpoint not found' })
	})

	it('does not route nested paths to a product', async () => {
		const res = await request(app).get('/api/products/arc-lamp/extra')
		expect(res.status).toBe(404)
	})

	it('does not expose the x-powered-by header', async () => {
		const res = await request(app).get('/health')
		expect(res.headers['x-powered-by']).toBeUndefined()
	})
})
