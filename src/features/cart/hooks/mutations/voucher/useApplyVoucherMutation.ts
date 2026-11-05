import { useLocaleParts } from '@/shared/hooks/useLocaleParts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { applyVoucherAction } from '@/features/cart/actions/applyVoucherAction'

type VoucherPayload = {
	voucherCode: string
	locale: string
	cartId: string
}

const useApplyVoucherMutation = () => {
	const queryClient = useQueryClient()
	const { raw: locale } = useLocaleParts()

	const mutation = useMutation({
		mutationFn: async ({ voucherCode, cartId, locale }: VoucherPayload) =>
			await applyVoucherAction({ voucherId: voucherCode, locale, cartId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['cart', locale] })
		},
		onError: (error) => {
			console.error('Error applying voucher:', error)
		},
	})

	return mutation
}

export default useApplyVoucherMutation
