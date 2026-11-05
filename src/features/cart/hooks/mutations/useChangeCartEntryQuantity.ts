import { useLocaleParts } from '@/shared/hooks/useLocaleParts'
import { useMutation, useQueryClient } from '@tanstack/react-query'

type ChangeQuantityRequest = {
	entryNumber: number
}

export const useChangeCartEntryQuantityMutation = ({
	entryNumber,
}: ChangeQuantityRequest) => {
	const queryClient = useQueryClient()
	const { raw: locale } = useLocaleParts()

	const mutation = useMutation({
		mutationFn: async (quantity: number) => {
			const response = await fetch('/api/cart/change-entry-quantity', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ entryNumber, quantity, locale }),
			})

			if (!response.ok) {
				throw new Error(
					`Failed to change quantity: ${response.statusText} - ${response.status}`,
				)
			}

			const result = await response.json()

			if (!result.success) {
				throw new Error(result.error ?? 'Failed to change quantity')
			}

			return result
		},
		onSuccess: async () => {
			// Refetch cart to get the latest data with correct entry numbers and quantities
			await queryClient.invalidateQueries({ queryKey: ['cart', locale] })
		},
		onError: (error) => {
			console.error('Failed to change quantity:', error)
		},
	})

	return mutation
}
