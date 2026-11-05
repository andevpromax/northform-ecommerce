import { ok, route } from '@/app/api/_lib/route'
import { getOrder } from '@/server/api/orders'

export const GET = route<{ id: string }>(async ({ sessionId, params }) =>
	ok(await getOrder(sessionId, params.id)),
)
