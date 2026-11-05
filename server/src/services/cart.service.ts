import { commerce } from '../config.js'
import type { Db } from '../db/client.js'
import { type CartLine, toCartDto } from '../dto/cart.dto.js'
import { conflict, notFound } from '../errors.js'
import type { Prisma, Product } from '../generated/prisma/client.js'
import { calculateTotals } from './pricing.js'
import { lockSession, touchSession } from './session.service.js'
import { findApplicableVoucher, isVoucherValid } from './voucher.service.js'

type Tx = Prisma.TransactionClient | Db

const cartInclude = {
	voucher: true,
	items: {
		orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
		include: { product: true },
	},
} satisfies Prisma.CartInclude

export function assertPurchasable(product: Product, quantity: number) {
	if (!product.available || quantity > product.stock)
		throw conflict('Requested quantity is unavailable')
}

export async function loadCart(tx: Tx, sessionId: string) {
	return tx.cart.findUnique({ where: { sessionId }, include: cartInclude })
}

type LoadedCart = NonNullable<Awaited<ReturnType<typeof loadCart>>>

// entryNumber is the position of a line in insertion order, as in the storefront.
export function cartLines(cart: LoadedCart | null): CartLine[] {
	return (cart?.items ?? []).map((item, entryNumber) => ({
		entryNumber,
		sku: item.product.sku,
		name: item.product.name,
		category: item.product.category,
		imageUrl: item.product.image,
		unitPriceCents: item.product.priceCents,
		quantity: item.quantity,
		currency: item.product.currency,
	}))
}

// A voucher that has since expired or been deactivated is not applied.
export function cartPricing(cart: LoadedCart | null) {
	const lines = cartLines(cart)
	const voucher =
		cart?.voucher && isVoucherValid(cart.voucher) ? cart.voucher : null
	return { lines, voucher, totals: calculateTotals(lines, voucher) }
}

export function toCartView(cart: LoadedCart | null) {
	const { lines, voucher, totals } = cartPricing(cart)
	return toCartDto({ cartId: cart?.id ?? null, lines, totals, voucher })
}

async function openCart(tx: Prisma.TransactionClient, sessionId: string) {
	await lockSession(tx, sessionId)
	return tx.cart.upsert({
		where: { sessionId },
		create: { sessionId },
		update: {},
	})
}

async function itemAt(
	tx: Prisma.TransactionClient,
	cartId: string,
	entryNumber: number,
) {
	const item = await tx.cartItem.findFirst({
		where: { cartId },
		orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
		skip: entryNumber,
		include: { product: true },
	})
	if (!item) throw notFound('Cart item not found')
	return item
}

export async function getCart(db: Db, sessionId: string) {
	await touchSession(db, sessionId)
	return toCartView(await loadCart(db, sessionId))
}

export function addItem(
	db: Db,
	sessionId: string,
	input: { sku: string; quantity: number },
) {
	return db.$transaction(async (tx) => {
		const product = await tx.product.findUnique({ where: { sku: input.sku } })
		if (!product) throw notFound('Product not found')
		const cart = await openCart(tx, sessionId)
		const existing = await tx.cartItem.findUnique({
			where: { cartId_productId: { cartId: cart.id, productId: product.id } },
		})
		const quantity = (existing?.quantity ?? 0) + input.quantity
		if (quantity > commerce.maxQuantity)
			throw conflict(`A cart line cannot exceed ${commerce.maxQuantity} items`)
		assertPurchasable(product, quantity)
		if (existing)
			await tx.cartItem.update({
				where: { id: existing.id },
				data: { quantity },
			})
		else
			await tx.cartItem.create({
				data: { cartId: cart.id, productId: product.id, quantity },
			})
		return toCartView(await loadCart(tx, sessionId))
	})
}

export function setItemQuantity(
	db: Db,
	sessionId: string,
	entryNumber: number,
	quantity: number,
) {
	return db.$transaction(async (tx) => {
		const cart = await openCart(tx, sessionId)
		const item = await itemAt(tx, cart.id, entryNumber)
		assertPurchasable(item.product, quantity)
		await tx.cartItem.update({ where: { id: item.id }, data: { quantity } })
		return toCartView(await loadCart(tx, sessionId))
	})
}

export function removeItem(db: Db, sessionId: string, entryNumber: number) {
	return db.$transaction(async (tx) => {
		const cart = await openCart(tx, sessionId)
		const item = await itemAt(tx, cart.id, entryNumber)
		await tx.cartItem.delete({ where: { id: item.id } })
		return toCartView(await loadCart(tx, sessionId))
	})
}

export function clearCart(db: Db, sessionId: string) {
	return db.$transaction(async (tx) => {
		await lockSession(tx, sessionId)
		const cart = await tx.cart.findUnique({ where: { sessionId } })
		if (cart) {
			await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
			await tx.cart.update({
				where: { id: cart.id },
				data: { voucherCode: null },
			})
		}
		return toCartView(await loadCart(tx, sessionId))
	})
}

export function applyVoucher(db: Db, sessionId: string, code: string) {
	return db.$transaction(async (tx) => {
		const voucher = await findApplicableVoucher(tx, code)
		const cart = await openCart(tx, sessionId)
		await tx.cart.update({
			where: { id: cart.id },
			data: { voucherCode: voucher.code },
		})
		return toCartView(await loadCart(tx, sessionId))
	})
}

export function removeVoucher(db: Db, sessionId: string) {
	return db.$transaction(async (tx) => {
		await lockSession(tx, sessionId)
		await tx.cart.updateMany({
			where: { sessionId },
			data: { voucherCode: null },
		})
		return toCartView(await loadCart(tx, sessionId))
	})
}
