'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCartDetailsQuery } from '@/features/cart/hooks/queries/useCartDetailsQuery'
import { useCreateOrderMutation } from '@/features/cart/hooks/mutations/useCreateOrderMutation'
import CartPriceSummary from '@/features/cart/components/shopping-cart/CartPriceSummary'
import { useCheckoutStore } from '@/shared/store/cart/useCheckoutStore'
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormLabelWrapper,
	FormControl,
	FormControlWrapper,
	FormMessage,
} from '@/shared/ui/actions-inputs/Form'
import { DELIVERY_COUNTRIES } from '@/shared/schemas/Addresses/postalCodes'
import { Input } from '@/shared/ui/actions-inputs/Input'
import { Button } from '@/shared/ui/actions-inputs/Button'
import { checkoutSchema, type CheckoutValues } from './schema'
const nameFields = [
	['firstName', 'First name', 'given-name'],
	['lastName', 'Last name', 'family-name'],
	['email', 'Email', 'email'],
	['streetAndNumber', 'Street and number', 'street-address'],
	['city', 'City', 'address-level2'],
] as const
export function CheckoutForm() {
	const { data, isLoading, isError } = useCartDetailsQuery()
	const cart = data?.data
	const {
		setIsSubmittingOrder,
		setDeliveryAddressId,
		setBillingAddressId,
		setAddressesAssignedToBackend,
		setAllStepsCompleted,
	} = useCheckoutStore()
	const form = useForm<CheckoutValues>({
		resolver: zodResolver(checkoutSchema),
		defaultValues: {
			firstName: '',
			lastName: '',
			email: '',
			streetAndNumber: '',
			city: '',
			zipCode: '',
			// No preselected country: the shopper must choose the one they live in.
			country: '' as CheckoutValues['country'],
			terms: false as unknown as true,
		},
	})
	const busy = useRef(false)
	const termsAccepted = form.watch('terms') === true
	useEffect(() => setIsSubmittingOrder(false), [setIsSubmittingOrder])
	const mutation = useCreateOrderMutation({
		continueToConfirmLink: '/payment',
		closeModal: () => {},
	})
	// From order request until navigation to payment: prevents duplicate orders
	// (the busy ref also guards submissions that are still validating). Not
	// tied to formState.isSubmitting, which would flicker on invalid submits.
	const isSubmitting = mutation.isPending || mutation.isSuccess
	const submit = async (values: CheckoutValues) => {
		if (busy.current) return
		busy.current = true
		setIsSubmittingOrder(true)
		try {
			const { terms: _terms, ...customer } = values
			const signature = JSON.stringify({ cart: cart?.entries, customer })
			const saved = JSON.parse(
				sessionStorage.getItem('showcase-order-attempt') || 'null',
			) as {
				signature: string
				key: string
			} | null
			const key =
				saved?.signature === signature ? saved.key : crypto.randomUUID()
			sessionStorage.setItem(
				'showcase-order-attempt',
				JSON.stringify({ signature, key }),
			)
			setDeliveryAddressId('guest')
			setBillingAddressId('guest')
			setAddressesAssignedToBackend(true)
			setAllStepsCompleted(true)
			await mutation.mutateAsync({
				customer,
				idempotencyKey: key,
				paymentMethodType: 'simulation',
				paymentMethodId: '',
				encryptedSecurityCode: '',
				isExternalPaymentMethod: false,
			})
		} catch {
			setIsSubmittingOrder(false)
		} finally {
			busy.current = false
		}
	}
	if (isLoading) return <p role="status">Loading checkout…</p>
	if (isError)
		return <p role="alert">Unable to load checkout. Please refresh.</p>
	// After a successful order the backend empties the cart; keep the form (and
	// its pending button) until the navigation to payment completes.
	if (!cart?.entries.length && !mutation.isSuccess)
		return (
			<div className="panel">
				<h2>Your cart is empty</h2>
				<p className="my-4">
					Already submitted an order? Resume it from your orders.
				</p>
				<Link className="underline" href="/orders">
					Your orders
				</Link>{' '}
				·{' '}
				<Link className="underline" href="/products">
					Browse products
				</Link>
			</div>
		)
	return (
		<div className="grid items-start gap-10 lg:grid-cols-[1fr_420px]">
			<Form {...form}>
				<form
					noValidate
					onSubmit={form.handleSubmit(submit)}
					className="panel space-y-5"
					aria-labelledby="checkout-details-heading"
				>
					<h2 id="checkout-details-heading">Customer & delivery details</h2>
					<p className="text-sm text-gray-600">
						Use fictional details only. Nothing will be shipped. All fields are
						required.
					</p>
					<div className="grid gap-5 sm:grid-cols-2">
						{nameFields.map(([name, label, autoComplete]) => (
							<FormField
								key={name}
								control={form.control}
								name={name}
								render={({ field }) => (
									<FormItem>
										<FormLabelWrapper>
											<FormLabel required>{label}</FormLabel>
										</FormLabelWrapper>
										<FormControlWrapper>
											<FormControl>
												<Input
													{...field}
													required
													autoComplete={autoComplete}
													type={name === 'email' ? 'email' : 'text'}
													className="w-full"
												/>
											</FormControl>
										</FormControlWrapper>
										<FormMessage />
									</FormItem>
								)}
							/>
						))}
						<FormField
							control={form.control}
							name="country"
							render={({ field }) => (
								<FormItem>
									<FormLabelWrapper>
										<FormLabel required>Country</FormLabel>
									</FormLabelWrapper>
									<FormControlWrapper>
										<FormControl>
											<select
												{...field}
												required
												autoComplete="country-name"
												className="h-full min-h-14 w-full cursor-pointer bg-transparent px-3 focus:outline-none"
											>
												<option value="" disabled>
													Select a country
												</option>
												{DELIVERY_COUNTRIES.map((country) => (
													<option key={country}>{country}</option>
												))}
											</select>
										</FormControl>
									</FormControlWrapper>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="zipCode"
							render={({ field }) => (
								<FormItem>
									<FormLabelWrapper>
										<FormLabel required>Postal code</FormLabel>
									</FormLabelWrapper>
									<FormControlWrapper>
										<FormControl>
											<Input
												{...field}
												required
												autoComplete="postal-code"
												className="w-full"
											/>
										</FormControl>
									</FormControlWrapper>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
					<div className="space-y-2">
						<label className="flex cursor-pointer items-start gap-3">
							<input
								type="checkbox"
								required
								className="mt-1 size-5 shrink-0 accent-brand-800"
								{...form.register('terms')}
								aria-invalid={!!form.formState.errors.terms}
								aria-describedby={
									form.formState.errors.terms ? 'terms-error' : undefined
								}
							/>
							I understand this is a demo and accept the demo terms.
						</label>
						{form.formState.errors.terms && (
							<p id="terms-error" className="text-red-700">
								{form.formState.errors.terms.message}
							</p>
						)}
					</div>
					{mutation.isError && (
						<p role="alert" className="text-red-700">
							Could not create your order. Please try again.
						</p>
					)}
					<div className="space-y-2">
						{/* Disabled until the terms are accepted and while an order is
						    being created; the hint says why. */}
						<Button
							type="submit"
							disabled={!termsAccepted || isSubmitting}
							isLoading={isSubmitting}
							aria-describedby={termsAccepted ? undefined : 'submit-hint'}
						>
							Create order & continue to payment
						</Button>
						{!termsAccepted && (
							<p id="submit-hint" className="text-sm text-gray-600">
								Accept the demo terms to continue.
							</p>
						)}
					</div>
				</form>
			</Form>
			<aside className="panel space-y-6">
				<h2>Order summary</h2>
				{cart?.entries.map((e) => (
					<div key={e.product.sku} className="flex justify-between">
						<span>{e.product.name}</span>
						<span>× {e.quantity}</span>
					</div>
				))}
				{cart && (
					<CartPriceSummary
						className="!w-full"
						{...cart}
						currencyISO={cart.currencyISO || 'EUR'}
						orderDiscounts={cart.orderDiscounts || 0}
					/>
				)}
			</aside>
		</div>
	)
}
