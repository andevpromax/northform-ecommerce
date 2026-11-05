import { OrderCompletion } from '@/features/checkout/OrderCompletion'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { readSession } from '@/shared/services/session'
import { findOrder } from '@/server/api/orders'
import { formatPriceWithLocale } from '@/shared/utils/formatPriceWithLocale'
export const dynamic = 'force-dynamic'
export default async function Confirmation({
	params,
}: { params: Promise<{ id: string }> }) {
	const order = await findOrder(await readSession(), (await params).id)
	if (!order) notFound()
	const c = order.customer
	return (
		<div className="mx-auto max-w-3xl space-y-8">
			{order.status === 'confirmed' && <OrderCompletion />}
			<p className="eyebrow">
				{order.status === 'confirmed' ? 'Journey complete' : 'Order details'}
			</p>
			<h1>
				{order.status === 'confirmed'
					? 'Thank you. Order confirmed.'
					: 'Your order is awaiting payment.'}
			</h1>
			<div className="panel space-y-4">
				<p>
					Order ID: <span className="break-all font-mono">{order.id}</span>
				</p>
				<p>
					Order status: <strong>{order.status}</strong>
				</p>
				<p>
					Payment status: <strong>{order.paymentStatus}</strong> · simulated
				</p>
				{order.cart.entries.map((e) => (
					<div
						className="flex justify-between border-t py-3"
						key={e.product.sku}
					>
						<span>
							{e.product.name} × {e.quantity}
						</span>
						<span>
							{formatPriceWithLocale(e.totalPrice.value, 'EUR', 'en-GB')}
						</span>
					</div>
				))}
				<p className="text-xl font-semibold">
					Total: {formatPriceWithLocale(order.cart.totalPrice, 'EUR', 'en-GB')}
				</p>
				<p>
					Includes delivery and VAT
					{order.cart.orderDiscounts ? ' · DEMO10 applied' : ''}.
				</p>
			</div>
			<div className="panel">
				<h2>Customer & delivery</h2>
				<p className="mt-4">
					{c.firstName} {c.lastName}
					<br />
					{c.email}
					<br />
					{c.streetAndNumber}
					<br />
					{c.zipCode} {c.city}
					<br />
					{c.country}
				</p>
			</div>
			{order.status !== 'confirmed' && (
				<Link className="underline" href={`/payment?orderID=${order.id}`}>
					Resume simulated payment
				</Link>
			)}
			<p>
				<Link className="underline" href="/products">
					Continue exploring
				</Link>
			</p>
		</div>
	)
}
