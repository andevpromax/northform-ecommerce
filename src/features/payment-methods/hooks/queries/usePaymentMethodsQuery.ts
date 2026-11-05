import { useLocaleParts } from '@/shared/hooks/useLocaleParts'
import type { PaymentMethodsResponse } from '@/shared/schemas/paymentMethods'
import { useQuery } from '@tanstack/react-query'

export const fetchPaymentMethods = async (locale: string) => {
	if (!locale) throw new Error('Locale is required')

	const newSearchParams = new URLSearchParams({ locale })

	const response = await fetch(
		`/api/user/payment-methods?${newSearchParams.toString()}`,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		},
	)

	if (!response.ok) {
		throw new Error(
			`Failed to fetch payment methods: ${response.statusText} (${response.status})`,
		)
	}

	const responseJson = await response.json()
	return responseJson.data as PaymentMethodsResponse
}

export const usePaymentMethodsQuery = () => {
	const { raw: locale } = useLocaleParts()

	return useQuery({
		queryKey: ['payment-methods', locale],
		queryFn: () => fetchPaymentMethods(locale),
		enabled: !!locale,
		staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
		gcTime: Number.POSITIVE_INFINITY, // Keep in cache forever
		refetchOnWindowFocus: true,
		refetchOnMount: true,
	})
}
