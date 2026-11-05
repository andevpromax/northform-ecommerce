import type { useT } from 'talkr'
import { z } from 'zod'
import { compose } from '@/shared/schemas/utils/compose'

const VOUCHER_CODE_REGEX = /^[a-zA-Z0-9\-+]*$/u

export const voucherFormSchema = z.object({
	voucherCode: z.string(),
})

export type VoucherFormValues = z.infer<typeof voucherFormSchema>

export const voucherFormSchemaWithErrors = (T: ReturnType<typeof useT>['T']) =>
	voucherFormSchema.extend({
		voucherCode: voucherFormSchema.shape.voucherCode
			.min(1, { message: T('cart.code_required') })
			// Limited to latin characters (with diacritics), numbers, and +, - symbols
			.regex(VOUCHER_CODE_REGEX, { message: T('cart.code_not_valid') })
			.max(50, {
				message: compose(T('cart.code_character_limit'), { limit: 50 }),
			}),
	})
