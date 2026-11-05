import { Router } from 'express'
import type { Db } from '../db/client.js'
import { sessionIdOf } from '../middleware/session.js'
import { createOrderBody, paymentBody } from '../schemas/order.schemas.js'
import {
	createOrder,
	getLatestOrder,
	getOrder,
} from '../services/order.service.js'
import { payOrder } from '../services/payment.service.js'

export function createOrdersRouter(db: Db) {
	const router = Router()

	router.post('/', async (req, res) => {
		const input = createOrderBody.parse(req.body)
		const { created, order } = await createOrder(db, sessionIdOf(res), input)
		res.status(created ? 201 : 200).json(order)
	})

	// Registered before /:orderId so "latest" is not treated as an id.
	router.get('/latest', async (_req, res) => {
		res.json(await getLatestOrder(db, sessionIdOf(res)))
	})

	router.get('/:orderId', async (req, res) => {
		res.json(await getOrder(db, sessionIdOf(res), req.params.orderId))
	})

	router.post('/:orderId/payments', async (req, res) => {
		const input = paymentBody.parse(req.body)
		res.json(await payOrder(db, sessionIdOf(res), req.params.orderId, input))
	})

	return router
}
