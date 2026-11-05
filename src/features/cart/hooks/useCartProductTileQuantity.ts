'use client'

import { useAnnouncer } from '@/features/feedback/announcer/AnnouncerProvider'
import { useLocaleParts } from '@/shared/hooks/useLocaleParts'
import type { CartDetailsResponse, CartEntry } from '@/shared/schemas/cart'
import type { ProductPriceUpdated } from '@/shared/schemas/product'
import { compose } from '@/shared/schemas/utils/compose'
import {
	ecommerceEventForQuantityDelta,
	mapCartEntryToItem,
} from '@/features/tracking/ecommerce/mappers'
import { sendEcommerceEvent } from '@/features/tracking/ecommerce/sendEcommerceEvent'
import type { EcommerceProductFields } from '@/features/tracking/ecommerce/types'
import { formatPriceWithLocale } from '@/shared/utils/formatPriceWithLocale'
import { roundMoney } from '@/shared/utils/roundMoney'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useT } from 'talkr'
import { useChangeCartEntryQuantityMutation } from '@/features/cart/hooks/mutations/useChangeCartEntryQuantity'

interface UseCartProductTileQuantityOptions {
	step?: number
	min?: number
	ecommerceTracking?: {
		cartEntry: CartEntry
		lineIndex: number
		productFields: EcommerceProductFields | null
		pricing: ProductPriceUpdated | undefined
	}
}

export function useCartProductTileQuantity(
	entryNumber: number,
	currentQuantity: number,
	{
		step: _step = 1,
		min = 1,
		ecommerceTracking,
	}: UseCartProductTileQuantityOptions = {},
) {
	const [openModalDeleteItem, setOpenModalDeleteItem] = useState(false)
	const { T } = useT()
	const { announce } = useAnnouncer()
	const queryClient = useQueryClient()
	const { raw: locale } = useLocaleParts()

	const { mutate, isPending } = useChangeCartEntryQuantityMutation({
		entryNumber,
	})

	const handleCartQuantityChange = (value: number) => {
		if (value < min) {
			setOpenModalDeleteItem(true)
		} else if (!isPending) {
			mutate(value, {
				onSuccess: () => {
					const delta = value - currentQuantity
					const eventName = ecommerceEventForQuantityDelta(delta)

					if (eventName && ecommerceTracking) {
						const { cartEntry, lineIndex, productFields, pricing } =
							ecommerceTracking
						const baseItem = mapCartEntryToItem(cartEntry, {
							index: lineIndex,
							productFields,
							pricing,
						})
						const absDelta = Math.abs(delta)
						const item = { ...baseItem, quantity: absDelta }
						const currency = item.currency ?? 'EUR'
						const eventValue = roundMoney(item.price * absDelta)

						sendEcommerceEvent({
							event: eventName,
							ecommerce: { currency, value: eventValue, items: [item] },
						})
					}

					const cartData = queryClient.getQueryData<CartDetailsResponse>([
						'cart',
						locale,
					])
					const totalPrice = cartData?.data?.totalPrice
					const currencyISO = cartData?.data?.currencyISO

					const quantityUpdatedMessage = compose(
						T('feedback.announcement.quantity_updated'),
						{
							quantity: value,
						},
					)

					if (
						typeof totalPrice !== 'number' ||
						Number.isNaN(totalPrice) ||
						!currencyISO
					) {
						announce(quantityUpdatedMessage)
						return
					}

					const totalPriceFormatted = formatPriceWithLocale(
						totalPrice,
						currencyISO,
						locale,
					)

					announce(
						`${quantityUpdatedMessage} ${T('cart.total_order')}: ${totalPriceFormatted}`,
					)
				},
			})
		}
	}

	return {
		productQuantity: currentQuantity,
		handleCartQuantityChange,
		openModalDeleteItem,
		setOpenModalDeleteItem,
		isUpdating: isPending,
	}
}
