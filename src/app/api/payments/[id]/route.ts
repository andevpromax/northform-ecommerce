import { ok, route } from '@/app/api/_lib/route'
import {
	getPaymentStatus,
	payOrder,
	paymentSchema,
} from '@/server/api/payments'

export const POST = route<{ id: string }>(async ({ sessionId, params, body }) =>
	ok(await payOrder(sessionId, params.id, paymentSchema.parse(body))),
)

export const GET = route<{ id: string }>(async ({ sessionId, params }) =>
	ok(await getPaymentStatus(sessionId, params.id)),
)
