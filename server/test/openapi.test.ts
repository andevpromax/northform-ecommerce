import SwaggerParser from '@apidevtools/swagger-parser'
import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { openApiDocument } from '../src/docs/openapi.js'
import { testApp } from './helpers/api.js'
import {
	type ResponseObject,
	type Schema,
	resolveResponse,
	validate,
} from './helpers/contract.js'
import { resetDatabase, useTestDb } from './helpers/db.js'

const db = useTestDb()
const app = testApp(db)

beforeAll(() => resetDatabase(db))

type Operation = {
	responses: Record<string, ResponseObject>
	requestBody?: {
		content: Record<string, { schema: Schema; example?: unknown }>
	}
	security?: object[]
}
const paths = openApiDocument.paths as unknown as Record<
	string,
	Record<string, Operation>
>

const operations = Object.entries(paths).flatMap(([path, methods]) =>
	Object.entries(methods).map(([method, operation]) => ({
		id: `${method.toUpperCase()} ${path}`,
		operation,
	})),
)

describe('GET /openapi.json', () => {
	it('returns a valid OpenAPI 3.0.3 document', async () => {
		const res = await request(app).get('/openapi.json')
		expect(res.status).toBe(200)
		expect(res.body.openapi).toBe('3.0.3')
		expect(res.body).toEqual(openApiDocument)
		// validate() dereferences in place, so give it a copy.
		await expect(
			SwaggerParser.validate(structuredClone(res.body)),
		).resolves.toBeDefined()
	})

	it('documents exactly the 15 implemented endpoints', () => {
		expect(operations.map((o) => o.id).sort()).toEqual([
			'DELETE /api/cart',
			'DELETE /api/cart/items/{entryNumber}',
			'DELETE /api/cart/voucher',
			'GET /api/cart',
			'GET /api/orders/latest',
			'GET /api/orders/{orderId}',
			'GET /api/payment-methods',
			'GET /api/products',
			'GET /api/products/{sku}',
			'GET /health',
			'PATCH /api/cart/items/{entryNumber}',
			'POST /api/cart/items',
			'POST /api/orders',
			'POST /api/orders/{orderId}/payments',
			'PUT /api/cart/voucher',
		])
	})

	it('declares session security on every cart and order operation', () => {
		for (const { id, operation } of operations)
			if (/\/api\/(cart|orders)/.test(id))
				expect(operation.security, id).toContainEqual({ sessionId: [] })
	})

	it.each(operations.map((o) => [o.id, o.operation] as const))(
		'%s examples conform to their schemas',
		(_id, operation) => {
			for (const response of Object.values(operation.responses)) {
				const media = resolveResponse(response).content?.['application/json']
				if (!media) continue
				const examples = [
					...(media.example === undefined ? [] : [media.example]),
					...Object.values(media.examples ?? {}).map((e) => e.value),
				]
				for (const example of examples)
					expect(validate(media.schema, example)).toEqual([])
			}
			const body = operation.requestBody?.content['application/json']
			if (body?.example !== undefined)
				expect(validate(body.schema, body.example)).toEqual([])
		},
	)
})

describe('contract validator', () => {
	it('rejects payloads that drift from the documented schemas', () => {
		const product = { $ref: '#/components/schemas/Product' }
		const cart = { $ref: '#/components/schemas/Cart' }
		expect(validate(product, { id: 'x' })).not.toEqual([])
		expect(validate(cart, { cartId: 'not-a-uuid' })).toContain(
			'$.cartId: not a uuid',
		)
		expect(
			validate({ $ref: '#/components/schemas/Order' }, { status: 'shipped' }),
		).toContain('$.status: "shipped" not in enum')
		expect(validate(cart, { sessionId: 'leak' })).toContain(
			'$.sessionId: not documented',
		)
	})
})

describe('GET /api-docs', () => {
	it('serves the Swagger UI page', async () => {
		const res = await request(app).get('/api-docs/')
		expect(res.status).toBe(200)
		expect(res.headers['content-type']).toMatch(/text\/html/)
		expect(res.text).toContain('swagger-ui')
	})

	it('redirects the bare path to the UI', async () => {
		const res = await request(app).get('/api-docs').redirects(1)
		expect(res.status).toBe(200)
		expect(res.text).toContain('swagger-ui')
	})

	it('serves the UI assets and embeds the spec with persisted authorization', async () => {
		const bundle = await request(app).get('/api-docs/swagger-ui-bundle.js')
		expect(bundle.status).toBe(200)
		const init = await request(app).get('/api-docs/swagger-ui-init.js')
		expect(init.status).toBe(200)
		expect(init.text).toContain('"/api/orders/{orderId}/payments"')
		expect(init.text).toContain('"persistAuthorization": true')
	})
})
