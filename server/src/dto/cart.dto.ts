import { commerce } from '../config.js'
import { type Totals, toMajor } from '../services/pricing.js'

export type CartLine = {
	entryNumber: number
	sku: string
	name: string
	category: string
	imageUrl: string
	unitPriceCents: number
	quantity: number
	currency: string
}

export type AppliedVoucher = { code: string; description: string }

// Shape of the storefront CartDetailsResponseData (src/shared/schemas/cart.ts).
// Used both for live carts and for the cart snapshot stored on an order.
export function toCartDto(input: {
	cartId: string | null
	lines: CartLine[]
	totals: Totals
	voucher: AppliedVoucher | null
}) {
	const { cartId, lines, totals, voucher } = input
	return {
		cartId,
		subtotal: toMajor(totals.subtotalCents),
		VAT: toMajor(totals.vatCents),
		shippingPrice: toMajor(totals.shippingCents),
		totalPrice: toMajor(totals.totalCents),
		currencyISO: commerce.currency,
		referenceId: null,
		fiscalCode: null,
		totalNumberOfItems: lines.reduce((sum, line) => sum + line.quantity, 0),
		entries: lines.map((line) => ({
			entryNumber: line.entryNumber,
			quantity: line.quantity,
			totalPrice: {
				value: toMajor(line.unitPriceCents * line.quantity),
				currencyISO: line.currency,
			},
			product: {
				sku: line.sku,
				name: line.name,
				dimensions: line.category,
				price: {
					value: toMajor(line.unitPriceCents),
					currencyISO: line.currency,
				},
				discount: null,
				imageUrl: line.imageUrl,
			},
		})),
		orderDiscounts: toMajor(totals.discountCents),
		appliedVouchers: voucher
			? [
					{
						code: voucher.code,
						voucherCode: voucher.code,
						description: voucher.description,
						appliedValue: { value: toMajor(totals.discountCents) },
					},
				]
			: [],
	}
}

export type CartDto = ReturnType<typeof toCartDto>
