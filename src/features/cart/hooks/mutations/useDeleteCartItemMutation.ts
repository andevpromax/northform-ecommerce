import { useLocaleParts } from '@/shared/hooks/useLocaleParts'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface DeleteCartItemParams {
	entryNumber: number
}

const useDeleteCartItemMutation = () => {
	const queryClient = useQueryClient()
	const { raw: locale } = useLocaleParts()

	const mutation = useMutation({
		mutationFn: async ({ entryNumber }: DeleteCartItemParams) => {
			const response = await fetch('/api/cart/delete-entry', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ entryNumber, locale }),
			})

			if (!response.ok) {
				throw new Error(
					`Failed to delete item: ${response.statusText} - ${response.status}`,
				)
			}

			const data = await response.json()

			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['cart', locale] })
		},

		onError: (error) => {
			console.error('Failed to delete item:', error)
		},
	})
	return mutation
}

export default useDeleteCartItemMutation
