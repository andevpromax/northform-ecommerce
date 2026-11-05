import { z } from 'zod'

/**
 * Common `order` object used in both responses
 */
const orderSchema = z.object({
	code: z.string().nullable(),
	guid: z.string().nullable(),
	status: z.string().nullable(),
})

/**
 * Adyen result codes:
 * - Authorised: Payment successfully authorised
 * - Pending: Payment initiated, outcome not yet known (async processing)
 * - Received: Payment received, processing not yet complete
 * - RedirectShopper: Shopper needs to be redirected for authentication
 * - IdentifyShopper: Additional identification needed
 * - ChallengeShopper: 3DS challenge required
 * - Refused: Payment was refused
 * - Cancelled: Payment was cancelled by shopper
 * - Error: An error occurred during payment processing
 */
export const createOrderResponseSchema = z.object({
	order: orderSchema,
	adyen: z.object({
		resultCode: z.enum([
			'Authorised',
			'Pending',
			'Received',
			'RedirectShopper',
			'IdentifyShopper',
			'ChallengeShopper',
			'Refused',
			'Cancelled',
			'Error',
		]),
		refusalReasonCode: z.string().regex(/^\d+$/).nullish(),
		action: z
			.object({
				type: z.string().nullable(), // Can be 'redirect', 'threeDS2', 'voucher', 'qrCode', etc.
				method: z.enum(['GET', 'POST']).nullable(),
				url: z.string().url().nullable(),
				data: z.record(z.unknown()).optional(), // Flexible data structure for various action types
			})
			.nullable(),
	}),
})

export type CreateOrderResponse = z.infer<typeof createOrderResponseSchema>
