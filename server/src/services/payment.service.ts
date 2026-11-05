import { commerce } from '../config.js'
import type { Db } from '../db/client.js'
import { toOrderDto } from '../dto/order.dto.js'
import { HttpError, conflict } from '../errors.js'
import type { PaymentInput } from '../schemas/order.schemas.js'
import { loadOrder } from './order.service.js'
import { lockSession } from './session.service.js'

const outcomeOf = { success: 'SUCCESS', failure: 'FAILURE' } as const

// Simulated payment. No card data is accepted or stored; the requested outcome
// decides the result. Each non-replayed attempt is persisted as a transaction.
export function payOrder(
	db: Db,
	sessionId: string,
	orderId: string,
	input: PaymentInput,
) {
	return db.$transaction(async (tx) => {
		await lockSession(tx, sessionId)
		const order = await loadOrder(tx, sessionId, orderId)
		const outcome = outcomeOf[input.outcome]

		const previous = await tx.paymentTransaction.findUnique({
			where: { idempotencyKey: input.idempotencyKey },
		})
		if (previous) {
			if (previous.orderId !== order.id || previous.outcome !== outcome)
				throw conflict('Payment key conflict')
			return toOrderDto(order)
		}

		// An authorised order is never charged again.
		if (order.paymentStatus === 'AUTHORISED') return toOrderDto(order)
		if (order._count.transactions >= commerce.maxPaymentAttempts)
			throw new HttpError(429, 'Demo payment attempt limit reached')

		const authorised = outcome === 'SUCCESS'
		await tx.paymentTransaction.create({
			data: {
				orderId: order.id,
				idempotencyKey: input.idempotencyKey,
				outcome,
				resultStatus: authorised ? 'AUTHORISED' : 'REFUSED',
				amountCents: order.totalCents,
				currency: order.currency,
			},
		})
		await tx.order.update({
			where: { id: order.id },
			data: {
				paymentStatus: authorised ? 'AUTHORISED' : 'REFUSED',
				status: authorised ? 'CONFIRMED' : 'PAYMENT_FAILED',
			},
		})
		return toOrderDto(await loadOrder(tx, sessionId, order.id))
	})
}
