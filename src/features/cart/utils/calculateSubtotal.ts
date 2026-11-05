import type { CartEntry } from '@/shared/schemas/cart'

// TODO: Remove once BE provides correct subtotal value
export function calculateSubtotal(entries: CartEntry[]): number {
	return entries.reduce((sum, entry) => {
		return sum + entry.totalPrice.value
	}, 0)
}
