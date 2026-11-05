import { conflict, notFound } from '../errors.js'
import type { Prisma, Voucher } from '../generated/prisma/client.js'

export function voucherState(voucher: Voucher, now = new Date()) {
	if (!voucher.active) return 'inactive'
	if (voucher.validFrom && voucher.validFrom > now) return 'not_yet_valid'
	if (voucher.validUntil && voucher.validUntil <= now) return 'expired'
	return 'valid'
}

export const isVoucherValid = (voucher: Voucher | null, now = new Date()) =>
	!!voucher && voucherState(voucher, now) === 'valid'

const messages = {
	inactive: 'Voucher is not active',
	not_yet_valid: 'Voucher is not yet valid',
	expired: 'Voucher has expired',
} as const

export async function findApplicableVoucher(
	tx: Prisma.TransactionClient,
	code: string,
) {
	const voucher = await tx.voucher.findUnique({ where: { code } })
	if (!voucher) throw notFound('Voucher not found')
	const state = voucherState(voucher)
	if (state !== 'valid') throw conflict(messages[state])
	return voucher
}
