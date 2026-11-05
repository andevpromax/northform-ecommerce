import Link from 'next/link'
import { readSession } from '@/shared/services/session'
import { getLatestOrder } from '@/server/api/orders'
export const dynamic = 'force-dynamic'
export default async function Orders() {
	const id = await readSession()
	const order = id ? await getLatestOrder(id) : null
	return (
		<div className="max-w-2xl">
			<h1>Your latest order</h1>
			<div className="panel mt-8">
				{order ? (
					<>
						<p className="break-all">
							{order.id} · {order.status}
						</p>
						<Link
							className="mt-4 inline-block underline"
							href={`/order/${order.id}`}
						>
							View order or resume payment
						</Link>
					</>
				) : (
					<p>No orders in this demo session yet.</p>
				)}
			</div>
			<p className="mt-5 text-sm text-gray-500">
				Orders expire after 24 hours of inactivity or when the demo server
				restarts.
			</p>
		</div>
	)
}
