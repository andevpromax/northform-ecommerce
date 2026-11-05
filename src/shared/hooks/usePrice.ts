import { useQuery } from '@tanstack/react-query'

type CatalogueEntry = { sku: string; stock: number }

const fetchCatalogue = async (): Promise<CatalogueEntry[]> => {
	const response = await fetch('/api/products')
	if (!response.ok)
		throw new Error(`Failed to fetch products: ${response.status}`)
	return response.json()
}

// Stock limit for the cart quantity input, from the backend catalogue (one
// cached request for all cart lines). Until it loads, no extra limit applies;
// the backend validates stock on every quantity change.
export const usePrice = ({ sku }: { sku: string; locale: string }) => {
	const { data } = useQuery({
		queryKey: ['products'],
		queryFn: fetchCatalogue,
		staleTime: 60_000,
	})
	const stock = data
		? (data.find((p) => p.sku === sku)?.stock ?? 0)
		: Number.POSITIVE_INFINITY
	return { data: { orderUnit: 1, stock } }
}
