import { z } from 'zod'
export type StringValue = { value?: string }
export type LinkValue = { value?: { href?: string; text?: string } }
export type ImageValue = {
	value: { src?: string; alt?: string; width?: string; height?: string }
}
export const PaymentMethodsSchema = z.object({})
export type PaymentMethods = z.infer<typeof PaymentMethodsSchema>
