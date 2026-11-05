import type { Order, OrderItem } from '../generated/prisma/client.js'
import { toCartDto } from './cart.dto.js'

const orderStatus = {
	AWAITING_PAYMENT: 'awaiting_payment',
	PAYMENT_FAILED: 'payment_failed',
	CONFIRMED: 'confirmed',
} as const

const paymentStatus = {
	PENDING: 'Pending',
	REFUSED: 'Refused',
	AUTHORISED: 'Authorised',
} as const

export type OrderWithItems = Order & {
	items: OrderItem[]
	_count: { transactions: number }
}

// Shape of the storefront Order type (src/shared/services/commerce.ts).
export const toOrderDto = (order: OrderWithItems) => ({
	id: order.id,
	createdAt: order.createdAt.toISOString(),
	customer: {
		firstName: order.firstName,
		lastName: order.lastName,
		email: order.email,
		streetAndNumber: order.streetAndNumber,
		city: order.city,
		zipCode: order.zipCode,
		country: order.country,
	},
	cart: toCartDto({
		cartId: null,
		lines: order.items.map((item) => ({ ...item, currency: order.currency })),
		totals: order,
		voucher:
			order.voucherCode && order.voucherDescription
				? { code: order.voucherCode, description: order.voucherDescription }
				: null,
	}),
	status: orderStatus[order.status],
	paymentStatus: paymentStatus[order.paymentStatus],
	attempts: order._count.transactions,
})

export type OrderDto = ReturnType<typeof toOrderDto>
