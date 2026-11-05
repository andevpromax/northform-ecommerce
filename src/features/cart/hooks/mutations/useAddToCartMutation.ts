'use client'

import type { AddToCartParams } from '@/shared/api/product/addToCart'
import { getAnonCartCookieName } from '@/shared/constants/cart'
import { deleteCookie, getCookie, setCookie } from '@/shared/ui/hooks/useCookie'
import showToast from '@/features/feedback/toast/showToast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

interface UseAddToCartMutationParams {
	sku: string
	quantity: number
	successToastTitle: string
	errorToastTitle: string
	successToastLink?: { href: string; label: string }
	minProductQuantity?: number
	locale: string
	onSuccessCallback?: () => void
	onTrackAddToCart?: (sku: string, quantity: number) => void
}

const useAddToCartMutation = ({
	sku,
	successToastTitle,
	errorToastTitle,
	successToastLink,
	quantity,
	locale,
	onSuccessCallback,
	onTrackAddToCart,
}: UseAddToCartMutationParams) => {
	const cookieName = getAnonCartCookieName(locale)
	const [anonCartId, setAnonCartId] = useState(() => getCookie(cookieName))

	const queryClient = useQueryClient()

	const { mutate, isPending } = useMutation({
		mutationFn: async ({ sku, quantity, locale }: AddToCartParams) => {
			const res = await fetch('/api/product/add-to-cart', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					sku,
					quantity,
					locale,
				}),
			})

			if (!res.ok) {
				throw new Error(`${res.status} ${res.statusText}`)
			}

			const data = await res.json()

			return data
		},
		onSuccess: async (data, variables) => {
			onSuccessCallback?.()
			onTrackAddToCart?.(variables.sku, variables.quantity)

			const { cartId, isAnonymous } = data ?? {}

			if (!cartId) return

			if (isAnonymous && cartId !== anonCartId) {
				setCookie(cookieName, cartId, { days: 30 })
				setAnonCartId(cartId)
			}

			if (!isAnonymous && anonCartId) {
				deleteCookie(cookieName)
				setAnonCartId(null)
			}

			queryClient.invalidateQueries({ queryKey: ['cart', locale] })

			showToast({
				type: 'success',
				title: successToastTitle,
				link: successToastLink,
				useCustomAnnouncement: false,
			})
		},
		onError: (_error) => {
			showToast({ type: 'error', title: errorToastTitle })
		},
	})

	const handleAddToCart = () => {
		mutate({ sku, quantity, locale })
	}

	return {
		handleAddToCart,
		isPending,
	}
}

export default useAddToCartMutation
