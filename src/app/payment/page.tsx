import { notFound, redirect } from 'next/navigation'
import { readSession } from '@/shared/services/session'
import { findOrder } from '@/server/api/orders'
import { CartPaymentMethod } from '@/features/cart/components/checkout/payment/CartPaymentMethod.client'
import { formatPriceWithLocale } from '@/shared/utils/formatPriceWithLocale'
export const dynamic = 'force-dynamic'
export default async function Payment({
	searchParams,
}: { searchParams: Promise<{ orderID?: string }> }) {
	const { orderID } = await searchParams
	if (!orderID) redirect('/orders')
	const order = await findOrder(await readSession(), orderID)
	if (!order) notFound()
	if (order.paymentStatus === 'Authorised') redirect(`/order/${order.id}`)
	return (
		<div className="mx-auto max-w-3xl">
			<p className="eyebrow">Checkout → Payment → Confirmation</p>
			<h1>Simulated payment</h1>
			<div className="panel my-8 space-y-3">
				<p>
					No real transaction takes place. Do not enter payment card details.
				</p>
				<p>
					Order <span className="font-mono">{order.id}</span>
				</p>
				{order.cart.entries.map((e) => (
					<p key={e.product.sku}>
						{e.product.name} × {e.quantity}
					</p>
				))}
				<strong className="text-2xl">
					{formatPriceWithLocale(order.cart.totalPrice, 'EUR', 'en-GB')}
				</strong>
			</div>
			<div className="space-y-6">
				<CartPaymentMethod
					orderId={order.id}
					continueToSummaryLink={{
						value: { text: 'Complete simulated payment' },
					}}
					backToCartAddressesLink={{
						value: { href: '/orders', text: 'Back to your orders' },
					}}
				/>
			</div>
		</div>
	)
}
