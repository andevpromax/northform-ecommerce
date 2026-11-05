import { PaymentMethodsSchema } from '@/shared/cms/types/fields'
import type { PaymentMethodsResponse } from '@/shared/schemas/paymentMethods'
import { z } from 'zod'

export const CartPaymentMethodSchema = z.object({
	paymentMethods: PaymentMethodsSchema,
})

type Params = {
	paymentMethodsResponse: PaymentMethodsResponse
}

const getMethods = ({ paymentMethodsResponse }: Params) => {
	const storedList = paymentMethodsResponse.storedPaymentMethodList ?? []
	const now = new Date()

	const buildProviders = (type: string, brands?: string[]) =>
		(brands && brands.length > 0 ? brands : [type]).map((brand) => ({
			id: brand,
			name: brand,
			type,
		}))

	const buildStored = (type: string, brands?: string[]) =>
		storedList
			.filter((s) => brands?.includes(s.brand) ?? s.brand === type)
			.map((s) => {
				const expiryYear = Number(s.expiryYear)
				const expiryMonth = Number(s.expiryMonth)

				const expiryDate = new Date(
					2000 + expiryYear,
					expiryMonth,
					0,
					23,
					59,
					59,
				)

				return {
					...s,
					isExpired: expiryDate < now,
				}
			})

	return (paymentMethodsResponse.paymentMethods ?? []).map((method) => ({
		id: method.type,
		name: method.name,
		type: method.type,
		providers: buildProviders(method.type, method.brands ?? undefined),
		stored: buildStored(method.type, method.brands ?? undefined),
		isExternalPaymentMethod: method.isExternalPaymentMethod,
	}))
}

export type GetMethodsReturnType = ReturnType<typeof getMethods>
export default getMethods
