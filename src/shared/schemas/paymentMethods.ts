import { z } from 'zod'

//> API Schemas
export const StoredPaymentMethodSchema = z.object({
	id: z.string(),
	name: z.string(),
	brand: z.string(),
	expiryMonth: z.string(),
	expiryYear: z.string(),
	holderName: z.string(),
	lastFour: z.string(),
})

export type StoredPaymentMethod = z.infer<typeof StoredPaymentMethodSchema>

export const PaymentMethodSchema = z.object({
	name: z.string(),
	type: z.string(),
	brands: z.array(z.string()).nullable(),
	isExternalPaymentMethod: z.boolean(),
})

//> Request
export const PaymentMethodsRequestSchema = z.object({
	cartId: z.string(),
	locale: z.string(),
})

export type PaymentMethodsRequest = z.infer<typeof PaymentMethodsRequestSchema>

//> Response
export const PaymentMethodsResponseSchema = z.object({
	paymentMethods: z.array(PaymentMethodSchema),
	storedPaymentMethodList: z.array(StoredPaymentMethodSchema).optional(),
})

export type PaymentMethodsResponse = z.infer<
	typeof PaymentMethodsResponseSchema
>

export const CreditCardSchema = z.object({
	id: z.string(),
	expiryMonth: z.string(),
	expiryYear: z.string(),
	lastFour: z.string(),
	ccType: z.string(),
})

export type CreditCard = z.infer<typeof CreditCardSchema>
