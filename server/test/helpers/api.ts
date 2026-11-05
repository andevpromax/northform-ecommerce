import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { createApp } from '../../src/app.js'
import type { Db } from '../../src/db/client.js'

export const customer = {
	firstName: 'Alex',
	lastName: 'Taylor',
	email: 'alex@example.test',
	streetAndNumber: '12 Example Street',
	city: 'London',
	zipCode: 'SW1A 1AA',
	country: 'United Kingdom',
}

type App = ReturnType<typeof createApp>

// A guest with its own session, as the storefront would forward it.
export function guest(app: App, sessionId: string = randomUUID()) {
	const withSession = (req: request.Test) => req.set('X-Session-Id', sessionId)
	return {
		sessionId,
		get: (url: string) => withSession(request(app).get(url)),
		delete: (url: string) => withSession(request(app).delete(url)),
		post: (url: string, body?: object) =>
			withSession(request(app).post(url)).send(body),
		put: (url: string, body?: object) =>
			withSession(request(app).put(url)).send(body),
		patch: (url: string, body?: object) =>
			withSession(request(app).patch(url)).send(body),
		addItem: (sku: string, quantity = 1) =>
			withSession(request(app).post('/api/cart/items')).send({ sku, quantity }),
		createOrder: (idempotencyKey: string = randomUUID(), body = {}) =>
			withSession(request(app).post('/api/orders')).send({
				customer,
				idempotencyKey,
				paymentMethodType: 'simulation',
				...body,
			}),
		pay: (
			orderId: string,
			outcome: 'success' | 'failure',
			idempotencyKey: string = randomUUID(),
		) =>
			withSession(request(app).post(`/api/orders/${orderId}/payments`)).send({
				outcome,
				idempotencyKey,
			}),
	}
}

export const testApp = (db: Db, internalToken?: string) =>
	createApp({ db, internalToken })
