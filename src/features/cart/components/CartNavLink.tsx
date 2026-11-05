'use client'

import Link from 'next/link'
import { useCartDetailsQuery } from '@/features/cart/hooks/queries/useCartDetailsQuery'
import { IconShoppingCart16 } from '@/shared/icons/icons/neo-16x16/shopping-cart-16'

// Header cart link with the total quantity. It reads the same ['cart', locale]
// query as the cart and checkout pages, so the count is the server cart and is
// refreshed by every cart mutation that invalidates that query. While loading
// or on error it shows no count rather than a guess.
export function CartNavLink() {
	const { data } = useCartDetailsQuery()
	const count = data?.data?.totalNumberOfItems ?? 0

	const items = `${count} ${count === 1 ? 'item' : 'items'}`
	// The accessible name comes from the content: "Cart" plus visually hidden
	// " (5 items)", so it reads "Cart (5 items)". The badge is the
	// visual rendering of the same count and is hidden from assistive tech.
	return (
		<Link href="/cart" className="inline-flex min-h-6 items-center gap-1.5">
			<IconShoppingCart16 size="5" />
			<span>
				Cart
				{count > 0 && <span className="sr-only"> ({items})</span>}
			</span>
			{count > 0 && (
				<span
					aria-hidden
					data-testid="cart-count"
					className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-800 px-1.5 text-xs font-semibold leading-none text-white"
				>
					{count > 99 ? '99+' : count}
				</span>
			)}
		</Link>
	)
}
