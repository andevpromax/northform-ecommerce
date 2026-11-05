import { createHash } from 'node:crypto'
import { commerce } from '../config.js'
import type { Db } from '../db/client.js'
import { toOrderDto } from '../dto/order.dto.js'
import { HttpError, conflict, notFound } from '../errors.js'
import type { Prisma } from '../generated/prisma/client.js'
import type { CreateOrderInput } from '../schemas/order.schemas.js'
import { orderIdSchema } from '../schemas/order.schemas.js'
import { assertPurchasable, cartPricing, loadCart } from './cart.service.js'
import { lockSession, touchSession } from './session.service.js'

type Tx = Prisma.TransactionClient | Db

const orderInclude = {
	items: { orderBy: { entryNumber: 'asc' } },
	_count: { select: { transactions: true } },
} satisfies Prisma.OrderInclude

export async function loadOrder(tx: Tx, sessionId: string, orderId: string) {
	// Non-UUID ids and other sessions' orders are indistinguishable from missing ones.
	if (!orderIdSchema.safeParse(orderId).success)
		throw notFound('Order not found')
	const order = await tx.order.findFirst({
		where: { id: orderId, sessionId },
		include: orderInclude,
	})
	if (!order) throw notFound('Order not found')
	return order
}

const fingerprintOf = (customer: CreateOrderInput['customer']) =>
	createHash('sha256').update(JSON.stringify(customer)).digest('hex')

export function createOrder(
	db: Db,
	sessionId: string,
	input: CreateOrderInput,
) {
	return db.$transaction(async (tx) => {
		await lockSession(tx, sessionId)
		const requestFingerprint = fingerprintOf(input.customer)

		const previous = await tx.order.findUnique({
			where: {
				sessionId_idempotencyKey: {
					sessionId,
					idempotencyKey: input.idempotencyKey,
				},
			},
		})
		if (previous) {
			if (previous.requestFingerprint !== requestFingerprint)
				throw conflict(
					'Idempotency key already used with different customer details',
				)
			return {
				created: false,
				order: toOrderDto(await loadOrder(tx, sessionId, previous.id)),
			}
		}

		const orderCount = await tx.order.count({ where: { sessionId } })
		if (orderCount >= commerce.maxOrdersPerSession)
			throw new HttpError(429, 'Demo order limit reached')

		const cart = await loadCart(tx, sessionId)
		if (!cart?.items.length) throw conflict('Your cart is empty')
		for (const item of cart.items)
			assertPurchasable(item.product, item.quantity)

		// Prices come from the database, never from the request.
		const { lines, voucher, totals } = cartPricing(cart)
		const order = await tx.order.create({
			data: {
				sessionId,
				idempotencyKey: input.idempotencyKey,
				requestFingerprint,
				currency: commerce.currency,
				...totals,
				voucherCode: voucher?.code ?? null,
				voucherDescription: voucher?.description ?? null,
				...input.customer,
				items: {
					create: cart.items.map((item, entryNumber) => ({
						productId: item.productId,
						entryNumber,
						sku: lines[entryNumber].sku,
						name: lines[entryNumber].name,
						category: lines[entryNumber].category,
						imageUrl: lines[entryNumber].imageUrl,
						unitPriceCents: lines[entryNumber].unitPriceCents,
						quantity: item.quantity,
						lineTotalCents: lines[entryNumber].unitPriceCents * item.quantity,
					})),
				},
			},
		})

		await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
		await tx.cart.update({
			where: { id: cart.id },
			data: { voucherCode: null },
		})

		return {
			created: true,
			order: toOrderDto(await loadOrder(tx, sessionId, order.id)),
		}
	})
}

export async function getOrder(db: Db, sessionId: string, orderId: string) {
	await touchSession(db, sessionId)
	return toOrderDto(await loadOrder(db, sessionId, orderId))
}

export async function getLatestOrder(db: Db, sessionId: string) {
	await touchSession(db, sessionId)
	const order = await db.order.findFirst({
		where: { sessionId },
		orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
		include: orderInclude,
	})
	if (!order) throw notFound('No orders found')
	return toOrderDto(order)
}
