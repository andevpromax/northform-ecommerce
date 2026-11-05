import { CheckoutForm } from '@/features/checkout/CheckoutForm'
export default function Checkout() {
	return (
		<>
			<p className="eyebrow">Cart → Checkout → Payment → Confirmation</p>
			<h1 className="mb-8">Checkout</h1>
			<CheckoutForm />
		</>
	)
}
