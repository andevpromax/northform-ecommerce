import { ok, route } from '@/app/api/_lib/route'
import { updateCartItem, updateCartItemSchema } from '@/server/api/cart'

export const POST = route(async ({ sessionId, body }) => {
	await updateCartItem(sessionId, updateCartItemSchema.parse(body))
	return ok({ success: true })
})
