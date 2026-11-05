import { z } from 'zod'
import { customerSchema } from '@/features/checkout/schema'
import { cartDetailResponseDataSchema } from '@/shared/schemas/cart'
import { apiRequest } from './client'
import { ApiError } from './errors'

// Request contract of the storefront checkout. Other fields the order hook
// sends (locale, payment method details, any totals) are stripped.
export const createOrderSchema = z.object({
	customer: customerSchema,
	idempotencyKey: z.string().uuid(),
	paymentMethodType: z.literal('simulation'),
})
export type CreateOrderInput = z.infer<typeof createOrderSchema>

export const orderSchema = z.object({
	id: z.string().uuid(),
	createdAt: z.string(),
	customer: z.object({
		firstName: z.string(),
		lastName: z.string(),
		email: z.string(),
		streetAndNumber: z.string(),
		city: z.string(),
		zipCode: z.string(),
		country: z.string(),
	}),
	cart: cartDetailResponseDataSchema,
	status: z.enum(['awaiting_payment', 'payment_failed', 'confirmed']),
	paymentStatus: z.enum(['Pending', 'Refused', 'Authorised']),
	attempts: z.number().int(),
})
export type Order = z.infer<typeof orderSchema>

export function createOrder(sessionId: string, input: CreateOrderInput) {
	return apiRequest('/api/orders', {
		method: 'POST',
		body: input,
		sessionId,
		schema: orderSchema,
	})
}

// Orders are scoped to the session by the backend. The id is encoded so it can
// only ever address a single order resource.
export function getOrder(sessionId: string, orderId: string) {
	return apiRequest(`/api/orders/${encodeURIComponent(orderId)}`, {
		sessionId,
		schema: orderSchema,
	})
}

// Server Components: a missing order (or no session) is null; any other
// failure propagates to the error boundary instead of looking like a 404.
async function orNull<T>(request: Promise<T>): Promise<T | null> {
	try {
		return await request
	} catch (error) {
		if (error instanceof ApiError && error.status === 404) return null
		throw error
	}
}

export function findOrder(sessionId: string | null, orderId: string) {
	return sessionId ? orNull(getOrder(sessionId, orderId)) : null
}

export function getLatestOrder(sessionId: string) {
	return orNull(
		apiRequest('/api/orders/latest', { sessionId, schema: orderSchema }),
	)
}
