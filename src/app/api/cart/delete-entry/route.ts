import { ok, route } from '@/app/api/_lib/route'
import { removeCartItem, removeCartItemSchema } from '@/server/api/cart'

export const POST = route(async ({ sessionId, body }) => {
	await removeCartItem(sessionId, removeCartItemSchema.parse(body))
	return ok({ success: true })
})
