export interface RemoveVoucherPayload {
	cartId: string
	voucherId: string
	locale: string
}
export async function removeVoucherAction(payload: RemoveVoucherPayload) {
	const r = await fetch('/api/cart/voucher', {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	})
	if (!r.ok) throw new Error('Voucher unavailable')
	return r.json()
}
