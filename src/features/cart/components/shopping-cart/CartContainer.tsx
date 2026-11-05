'use client'

import { useCartDetailsQuery } from '@/features/cart/hooks/queries/useCartDetailsQuery'
import type { LinkValue, StringValue } from '@/shared/cms/types/fields'
import { GeneralErrorAlert } from '@/shared/ui-shared/components/GeneralErrorAlert'
import { useCjCartEvent } from '@/features/tracking/cjAffiliate/hooks/useCjCartEvent'
import CartClient from '@/features/cart/components/shopping-cart/CartClient'
import CartSkeleton from '@/features/cart/components/shopping-cart/CartSkeleton'
import EmptyShoppingCart from '@/features/cart/components/shopping-cart/EmptyShoppingCart'

export const CartContainer = ({
	title,
	shippingLabel,
	vatLabel,
	linkToProductListingPage,
	pdpLink,
	pageEditing,
	proceedToCheckoutLink,
	emptyCartHeadingText,
	emptyCartText,
	maxQuantity = 99,
}: {
	title: string
	shippingLabel: object
	vatLabel: string
	linkToProductListingPage: LinkValue
	pdpLink: string
	pageEditing?: boolean | null
	proceedToCheckoutLink?: LinkValue
	emptyCartHeadingText: StringValue
	emptyCartText: StringValue
	maxQuantity?: number
}) => {
	const {
		data: cartData,
		isLoading,
		isError,
		isSuccess,
	} = useCartDetailsQuery()
	useCjCartEvent(cartData?.data)

	if (isLoading) {
		return <CartSkeleton />
	}

	if (isError) {
		return <GeneralErrorAlert />
	}

	if (!cartData?.data?.entries?.length) {
		return (
			<EmptyShoppingCart
				emptyCartHeadingText={emptyCartHeadingText}
				emptyCartText={emptyCartText}
				linkToProductListingPage={linkToProductListingPage}
				pageEditing={pageEditing}
			/>
		)
	}
	if (isSuccess && cartData?.data?.entries?.length) {
		return (
			<CartClient
				title={title}
				shippingLabel={shippingLabel}
				vatLabel={vatLabel}
				linkToProductListingPage={linkToProductListingPage}
				pdpLink={pdpLink}
				pageEditing={pageEditing}
				proceedToCheckoutLink={proceedToCheckoutLink}
				cartData={cartData}
				maxQuantity={maxQuantity}
			/>
		)
	}
}
