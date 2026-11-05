import { ok, route } from '@/app/api/_lib/route'
import { clearCart, getCart } from '@/server/api/cart'

export const GET = route(async ({ sessionId }) =>
	ok({ success: true, data: await getCart(sessionId) }),
)

export const DELETE = route(async ({ sessionId }) => {
	await clearCart(sessionId)
	return ok({ success: true })
})
