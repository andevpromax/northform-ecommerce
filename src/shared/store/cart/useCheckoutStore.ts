import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type PaymentMethod = {
	id: string | null
	name: string | null
	isExternalPaymentMethod: boolean
	stored?: {
		id: string | null
		name?: string | null
		number?: string | null
		expiry?: string | null
		brand?: string | null
	}
} | null

type CheckoutState = {
	allStepsCompleted: boolean
	selectedPaymentMethod: PaymentMethod
	deliveryAddressId: string | null
	billingAddressId: string | null
	userId: string | null
	isSubmittingOrder: boolean
	addressesAssignedToBackend: boolean
}

type CheckoutAction = {
	setAllStepsCompleted: (completed: boolean) => void
	setSelectedPaymentMethod: (paymentMethod: PaymentMethod) => void
	setDeliveryAddressId: (addressId: string | null) => void
	setBillingAddressId: (addressId: string | null) => void
	setUserId: (userId: string | null) => void
	setIsSubmittingOrder: (isSubmitting: boolean) => void
	setAddressesAssignedToBackend: (assigned: boolean) => void
	clearStore: () => void
}

export type CheckoutStore = CheckoutState & CheckoutAction

export const useCheckoutStore = create<CheckoutStore>()(
	persist(
		(set) => ({
			allStepsCompleted: false,
			selectedPaymentMethod: null,
			deliveryAddressId: null,
			billingAddressId: null,
			userId: null,
			isSubmittingOrder: false,
			addressesAssignedToBackend: false,
			setAllStepsCompleted: (completed) =>
				set({ allStepsCompleted: completed }),
			setSelectedPaymentMethod: (paymentMethod) =>
				set({ selectedPaymentMethod: paymentMethod }),
			setDeliveryAddressId: (addressId) =>
				set({
					deliveryAddressId: addressId,
					addressesAssignedToBackend: false,
				}),
			setBillingAddressId: (addressId) =>
				set({ billingAddressId: addressId, addressesAssignedToBackend: false }),
			setUserId: (userId) => set({ userId }),
			setIsSubmittingOrder: (isSubmitting) =>
				set({ isSubmittingOrder: isSubmitting }),
			setAddressesAssignedToBackend: (assigned) =>
				set({ addressesAssignedToBackend: assigned }),
			clearStore: () =>
				set({
					isSubmittingOrder: false,
					allStepsCompleted: false,
					selectedPaymentMethod: null,
					deliveryAddressId: null,
					billingAddressId: null,
					userId: null,
					addressesAssignedToBackend: false,
				}),
		}),
		{
			name: 'showcase-checkout-store',
		},
	),
)
