import { z } from 'zod'
import { customerSchema } from './customer.schema.js'

// Unknown keys (client totals, prices, card fields) are stripped.
export const createOrderBody = z.object({
	customer: customerSchema,
	idempotencyKey: z.string().uuid(),
	paymentMethodType: z.literal('simulation'),
})

export type CreateOrderInput = z.infer<typeof createOrderBody>

export const paymentBody = z.object({
	outcome: z.enum(['success', 'failure']),
	idempotencyKey: z.string().uuid(),
})

export type PaymentInput = z.infer<typeof paymentBody>

export const orderIdSchema = z.string().uuid()
