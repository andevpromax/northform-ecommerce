import { z } from 'zod'
import { cartDetailResponseDataSchema } from '@/shared/schemas/cart'
import { apiRequest } from './client'

const quantitySchema = z.number().int().min(1).max(99)

// Request contracts of the storefront cart routes. `locale` and `cartId` are
// sent by the client but not used, so they are stripped.
export const addCartItemSchema = z.object({
	sku: z.string().min(1).max(80),
	quantity: quantitySchema,
})
export const updateCartItemSchema = z.object({
	entryNumber: z.number().int().nonnegative(),
	quantity: quantitySchema,
})
export const removeCartItemSchema = z.object({
	entryNumber: z.number().int().nonnegative(),
})
// Same format rule as the coupon form. Whether a code exists, is active and
// unexpired is decided by the backend.
export const voucherSchema = z.object({
	voucherId: z
		.string()
		.trim()
		.min(1)
		.max(50)
		.regex(/^[a-zA-Z0-9\-+]*$/),
})

export type AddCartItemInput = z.infer<typeof addCartItemSchema>
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>
export type RemoveCartItemInput = z.infer<typeof removeCartItemSchema>
export type Cart = z.infer<typeof cartDetailResponseDataSchema>

// Every cart operation returns the updated cart with server-calculated totals.
const cartRequest = (
	sessionId: string,
	path: string,
	init: {
		method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
		body?: unknown
	} = {},
) =>
	apiRequest(path, { ...init, sessionId, schema: cartDetailResponseDataSchema })

export function getCart(sessionId: string) {
	return cartRequest(sessionId, '/api/cart')
}

export function clearCart(sessionId: string) {
	return cartRequest(sessionId, '/api/cart', { method: 'DELETE' })
}

export function addCartItem(sessionId: string, input: AddCartItemInput) {
	return cartRequest(sessionId, '/api/cart/items', {
		method: 'POST',
		body: input,
	})
}

export function updateCartItem(sessionId: string, input: UpdateCartItemInput) {
	return cartRequest(sessionId, `/api/cart/items/${input.entryNumber}`, {
		method: 'PATCH',
		body: { quantity: input.quantity },
	})
}

export function removeCartItem(sessionId: string, input: RemoveCartItemInput) {
	return cartRequest(sessionId, `/api/cart/items/${input.entryNumber}`, {
		method: 'DELETE',
	})
}

export function applyVoucher(sessionId: string, code: string) {
	return cartRequest(sessionId, '/api/cart/voucher', {
		method: 'PUT',
		body: { code },
	})
}

export function removeVoucher(sessionId: string) {
	return cartRequest(sessionId, '/api/cart/voucher', { method: 'DELETE' })
}
