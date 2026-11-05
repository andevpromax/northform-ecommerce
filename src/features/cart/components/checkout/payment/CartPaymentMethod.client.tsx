'use client'

import CartPaymentTile from '@/features/cart/components/checkout/payment/CartPaymentTile'
import { useCartDetailsQuery } from '@/features/cart/hooks/queries/useCartDetailsQuery'
import { ACCESS_TOKEN_KEY } from '@/shared/constants/auth'
import { Button } from '@/shared/ui/actions-inputs/Button'
import { RadioGroupRoot } from '@/shared/ui/actions-inputs/RadioGroup'
import { Skeleton } from '@/shared/ui/custom/Skeleton'
import {
	Alert,
	AlertContent,
	AlertDescription,
	AlertIconContainer,
	AlertTitle,
} from '@/shared/ui/feedback/Alert'
import { getCookie } from '@/shared/ui/hooks/useCookie'
import { IconArrowLeft16 } from '@/shared/icons/icons/neo-16x16/arrow-left-16'
import { IconArrowRight16 } from '@/shared/icons/icons/neo-16x16/arrow-right-16'
import { IconCrossInCircle16 } from '@/shared/icons/icons/neo-16x16/cross-in-circle-16'
import { Link } from '@/shared/cms/atoms/Link'
import type { LinkValue } from '@/shared/cms/types/fields'
import { usePaymentMethodsQuery } from '@/features/payment-methods/hooks/queries/usePaymentMethodsQuery'
import getMethods from '@/features/payment-methods/utils/getMethods'
import { useCheckoutStore } from '@/shared/store/cart/useCheckoutStore'
import {
	mapCartCoupon,
	mapCartEntriesToItems,
} from '@/features/tracking/ecommerce/mappers'
import { sendEcommerceEvent } from '@/features/tracking/ecommerce/sendEcommerceEvent'
import type { AddPaymentInfoEvent } from '@/features/tracking/ecommerce/types'
import { useEcommerceEnrichment } from '@/features/tracking/ecommerce/useEcommerceEnrichment'
import { roundMoney } from '@/shared/utils/roundMoney'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { Order } from '@/server/api/orders'
import { useT } from 'talkr'

export type CartPaymentMethodProps = {
	orderId: string

	continueToSummaryLink?: LinkValue
	backToCartAddressesLink?: LinkValue
	pageEditing?: boolean
}

export const CartPaymentMethod = ({
	orderId,
	continueToSummaryLink,
	backToCartAddressesLink,
	pageEditing,
}: CartPaymentMethodProps) => {
	const { T } = useT()
	const [hydrated, setHydrated] = useState(false)
	useEffect(() => setHydrated(true), [])
	const router = useRouter()
	const [paymentError, setPaymentError] = useState('')
	const attempt = useRef<{ key: string; outcome: string } | null>(null)
	const payment = useMutation({
		mutationFn: async (outcome: string) => {
			if (!attempt.current || attempt.current.outcome !== outcome)
				attempt.current = { key: crypto.randomUUID(), outcome }
			const response = await fetch(`/api/payments/${orderId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ outcome, idempotencyKey: attempt.current.key }),
			})
			const body = await response.json()
			if (!response.ok) throw new Error(body.error || 'Payment unavailable')
			return body as Order
		},
		onSuccess: (order) => {
			if (order.paymentStatus === 'Authorised') {
				router.push(`/order/${orderId}`)
			} else {
				attempt.current = null
				setPaymentError(
					'Simulated payment declined. Choose success and try again.',
				)
			}
		},
		onError: (error) => setPaymentError(error.message),
	})
	const { selectedPaymentMethod } = useCheckoutStore()
	const setSelectedPaymentMethod = useCheckoutStore(
		(state) => state.setSelectedPaymentMethod,
	)

	const { data: cartData } = useCartDetailsQuery()
	const { data, isLoading, isError } = usePaymentMethodsQuery()

	const cartEntries = cartData?.data?.entries ?? []
	const skus = cartEntries
		.map((e) => e.product?.sku?.trim())
		.filter(Boolean) as string[]
	const { productFieldsMap, prices } = useEcommerceEnrichment(skus)

	const handleSelectMethod = (methodId: string) => {
		const selected = paymentMethods?.find((method) => method.id === methodId)

		if (!selected) return

		if (selected?.id !== 'scheme') {
			setSelectedPaymentMethod({
				id: selected?.id ?? '',
				name: selected?.name ?? '',
				isExternalPaymentMethod: selected?.isExternalPaymentMethod ?? false,
			})
		} else {
			const firstStoredCard = selected.stored?.[0]
			if (firstStoredCard) {
				setSelectedPaymentMethod({
					id: selected.id,
					name: selected.name ?? '',
					isExternalPaymentMethod: selected?.isExternalPaymentMethod ?? false,
					stored: {
						id: firstStoredCard.id,
						number: firstStoredCard.lastFour,
						expiry: `${firstStoredCard.expiryMonth}/${firstStoredCard.expiryYear}`,
						brand: firstStoredCard.brand ?? null,
					},
				})
			} else {
				setSelectedPaymentMethod({
					id: selected.id,
					name: selected.name ?? '',
					isExternalPaymentMethod: selected?.isExternalPaymentMethod ?? false,
				})
			}
		}
	}

	const paymentMethods = getMethods({
		paymentMethodsResponse: data ?? {
			paymentMethods: [],
			storedPaymentMethodList: [],
		},
	})

	const isContinueDisabled =
		(selectedPaymentMethod?.id === 'scheme' &&
			!(selectedPaymentMethod?.stored?.id || selectedPaymentMethod?.stored)) ||
		!selectedPaymentMethod

	const resolvePaymentType = useCallback((): string => {
		if (!selectedPaymentMethod) return 'n/a'

		if (selectedPaymentMethod.stored?.brand) {
			return selectedPaymentMethod.stored.brand
		}

		return selectedPaymentMethod.name ?? selectedPaymentMethod.id ?? 'n/a'
	}, [selectedPaymentMethod])

	const handleContinueToSummary = () => {
		if (payment.isPending) return
		setPaymentError('')
		payment.mutate(selectedPaymentMethod?.id || 'success')
	}

	if (!hydrated) return <p role="status">Loading payment choices…</p>
	return (
		<>
			{paymentError && (
				<p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">
					{paymentError}
				</p>
			)}
			{payment.isPending && <p role="status">Processing simulated payment…</p>}
			{isLoading &&
				Array.from({ length: 3 }).map((_, index) => (
					<Skeleton className="h-[109px] w-full rounded-2" key={index} />
				))}
			{isError && (
				<Alert variant="error" className="mx-auto mt-6 w-full">
					<AlertIconContainer>
						<IconCrossInCircle16 size="lg" />
					</AlertIconContainer>
					<AlertContent>
						<AlertTitle>{T('components.general_error_alert.title')}</AlertTitle>
						<AlertDescription>
							{T('components.general_error_alert.description')}
						</AlertDescription>
					</AlertContent>
				</Alert>
			)}
			{!isLoading && !isError && (
				<RadioGroupRoot
					value={selectedPaymentMethod?.id || ''}
					onValueChange={handleSelectMethod}
					className="flex flex-col gap-2"
				>
					{paymentMethods.map((paymentMethod) => (
						<CartPaymentTile
							key={paymentMethod.id}
							id={paymentMethod.id}
							name={paymentMethod.name}
							type={paymentMethod.type}
							stored={paymentMethod.stored}
							providers={paymentMethod.providers}
							isSelected={selectedPaymentMethod?.id === paymentMethod.id}
							selectedPaymentMethodId={selectedPaymentMethod?.id}
							isExternal={paymentMethod.isExternalPaymentMethod}
						/>
					))}
				</RadioGroupRoot>
			)}

			<div className="mt-auto flex 1280:flex-row flex-col-reverse 1280:justify-between gap-3">
				<Button asChild variant="secondary">
					{pageEditing ? (
						<span>
							<IconArrowLeft16 className="rtl:rotate-180" />
							<Link field={backToCartAddressesLink} />
						</span>
					) : (
						<Link
							field={backToCartAddressesLink}
							showLinkTextWithChildrenPresent
						>
							<IconArrowLeft16 className="-order-1 rtl:rotate-180" />
						</Link>
					)}
				</Button>

				{/* if its scheme and it doesnt have stored and it should not allow to continue */}
				{isContinueDisabled ? (
					<Button variant="primary" disabled>
						{continueToSummaryLink?.value?.text}
						<IconArrowRight16 className="rtl:rotate-180" />
					</Button>
				) : pageEditing ? (
					<Button variant="primary" asChild>
						<span>
							<Link field={continueToSummaryLink} />
							<IconArrowRight16 className="rtl:rotate-180" />
						</span>
					</Button>
				) : (
					<Button
						variant="primary"
						disabled={payment.isPending}
						isLoading={payment.isPending}
						onClick={handleContinueToSummary}
					>
						{continueToSummaryLink?.value?.text}
						<IconArrowRight16 className="rtl:rotate-180" />
					</Button>
				)}
			</div>
		</>
	)
}
