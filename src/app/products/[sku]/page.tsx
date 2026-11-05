import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ApiError } from '@/server/api/errors'
import { getProduct } from '@/server/api/products'
import { AddToCart } from '@/features/catalog/AddToCart'
import { formatPriceWithLocale } from '@/shared/utils/formatPriceWithLocale'
// Rendered per request so stock and availability come from the backend.
export const dynamic = 'force-dynamic'
const findProduct = (sku: string) =>
	getProduct(sku).catch((error) => {
		if (error instanceof ApiError && error.status === 404) return null
		throw error
	})
export default async function Product({
	params,
}: { params: Promise<{ sku: string }> }) {
	const p = await findProduct((await params).sku)
	if (!p) notFound()
	return (
		<>
			<Link href="/products" className="underline">
				← Collection
			</Link>
			<div className="mt-8 grid items-center gap-12 md:grid-cols-2">
				<img
					className="w-full rounded-2xl"
					src={p.image}
					alt={p.name}
					width={600}
					height={600}
				/>
				<div className="space-y-6">
					<p className="eyebrow">{p.category}</p>
					<h1>{p.name}</h1>
					<p className="text-lg text-gray-600">{p.description}</p>
					<p className="text-3xl font-semibold">
						{formatPriceWithLocale(p.price, p.currency, 'en-GB')}
					</p>
					<p>
						{p.available
							? `${p.stock} available · Delivery €5`
							: 'Currently unavailable'}
					</p>
					<AddToCart sku={p.sku} available={p.available} />
				</div>
			</div>
		</>
	)
}
