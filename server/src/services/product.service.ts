import type { Db } from '../db/client.js'
import { toProductDto } from '../dto/product.dto.js'

export async function listProducts(db: Db) {
	const products = await db.product.findMany({ orderBy: { position: 'asc' } })
	return products.map(toProductDto)
}

export async function findProductBySku(db: Db, sku: string) {
	const product = await db.product.findUnique({ where: { sku } })
	return product && toProductDto(product)
}
