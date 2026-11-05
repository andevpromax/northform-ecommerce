import { ProductCard } from '@/features/catalog/ProductCard'
import { getProducts } from '@/server/api/products'
// Rendered per request from the backend catalogue (no build-time API access).
export const dynamic = 'force-dynamic'
export default async function Products() {
	const products = await getProducts()
	return (
		<>
			<div className="mb-10 max-w-2xl">
				<p className="eyebrow">The everyday collection</p>
				<h1>
					Considered objects.
					<br />
					Simple, everyday living.
				</h1>
				<p className="mt-5 text-lg text-gray-600">
					Explore a fictional collection of useful things. This store
					demonstrates a complete cart, checkout and payment journey.
				</p>
			</div>
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{products.map((p) => (
					<ProductCard key={p.id} product={p} />
				))}
			</div>
		</>
	)
}
