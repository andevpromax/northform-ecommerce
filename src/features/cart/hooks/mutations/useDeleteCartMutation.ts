import { useLocaleParts } from '@/shared/hooks/useLocaleParts'
import { useCheckoutStore } from '@/shared/store/cart/useCheckoutStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import deleteCartAction from '@/features/cart/actions/deleteCartAction'

const useDeleteCartMutation = () => {
	const queryClient = useQueryClient()
	const { raw: locale } = useLocaleParts()
	const { clearStore } = useCheckoutStore()

	const mutation = useMutation({
		mutationFn: async () => await deleteCartAction(locale),
		onSuccess: () => {
			clearStore()
			queryClient.invalidateQueries({ queryKey: ['cart', locale] })
		},
		onError: (error) => {
			console.error('Error deleting cart:', error)
		},
	})
	return mutation
}

export default useDeleteCartMutation
