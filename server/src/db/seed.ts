import { products } from '../data/products.js'
import type { Db } from './client.js'

export const demoVoucher = {
	code: 'DEMO10',
	description: '10% demo discount',
	discountType: 'PERCENTAGE',
	discountValue: 10,
	active: true,
} as const

// Idempotent: upserts the fixture catalogue and the demo voucher, so running it
// again restores the reference data without touching carts or orders.
export async function seed(db: Db) {
	await db.$transaction(async (tx) => {
		for (const [position, p] of products.entries()) {
			const data = {
				sku: p.sku,
				position,
				name: p.name,
				description: p.description,
				priceCents: Math.round(p.price * 100),
				currency: p.currency,
				category: p.category,
				image: p.image,
				available: p.available,
				stock: p.stock,
			}
			await tx.product.upsert({
				where: { id: p.id },
				create: { id: p.id, ...data },
				update: data,
			})
		}
		await tx.voucher.upsert({
			where: { code: demoVoucher.code },
			create: demoVoucher,
			update: demoVoucher,
		})
	})
	return { products: products.length, vouchers: 1 }
}
