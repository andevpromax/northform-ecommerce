import { ok, route } from '@/app/api/_lib/route'
import { getLatestOrder } from '@/server/api/orders'

export const GET = route(async ({ sessionId }) =>
	ok(await getLatestOrder(sessionId)),
)
