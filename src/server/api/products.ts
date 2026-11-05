import { z } from 'zod'
import { apiRequest } from './client'
import { ApiError } from './errors'

const productSchema = z.object({
	id: z.string(),
	sku: z.string(),
	name: z.string(),
	description: z.string(),
	price: z.number(),
	currency: z.string(),
	category: z.string(),
	image: z.string(),
	available: z.boolean(),
	stock: z.number(),
})

export type ProductResponse = z.infer<typeof productSchema>

export function getProducts() {
	return apiRequest('/api/products', {
		service: 'Product',
		schema: z.array(productSchema),
	})
}

export async function getProduct(sku: string) {
	// An empty SKU would address the list endpoint.
	if (!sku) throw new ApiError('Product not found', 404)
	return apiRequest(`/api/products/${encodeURIComponent(sku)}`, {
		service: 'Product',
		schema: productSchema,
	})
}
