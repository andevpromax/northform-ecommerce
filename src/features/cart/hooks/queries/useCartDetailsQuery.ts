import { ACCESS_TOKEN_KEY } from '@/shared/constants/auth'
import { getAnonCartCookieName } from '@/shared/constants/cart'
import { getCookie } from '@/shared/ui/hooks/useCookie'
import { useLocaleParts } from '@/shared/hooks/useLocaleParts'
import type { CartDetailsResponse } from '@/shared/schemas/cart'
import { useQuery } from '@tanstack/react-query'

export async function fetchCart(locale: string) {
	const newSearchParams = new URLSearchParams({ locale })

	const cookieName = getAnonCartCookieName(locale)
	const anonymousCartId = getCookie(cookieName)
	const token = getCookie(ACCESS_TOKEN_KEY)

	const response = await fetch(`/api/cart?${newSearchParams.toString()}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	})

	// The cart endpoint always answers 200 (an empty cart has no entries). Any
	// other status is a failure and must not be rendered as an empty cart.
	if (!response.ok) {
		throw new Error(
			`Failed to fetch cart: ${response.statusText} ${response.status} `,
		)
	}

	const data = await response.json()

	return data
}

export function useCartDetailsQuery() {
	const { raw: locale } = useLocaleParts()

	return useQuery<CartDetailsResponse>({
		queryKey: ['cart', locale],
		queryFn: () => fetchCart(locale),
		enabled: () => !!locale,
		staleTime: Number.POSITIVE_INFINITY, // Keep in cache forever
		gcTime: Number.POSITIVE_INFINITY, // Keep in cache forever
		refetchOnWindowFocus: true,
		refetchOnMount: true,
	})
}
