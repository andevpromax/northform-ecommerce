import { z } from 'zod'
import { commerce } from '../config.js'

export const quantitySchema = z.number().int().min(1).max(commerce.maxQuantity)

export const addItemBody = z.object({
	sku: z.string().min(1).max(80),
	quantity: quantitySchema,
})

export const setQuantityBody = z.object({ quantity: quantitySchema })

export const entryNumberParams = z.object({
	entryNumber: z.coerce.number().int().nonnegative(),
})

// Same rule as the storefront coupon form.
export const voucherBody = z.object({
	code: z
		.string()
		.trim()
		.min(1)
		.max(50)
		.regex(/^[a-zA-Z0-9\-+]*$/),
})
