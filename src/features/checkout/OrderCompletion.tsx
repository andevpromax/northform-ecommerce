'use client'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCheckoutStore } from '@/shared/store/cart/useCheckoutStore'
// Same completion lifecycle as the source OrderInfoCard, without CMS/analytics.
export function OrderCompletion() {
	const clearStore = useCheckoutStore((s) => s.clearStore)
	const client = useQueryClient()
	useEffect(() => {
		clearStore()
		client.invalidateQueries({ queryKey: ['cart', 'en-GB'] })
		sessionStorage.removeItem('showcase-order-attempt')
	}, [clearStore, client])
	return null
}
