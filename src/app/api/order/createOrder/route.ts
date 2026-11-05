import { ok, route } from '@/app/api/_lib/route'
import { createOrder, createOrderSchema } from '@/server/api/orders'

// The storefront order hook expects the original Hybris/Adyen envelope. The
// simulated flow always continues to /payment, hence resultCode "Pending".
export const POST = route(async ({ sessionId, body }) => {
	const order = await createOrder(sessionId, createOrderSchema.parse(body))
	return ok(
		{
			status: 'success',
			data: {
				order: { code: order.id, guid: order.id, status: order.status },
				adyen: { resultCode: 'Pending', action: null },
			},
		},
		201,
	)
})
