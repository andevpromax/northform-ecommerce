import { useLocaleParts } from '@/shared/hooks/useLocaleParts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
	type RemoveVoucherPayload,
	removeVoucherAction,
} from '@/features/cart/actions/removeVoucherAction'

const useRemoveVoucherMutation = () => {
	const queryClient = useQueryClient()
	const { raw: locale } = useLocaleParts()

	const mutation = useMutation({
		mutationFn: async ({ voucherId, cartId }: RemoveVoucherPayload) =>
			await removeVoucherAction({ voucherId, locale, cartId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['cart', locale] })
		},
		onError: (error) => {
			console.error('Error removing voucher:', error)
		},
	})

	return mutation
}

export default useRemoveVoucherMutation
