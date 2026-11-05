import Link from 'next/link'
import type { ProductResponse as Product } from '@/server/api/products'
import { formatPriceWithLocale } from '@/shared/utils/formatPriceWithLocale'
import { AddToCart } from './AddToCart'
export function ProductCard({ product: p }: { product: Product }) {
	return (
		<article className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
			{/* Same destination as the title link: keep a single link per product
			    for keyboard and screen reader users. */}
			<Link
				href={`/products/${p.sku}`}
				className="block"
				tabIndex={-1}
				aria-hidden
			>
				<img
					src={p.image}
					alt=""
					width={400}
					height={400}
					className="aspect-square w-full object-cover"
					loading="lazy"
				/>
			</Link>
			<div className="space-y-4 p-5">
				<p className="text-xs uppercase tracking-widest text-gray-500">
					{p.category}
				</p>
				<h2 className="text-xl font-semibold">
					<Link href={`/products/${p.sku}`}>{p.name}</Link>
				</h2>
				<div className="flex justify-between">
					<strong>{formatPriceWithLocale(p.price, p.currency, 'en-GB')}</strong>
					<span className="text-sm text-gray-500">
						{p.available ? `${p.stock} available` : 'Sold out'}
					</span>
				</div>
				<AddToCart sku={p.sku} available={p.available} />
			</div>
		</article>
	)
}
