import { commerce } from '../config.js'

export type PricedLine = { unitPriceCents: number; quantity: number }
export type Discount = {
	discountType: 'PERCENTAGE' | 'FIXED'
	discountValue: number
}
export type Totals = {
	subtotalCents: number
	discountCents: number
	shippingCents: number
	vatCents: number
	totalCents: number
}

// All amounts are integer cents. Mirrors the in-memory Next.js implementation:
// flat shipping on non-empty carts, and VAT included in (subtotal - discount).
export function calculateTotals(
	lines: PricedLine[],
	discount: Discount | null,
): Totals {
	const subtotalCents = lines.reduce(
		(sum, line) => sum + line.unitPriceCents * line.quantity,
		0,
	)
	const discountCents = !discount
		? 0
		: discount.discountType === 'PERCENTAGE'
			? Math.round((subtotalCents * discount.discountValue) / 100)
			: Math.min(discount.discountValue, subtotalCents)
	const shippingCents = subtotalCents > 0 ? commerce.shippingCents : 0
	const vatCents = Math.round(
		((subtotalCents - discountCents) * commerce.vatRatePercent) /
			(100 + commerce.vatRatePercent),
	)
	return {
		subtotalCents,
		discountCents,
		shippingCents,
		vatCents,
		totalCents: subtotalCents - discountCents + shippingCents,
	}
}

export const toMajor = (cents: number) => cents / 100
