import { ok, route } from '@/app/api/_lib/route'
import { addCartItem, addCartItemSchema } from '@/server/api/cart'

// Legacy response: the added line plus the cart ID, which the storefront keeps
// in its anonymous-cart cookie. The cart ID is never the session ID.
export const POST = route(async ({ sessionId, body }) => {
	const input = addCartItemSchema.parse(body)
	const cart = await addCartItem(sessionId, input)
	return ok({ success: true, cartId: cart.cartId, isAnonymous: true, ...input })
})
