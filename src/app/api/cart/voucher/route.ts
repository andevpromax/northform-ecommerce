import { ok, route } from '@/app/api/_lib/route'
import { applyVoucher, removeVoucher, voucherSchema } from '@/server/api/cart'

export const POST = route(async ({ sessionId, body }) => {
	const { voucherId } = voucherSchema.parse(body)
	await applyVoucher(sessionId, voucherId)
	return ok({ success: true })
})

// The storefront sends the code being removed; a cart holds at most one.
export const DELETE = route(async ({ sessionId, body }) => {
	voucherSchema.parse(body)
	await removeVoucher(sessionId)
	return ok({ success: true })
})
