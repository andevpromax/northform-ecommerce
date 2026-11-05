import { Router } from 'express'
import type { Db } from '../db/client.js'
import { sessionIdOf } from '../middleware/session.js'
import {
	addItemBody,
	entryNumberParams,
	setQuantityBody,
	voucherBody,
} from '../schemas/cart.schemas.js'
import {
	addItem,
	applyVoucher,
	clearCart,
	getCart,
	removeItem,
	removeVoucher,
	setItemQuantity,
} from '../services/cart.service.js'

export function createCartRouter(db: Db) {
	const router = Router()

	router.get('/', async (_req, res) => {
		res.json(await getCart(db, sessionIdOf(res)))
	})

	router.delete('/', async (_req, res) => {
		res.json(await clearCart(db, sessionIdOf(res)))
	})

	router.post('/items', async (req, res) => {
		res.json(await addItem(db, sessionIdOf(res), addItemBody.parse(req.body)))
	})

	router.patch('/items/:entryNumber', async (req, res) => {
		const { entryNumber } = entryNumberParams.parse(req.params)
		const { quantity } = setQuantityBody.parse(req.body)
		res.json(await setItemQuantity(db, sessionIdOf(res), entryNumber, quantity))
	})

	router.delete('/items/:entryNumber', async (req, res) => {
		const { entryNumber } = entryNumberParams.parse(req.params)
		res.json(await removeItem(db, sessionIdOf(res), entryNumber))
	})

	router.put('/voucher', async (req, res) => {
		const { code } = voucherBody.parse(req.body)
		res.json(await applyVoucher(db, sessionIdOf(res), code))
	})

	router.delete('/voucher', async (_req, res) => {
		res.json(await removeVoucher(db, sessionIdOf(res)))
	})

	return router
}
