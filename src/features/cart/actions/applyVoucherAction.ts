export interface ApplyVoucherPayload {
	cartId: string
	voucherId: string
	locale: string
}
export async function applyVoucherAction(payload: ApplyVoucherPayload) {
	const r = await fetch('/api/cart/voucher', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	})
	if (!r.ok) throw new Error('Voucher unavailable')
	return r.json()
}
