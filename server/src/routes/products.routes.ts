import { Router } from 'express'
import type { Db } from '../db/client.js'
import { notFound } from '../errors.js'
import { findProductBySku, listProducts } from '../services/product.service.js'

export function createProductsRouter(db: Db) {
	const router = Router()

	router.get('/', async (_req, res) => {
		res.json(await listProducts(db))
	})

	router.get('/:sku', async (req, res) => {
		const product = await findProductBySku(db, req.params.sku)
		if (!product) throw notFound('Product not found')
		res.json(product)
	})

	return router
}
