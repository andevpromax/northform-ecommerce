import type { Product } from '../generated/prisma/client.js'
import { toMajor } from '../services/pricing.js'

export const toProductDto = (p: Product) => ({
	id: p.id,
	sku: p.sku,
	name: p.name,
	description: p.description,
	price: toMajor(p.priceCents),
	currency: p.currency,
	category: p.category,
	image: p.image,
	available: p.available,
	stock: p.stock,
})

export type ProductDto = ReturnType<typeof toProductDto>
