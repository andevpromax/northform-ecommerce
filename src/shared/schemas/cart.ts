import { z } from 'zod'
import { shippingLabelSchema } from '@/shared/schemas/orderDetail'

export const AddToCartAPIResponseSchema = z.object({
	cartId: z.string(),
	sku: z.string(),
	sku_name: z.string(),
	quantity: z.number(),
	currencyISO: z.string(),
	totalPrice: z.number(),
})

export type AddToCartAPIResponse = z.infer<typeof AddToCartAPIResponseSchema>

export const CartAppliedVoucherSchema = z.object({
	code: z.string().nullable(),
	description: z.string().nullable(),
	name: z.string().nullable().optional(),
	voucherCode: z.string().nullable().optional(),
	freeShipping: z.boolean().optional(),
	value: z.number().optional(),
	valueFormatted: z.string().nullable().optional(),
	valueString: z.string().nullable().optional(),
	appliedValue: z
		.object({
			priceType: z.string().nullable().optional(),
			currencyIso: z.string().nullable().optional(),
			formattedValue: z.string().nullable().optional(),
			maxQuantity: z.number().optional(),
			minQuantity: z.number().optional(),
			value: z.number(),
		})
		.optional(),
	currency: z
		.object({
			active: z.boolean().optional(),
			isocode: z.string().nullable().optional(),
			name: z.string().nullable().optional(),
			symbol: z.string().nullable().optional(),
		})
		.optional(),
})

export type CartAppliedVoucher = z.infer<typeof CartAppliedVoucherSchema>

const CartPromotionConsumedEntrySchema = z.object({
	adjustedUnitPrice: z.number().optional(),
	code: z.string().nullable().optional(),
	orderEntryNumber: z.number().optional(),
	quantity: z.number().optional(),
})

const CartPromotionDetailsSchema = z.object({
	code: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	enabled: z.boolean().optional(),
	title: z.string().nullable().optional(),
	promotionType: z.enum(['percentage', 'fixed']).nullable().optional(),
	promotionGroup: z.string().nullable().optional(),
	priority: z.number().optional(),
	startDate: z.string().nullable().optional(),
	endDate: z.string().nullable().optional(),
	voucherCodes: z.string().nullable().optional(),
	discount: z.string().nullable().optional(),
})

export const CartAppliedPromotionItemSchema = z.object({
	consumedEntries: z.array(CartPromotionConsumedEntrySchema).optional(),
	description: z.string().nullable().optional(),
	promotion: CartPromotionDetailsSchema.optional(),
})

export type CartAppliedPromotionItem = z.infer<
	typeof CartAppliedPromotionItemSchema
>

export const CartEntrySchema = z.object({
	entryNumber: z.number().nullable(),
	quantity: z.number().nullable(),
	totalPrice: z.object({
		value: z.number(),
		currencyISO: z.string().nullable(),
	}),
	product: z.object({
		sku: z.string().nullable(),
		name: z.string().nullable(),
		dimensions: z.string().nullable(),
		price: z.object({
			value: z.number(),
			currencyISO: z.string().nullable(),
		}),
		originalPrice: z
			.object({
				value: z.number(),
				currencyISO: z.string().nullable(),
			})
			.optional(),
		discount: z.string().nullable(),
		imageUrl: z.string().nullable(),
	}),
	shippingLabels: z.array(shippingLabelSchema).nullable().optional(),
})

export type CartEntry = z.infer<typeof CartEntrySchema>

export const CartAddressSchema = z.object({
	id: z.string(),
	firstName: z.string().nullable(),
	lastName: z.string().nullable(),
	line1: z.string().nullable(),
	town: z.string().nullable(),
	postalCode: z.string().nullable(),
	country: z.object({
		isocode: z.string().nullable(),
		name: z.string().nullable(),
	}),
})

export type CartAddress = z.infer<typeof CartAddressSchema>

export const PaymentInfoSchema = z.object({
	accountHolderName: z.string().nullable(),
	cardNumber: z.string().nullable(),
	cardType: z.object({
		code: z.string().nullable(),
	}),
	expiryMonth: z.string().nullable(),
	expiryYear: z.string().nullable(),
	billingAddress: CartAddressSchema,
})

export type PaymentInfo = z.infer<typeof PaymentInfoSchema>

export const cartDetailResponseDataSchema = z.object({
	cartId: z.string().nullable(),
	subtotal: z.number(),
	VAT: z.number(),
	VATPercentage: z.number().optional(),
	shippingPrice: z.number(),
	totalPrice: z.number(),
	currencyISO: z.string().nullable(),
	referenceId: z.string().nullable(),
	fiscalCode: z.string().nullable(),
	totalNumberOfItems: z.number(),
	entries: z.array(CartEntrySchema),
	appliedVouchers: z.array(CartAppliedVoucherSchema).nullable().optional(),
	appliedOrderPromotions: z
		.array(CartAppliedPromotionItemSchema)
		.nullable()
		.optional(),
	appliedProductPromotions: z
		.array(CartAppliedPromotionItemSchema)
		.nullable()
		.optional(),
	deliveryAddress: CartAddressSchema.optional(),
	billingAddress: CartAddressSchema.optional(),
	paymentInfo: PaymentInfoSchema.optional(),
	orderDiscounts: z.number().optional(),
	productDiscounts: z.number().optional(),
	totalDiscounts: z.number().optional(),
	hasInstallationProduct: z.boolean().optional(),
})

export type CartDetailsResponseData = z.infer<
	typeof cartDetailResponseDataSchema
>

export const CartDetailsResponseSchema = z.object({
	success: z.boolean(),
	error: z.string().optional(),
	status: z.number().optional(),
	message: z.string().optional(),
	forwardedMessage: z.string().optional(),
	data: cartDetailResponseDataSchema.optional(),
})

export type CartDetailsResponse = z.infer<typeof CartDetailsResponseSchema>
