import type { Db } from '../db/client.js'
import type { Prisma } from '../generated/prisma/client.js'

// Creates the guest session on first write and holds a row lock on it until the
// transaction ends. Every write for a session therefore runs serially, which
// keeps stock checks, idempotency checks and order limits race-free.
export async function lockSession(
	tx: Prisma.TransactionClient,
	sessionId: string,
) {
	await tx.guestSession.upsert({
		where: { id: sessionId },
		create: { id: sessionId },
		update: { lastSeenAt: new Date() },
	})
	await tx.$queryRaw`SELECT id FROM guest_sessions WHERE id = ${sessionId}::uuid FOR UPDATE`
}

// Reads never create a session; they only refresh activity of an existing one.
export async function touchSession(db: Db, sessionId: string) {
	await db.guestSession.updateMany({
		where: { id: sessionId },
		data: { lastSeenAt: new Date() },
	})
}

// Idle sessions lose their cart. Order history is kept: sessions that own
// orders are never deleted (orders.session_id is ON DELETE RESTRICT).
export async function expireSessions(
	db: Db,
	ttlHours: number,
	now = new Date(),
) {
	const cutoff = new Date(now.getTime() - ttlHours * 3_600_000)
	return db.$transaction(async (tx) => {
		const carts = await tx.cart.deleteMany({
			where: { session: { lastSeenAt: { lt: cutoff } } },
		})
		const sessions = await tx.guestSession.deleteMany({
			where: { lastSeenAt: { lt: cutoff }, orders: { none: {} } },
		})
		return { carts: carts.count, sessions: sessions.count }
	})
}
