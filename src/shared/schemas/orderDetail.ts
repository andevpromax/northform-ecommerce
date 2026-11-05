import { z } from 'zod'

export const orderStatus = z.enum([
	'CANCELLED',
	'CANCELLING',
	'CHECKED_INVALID',
	'CHECKED_VALID',
	'COMPLETED',
	'CREATED',
	'FRAUD_CHECKED',
	'ON_VALIDATION',
	'ORDER_SPLIT',
	'PARTIALLY_DELIVERED',
	'PAYMENT_AMOUNT_NOT_RESERVED',
	'PAYMENT_AMOUNT_RESERVED',
	'PAYMENT_AUTHORIZED',
	'PAYMENT_CAPTURED',
	'PAYMENT_NOT_AUTHORIZED',
	'PAYMENT_NOT_CAPTURED',
	'PAYMENT_NOT_VOIDED',
	'PAYMENT_PENDING',
	'PROCESSING_ERROR',
	'SUSPENDED',
	'TAX_NOT_COMMITTED',
	'TAX_NOT_REQUOTED',
	'TAX_NOT_VOIDED',
	'WAIT_FRAUD_MANUAL_CHECK',
	'NOTSHIPPED',
])

export type OrderStatus = z.infer<typeof orderStatus>

export const orderProductSchema = z.object({
	code: z.string().nullable(),
	name: z.string().nullable(),
	imageUrl: z.string().url().nullable(),
	basePrice: z
		.object({
			value: z.number().nullable(),
			currencyIso: z.string().nullable(),
		})
		.nullable(),
	totalPrice: z
		.object({
			value: z.number().nullable(),
			currencyIso: z.string().nullable(),
		})
		.nullable(),
	totalDiscount: z
		.object({
			value: z.number().nullable(),
			currencyIso: z.string().nullable(),
		})
		.nullable(),
	totalDiscountNet: z
		.object({
			value: z.number().nullable(),
			currencyIso: z.string().nullable(),
		})
		.nullable(),
	size: z.string().nullable(),
	discountPercentage: z.string().nullable(),
})

export type OrderProduct = z.infer<typeof orderProductSchema>

export const shippingLabelSchema = z.object({
	shippingLabelId: z.string().nullable(),
	labelType: z.string().nullable(),
	shippingProvider: z.string().nullable(),
	trackingUrl: z.string().url().nullable(),
})

export type ShippingLabel = z.infer<typeof shippingLabelSchema>

export const orderDetailEntrySchema = z.object({
	product: orderProductSchema,
	quantity: z.number().nullable(),
	shippedQuantity: z.number().nullable(),
	shippingLabels: z.array(shippingLabelSchema).nullable(),
})

export type OrderDetailEntry = z.infer<typeof orderDetailEntrySchema>

export const orderDetailAddressSchema = z.object({
	name: z.string().nullable(),
	companyName: z.string().nullable(),
	street: z.string().nullable(),
	city: z.string().nullable(),
	zipCode: z.string().nullable(),
	country: z.object({
		isocode: z.string().nullable(),
		name: z.string().nullable(),
	}),
	phone: z.string().nullable(),
	email: z.string().email().nullable(),
})

export type OrderDetailAddress = z.infer<typeof orderDetailAddressSchema>

export const orderDetailApiResponseSchema = z.object({
	orderId: z.string().nullable(),
	orderDate: z.string().nullable(),
	shipmentDate: z.string().nullable(),
	deliveryStatus: z.enum(['NOTSHIPPED', 'PARTSHIPPED', 'SHIPPED']).nullable(),
	deliveryStatusDisplay: z.string().nullable(),
	paymentMethod: z.string().nullable(),
	paymentMethodCode: z.string().nullable(),
	totalPrice: z.object({
		currencyIso: z.string().nullable(),
		value: z.number().nullable(),
	}),
	orderDiscount: z.object({
		currencyIso: z.string().nullable(),
		value: z.number().nullable(),
	}),
	status: orderStatus.nullable(),
	statusDisplay: z.string().nullable(),
	invoices: z
		.array(
			z.object({
				invoiceDate: z.string().nullable(),
				docNumber: z.string().nullable(),
			}),
		)
		.nullable(),
	consignments: z
		.array(
			z.object({
				status: z.string().nullable(),
				statusDisplay: z.string().nullable(),
				statusDate: z.string().nullable(),
				deliveryMethod: z.string().url().nullable(),
				carrier: z.string().nullable(),
				trackingUrl: z.string().nullable(),
				entries: z.array(orderDetailEntrySchema).nullable(),
			}),
		)
		.nullable(),
	subtotal: z.number().nullable(),
	coupons: z
		.array(
			z.object({
				couponCode: z.string().nullable(),
				couponDiscount: z.number().nullable(),
			}),
		)
		.nullable(),
	shippingCost: z.number().nullable(),
	taxAmount: z.number().nullable(),
	billingAddress: orderDetailAddressSchema,
	deliveryAddress: orderDetailAddressSchema,
	entries: z.array(orderDetailEntrySchema).nullable(),
})

export type OrderDetailApiResponse = z.infer<
	typeof orderDetailApiResponseSchema
>
