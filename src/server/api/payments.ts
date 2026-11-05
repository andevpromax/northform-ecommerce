import { z } from 'zod'
import { StoredPaymentMethodSchema } from '@/shared/schemas/paymentMethods'
import { apiRequest } from './client'
import { getOrder, orderSchema } from './orders'

export const paymentSchema = z.object({
	outcome: z.enum(['success', 'failure']),
	idempotencyKey: z.string().uuid(),
})
export type PaymentInput = z.infer<typeof paymentSchema>

const paymentMethodsSchema = z.object({
	paymentMethods: z.array(
		z.object({
			type: z.string(),
			name: z.string(),
			isExternalPaymentMethod: z.boolean(),
		}),
	),
	storedPaymentMethodList: z.array(StoredPaymentMethodSchema),
})

export function getPaymentMethods() {
	return apiRequest('/api/payment-methods', { schema: paymentMethodsSchema })
}

// Simulated payment: the outcome is chosen by the shopper; no card data exists.
export function payOrder(
	sessionId: string,
	orderId: string,
	input: PaymentInput,
) {
	return apiRequest(`/api/orders/${encodeURIComponent(orderId)}/payments`, {
		method: 'POST',
		body: input,
		sessionId,
		schema: orderSchema,
	})
}

export async function getPaymentStatus(sessionId: string, orderId: string) {
	const order = await getOrder(sessionId, orderId)
	return { status: order.paymentStatus, attempts: order.attempts }
}
