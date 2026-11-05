import { customerSchema } from '@/features/checkout/schema'
import showToast from '@/features/feedback/toast/showToast'

import { useLocaleParts } from '@/shared/hooks/useLocaleParts'
import type { CreateOrderResponse } from '@/shared/schemas/createOrder'
import { useCheckoutStore } from '@/shared/store/cart/useCheckoutStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useT } from 'talkr'
import { z } from 'zod'

const createOrderParamsSchema = z.object({
	locale: z.string(),
	customer: customerSchema,
	idempotencyKey: z.string().uuid(),
	paymentMethodType: z.string(),
	paymentMethodId: z.string(),
	brand: z.string().optional(),
	encryptedSecurityCode: z.string(),
	isExternalPaymentMethod: z.boolean().optional(),
	referenceNumber: z.string().optional(),
})

export type CreateOrderParams = z.infer<typeof createOrderParamsSchema>

export const useCreateOrderMutation = ({
	continueToConfirmLink,
	closeModal,
}: {
	continueToConfirmLink: string
	closeModal: () => void
}) => {
	const { raw: locale } = useLocaleParts()
	const { setIsSubmittingOrder } = useCheckoutStore()
	const { T } = useT()
	const queryClient = useQueryClient()

	const { push } = useRouter()

	const errorToastTitle = T('components.general_error_alert.title')
	const inputBodyNotMatchingToastTitle = T('api.input_body_not_matching')

	const mutation = useMutation({
		mutationFn: async (data: Omit<CreateOrderParams, 'locale'>) => {
			const res = await fetch('/api/order/createOrder', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					locale,
					...data,
				}),
			})

			if (!res.ok) {
				const body = await res.json().catch(() => null)
				const errorCode =
					body?.error?.error?.errorCode ?? body?.error?.errorCode ?? null

				const err = Object.assign(
					new Error(`Order creation failed: ${res.status || res.statusText}`),
					{ errorCode },
				)

				throw err
			}
			const result = await res.json()

			return result
		},
		onSuccess: (data: {
			status: string
			redirectUrl?: string
			data?: CreateOrderResponse
		}) => {
			// The backend moved the cart into the order; refresh cached cart views
			// (header badge, cart page) instead of showing the old contents.
			queryClient.invalidateQueries({ queryKey: ['cart', locale] })

			const adyen = data.data?.adyen
			const order = data.data?.order

			// Helper function to validate and navigate to confirmation
			const navigateToConfirmation = () => {
				if (
					!continueToConfirmLink ||
					continueToConfirmLink.trim() === '' ||
					continueToConfirmLink === '#'
				) {
					console.error(
						'CRITICAL: continueToConfirmLink is not defined or empty - users may be stuck in checkout flow and create duplicate orders.',
					)
					showToast({ type: 'error', title: errorToastTitle })
					setIsSubmittingOrder(false)
					closeModal()
					return false
				}

				if (!order?.code) {
					console.error(
						'CRITICAL: order.code is missing from API response - cannot navigate to confirmation page.',
						{
							order,
						},
					)
					showToast({ type: 'error', title: errorToastTitle })
					setIsSubmittingOrder(false)
					closeModal()
					return false
				}

				push(`${continueToConfirmLink}?orderID=${order.code}`)
				closeModal()
				return true
			}

			// 1. PRIORITY: Handle redirect action if present (3D Secure, etc.)
			// This must be checked FIRST as it can come with various result codes
			if (adyen?.action?.type === 'redirect') {
				const { url, method = 'GET', data } = adyen.action

				if (method === 'GET') {
					window.location.href = url ?? '/'
				} else if (method === 'POST') {
					const form = document.createElement('form')
					form.method = 'POST'
					form.action = url ?? '/'

					if (data && typeof data === 'object') {
						for (const [key, value] of Object.entries(data)) {
							const input = document.createElement('input')
							input.type = 'hidden'
							input.name = key
							input.value = String(value)
							form.appendChild(input)
						}
					}

					document.body.appendChild(form)
					form.submit()
				} else {
					showToast({ type: 'error', title: errorToastTitle })
					setIsSubmittingOrder(false)
				}
				return
			}

			// 2. Immediate authorisation (no redirect)
			if (adyen?.resultCode === 'Authorised') {
				const success = navigateToConfirmation()
				if (success) return
			}

			// 3. Pending/Received - Payment is being processed asynchronously
			// Order is created successfully, waiting for payment confirmation
			if (adyen?.resultCode === 'Pending' || adyen?.resultCode === 'Received') {
				const success = navigateToConfirmation()
				if (success) return
			}

			// 4. Payment refused by issuer
			if (adyen?.resultCode === 'Refused') {
				showToast({ type: 'error', title: errorToastTitle })
				setIsSubmittingOrder(false)
				closeModal()
				return
			}

			// 5. Payment cancelled by shopper
			if (adyen?.resultCode === 'Cancelled') {
				setIsSubmittingOrder(false)
				closeModal()
				return
			}

			// 6. Unknown result or error - fallback
			showToast({ type: 'error', title: errorToastTitle })
			setIsSubmittingOrder(false)
			closeModal()
		},
		onError: (error) => {
			setIsSubmittingOrder(false)

			const errorCode = (error as Error & { errorCode?: string }).errorCode

			if (errorCode) {
				const errorTitle =
					errorCode && T(errorCode) !== errorCode
						? T(errorCode)
						: errorToastTitle

				showToast({ type: 'error', title: errorTitle })

				return
			}

			if (error instanceof Error && error.message.includes('400')) {
				showToast({ type: 'error', title: inputBodyNotMatchingToastTitle })
			} else {
				showToast({ type: 'error', title: errorToastTitle })
			}
		},
	})

	return mutation
}
