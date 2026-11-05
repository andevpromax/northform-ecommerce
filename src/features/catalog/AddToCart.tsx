'use client'
import useAddToCartMutation from '@/features/cart/hooks/mutations/useAddToCartMutation'
import { Button } from '@/shared/ui/actions-inputs/Button'
export function AddToCart({
	sku,
	available,
}: { sku: string; available: boolean }) {
	const { handleAddToCart, isPending } = useAddToCartMutation({
		sku,
		quantity: 1,
		locale: 'en-GB',
		successToastTitle: 'Added to your cart',
		errorToastTitle: 'Unable to add product. Check availability and try again.',
		successToastLink: { href: '/cart', label: 'View cart' },
	})
	return (
		<Button
			size="medium"
			className="w-full"
			disabled={!available || isPending}
			isLoading={isPending}
			onClick={handleAddToCart}
		>
			{available ? 'Add to cart' : 'Out of stock'}
		</Button>
	)
}
