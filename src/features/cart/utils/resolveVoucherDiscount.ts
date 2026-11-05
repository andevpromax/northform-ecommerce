import type {
	CartAppliedPromotionItem,
	CartAppliedVoucher,
} from '@/shared/schemas/cart'
import { formatPriceWithLocale } from '@/shared/utils/formatPriceWithLocale'

/**
 * Given a voucher and both promotion arrays, finds the matching promotion via
 * `promotion.voucherCodes === voucher.voucherCode` and returns a formatted
 * discount string, or `null` when no match / no discount info is available.
 *
 * Examples:
 *   PERCENTAGE + discount "10"  → "-10%"
 *   FIXED      + discount "200" → "-€200.00" (locale-formatted)
 */
export function resolveVoucherDiscount(
	voucher: CartAppliedVoucher,
	promotions: CartAppliedPromotionItem[],
	currencyISO: string,
	locale?: string,
): string | null {
	const match = promotions.find(
		(p) =>
			p.promotion?.voucherCodes != null &&
			p.promotion.voucherCodes === voucher.voucherCode,
	)

	if (!match?.promotion) return null

	const { promotionType, discount } = match.promotion

	if (!discount) return null

	const normalizedType = promotionType?.toLowerCase()

	if (normalizedType === 'percentage') {
		return `-${discount}%`
	}

	if (normalizedType === 'fixed') {
		const formatted = formatPriceWithLocale(
			Number(discount),
			currencyISO,
			locale,
		)
		return `-${formatted}`
	}

	return null
}
