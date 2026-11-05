import type { CartAppliedVoucher, CartEntry } from '@/shared/schemas/cart'
import type {
	OrderDetailApiResponse,
	OrderDetailEntry,
} from '@/shared/schemas/orderDetail'
import type {
	Product,
	ProductDetailAPIResponse,
	ProductFinish,
	ProductPriceUpdated,
} from '@/shared/schemas/product'
import { roundMoney } from '@/shared/utils/roundMoney'

import type {
	EcommerceItem,
	EcommerceProductFields,
} from '@/features/tracking/ecommerce/types'

export const ECOMMERCE_AFFILIATION_ONLINE_STORE = 'online store'
export const ECOMMERCE_ITEM_LIST_CART_ID = 'cart'
export const ECOMMERCE_ITEM_LIST_CART_NAME = 'cart'

export type TrackingPriceResult = {
	/** Full pre-discount price per unit */
	price: number
	/** Monetary discount per unit */
	discount: number
	/** Post-discount value per unit (what the customer pays) */
	value: number
	/** Currency code */
	currency: string | undefined
}

const ZERO_PRICE: TrackingPriceResult = {
	price: 0,
	discount: 0,
	value: 0,
	currency: undefined,
}

export const resolveTrackingPrice = (
	pricing: ProductPriceUpdated | undefined,
): TrackingPriceResult => {
	if (!pricing) return ZERO_PRICE

	const preDiscountValue = pricing.userPriceVAT ?? 0
	const discountedPrice = pricing.discountedPriceVAT ?? 0
	const isPromotionActive = Boolean(pricing.promotionId) && discountedPrice > 0

	const price = roundMoney(preDiscountValue)
	const value = roundMoney(
		isPromotionActive ? discountedPrice : preDiscountValue,
	)
	const discount = isPromotionActive
		? roundMoney(Math.max(0, preDiscountValue - discountedPrice))
		: 0

	return { price, discount, value, currency: pricing.currencyISO }
}

/** `promotionId` from product pricing (per-item promotion), when set */
export const itemCouponFromPricing = (
	pricing: ProductPriceUpdated | undefined,
): string | undefined => {
	const id = pricing?.promotionId?.trim()
	return id || undefined
}

export const resolveCartEntryPrice = (
	entry: CartEntry,
): TrackingPriceResult => {
	const product = entry.product
	const qty = entry.quantity || 1
	const salePrice = product.price.value
	const original = product.originalPrice?.value ?? salePrice

	const unitPreDiscountValue = roundMoney(original / qty)
	const unitDiscountedValue = roundMoney(salePrice / qty)
	const unitDiscount = roundMoney(
		unitPreDiscountValue > unitDiscountedValue
			? unitPreDiscountValue - unitDiscountedValue
			: 0,
	)

	return {
		price: unitPreDiscountValue,
		discount: unitDiscount,
		value: unitDiscountedValue,
		currency: product.price.currencyISO || undefined,
	}
}

export const resolveOrderEntryPrice = (
	entry: OrderDetailEntry,
): TrackingPriceResult => {
	const qty = entry.quantity ?? 1
	const product = entry.product

	if (product.totalPrice == null) {
		return { price: 0, discount: 0, value: 0, currency: undefined }
	}

	const totalPriceVal = product.totalPrice.value ?? 0
	const totalDiscountVal = (product.basePrice?.value ?? 0) - totalPriceVal / qty

	const unitValue = qty > 0 ? roundMoney(totalPriceVal / qty) : 0
	const unitDiscount = qty > 0 ? roundMoney(totalDiscountVal) : 0
	const unitListPrice = roundMoney(product.basePrice?.value ?? 0)

	return {
		price: unitListPrice,
		discount: unitDiscount,
		value: unitValue,
		currency: product.totalPrice.currencyIso || undefined,
	}
}

const pathDepth = (path: string): number =>
	path.split('/').filter(Boolean).length

const categoryNamesFromProductDetail = (
	product: ProductDetailAPIResponse,
): string[] => {
	const groups = product.categories ?? []

	if (groups.length === 0) return []

	const chosen =
		groups.find((g) => g.type?.toLowerCase().includes('primary')) ??
		groups.find((g) => (g.values?.length ?? 0) > 0)

	if (!chosen?.values?.length) return []

	const sorted = [...chosen.values].sort(
		(a, b) => pathDepth(a.path) - pathDepth(b.path),
	)

	return sorted.map((v) => v.name.trim()).filter(Boolean)
}

const assignCategoryLevels = (
	names: string[],
): Pick<
	EcommerceItem,
	| 'item_category'
	| 'item_category_2'
	| 'item_category_3'
	| 'item_category_4'
	| 'item_category_5'
> => {
	const [c1, c2, c3, c4, c5] = names

	return {
		...(c1 ? { item_category: c1 } : { item_category: 'n/a' }),
		...(c2 ? { item_category_2: c2 } : {}),
		...(c3 ? { item_category_3: c3 } : {}),
		...(c4 ? { item_category_4: c4 } : {}),
		...(c5 ? { item_category_5: c5 } : {}),
	}
}

const resolveFinishVariantLabel = (
	product: ProductDetailAPIResponse,
	activeSku?: string,
): string => {
	const finishGroup = product.variants?.find((v) => v.type === 'FinishVariants')
	const values = finishGroup?.values ?? []

	if (!values.length) {
		return 'n/a'
	}

	if (activeSku) {
		const match = values.find((vv) => vv.sku === activeSku)
		const name = match?.finish?.name ?? match?.text

		if (name) {
			return `color: ${name.trim().toLowerCase()}`
		}
	}

	const first = values[0]
	const name = first?.finish?.name ?? first?.text

	if (!name?.trim()) {
		return 'n/a'
	}

	return `color: ${name.trim().toLowerCase()}`
}

/**
 * Finds the finish in a PLP Product that matches the given SKU.
 * Falls back to the first finish if no match.
 */
const findFinishBySku = (
	product: Product,
	sku: string,
): ProductFinish | undefined => {
	if (sku) {
		const match = product.finishes.find((f) => f.sku === sku)
		if (match) return match
	}

	return product.finishes[0]
}

/**
 * Maps a PLP/search Product to ecommerce product fields.
 * Used by useEcommerceEnrichment for checkout/purchase events where
 * cart/order entries only have a SKU and need additional data.
 */
export const mapSearchProductToProductFields = (
	product: Product,
	sku?: string,
): EcommerceProductFields => {
	const finish = findFinishBySku(product, sku ?? '')
	const categories = assignCategoryLevels(product.categories ?? [])

	return {
		ean: finish?.ean?.toString() ?? 'n/a',
		item_brand: product.isSpa ? 'grohe spa' : 'grohe',
		...categories,
		item_variant: finish?.color
			? `color: ${finish.color.toLowerCase()}`
			: 'n/a',
		mots: 'n/a',
		productLine: product.collection || 'n/a',
		room: 'n/a',
		size: finish?.size || 'n/a',
		subbrand: product.subBrand || 'n/a',
		sustainabilityFeatures: 'n/a',
	}
}

export type MapProductDetailToEcommerceItemOptions = {
	quantity: number
	/** 1-based */
	index: number
	/** Full pre-discount price per unit (internal; used with `value` to compute `discount` only when needed) */
	price: number
	/** Monetary discount per unit */
	discount: number
	/** Post-discount price per unit — mapped to item `price` */
	value: number
	currency?: string
	pricing?: ProductPriceUpdated
	/** When set, used to pick the matching finish variant label */
	activeSku?: string
}

/**
 * Maps a product detail to an ecommerce item
 */
export const mapProductDetailToEcommerceItem = (
	product: ProductDetailAPIResponse,
	options: MapProductDetailToEcommerceItemOptions,
): EcommerceItem => {
	const subBrand = product.IsWatersystems
		? 'watersystems'
		: product.isSpa
			? 'spa'
			: 'n/a'
	const brand = product.brand?.trim().toLowerCase()
	const categoryNames = categoryNamesFromProductDetail(product)
	const categories = assignCategoryLevels(categoryNames)
	const variantLabel = resolveFinishVariantLabel(product, options.activeSku)

	return {
		item_name: product.title,
		item_id: product.sku,
		price: roundMoney(options.value),
		discount: roundMoney(options.discount),
		item_brand: brand || 'n/a',
		...categories,
		item_variant: variantLabel,
		ean: product.ean,
		quantity: options.quantity,
		...(options.currency ? { currency: options.currency } : {}),
		index: options.index,
		coupon: itemCouponFromPricing(options.pricing) ?? 'n/a',
		affiliation: ECOMMERCE_AFFILIATION_ONLINE_STORE,
		mots: 'n/a',
		productLine: product.collection || 'n/a',
		room: 'n/a',
		size: 'n/a',
		subbrand: subBrand,
		sustainabilityFeatures: 'n/a',
	}
}

export type MapCartEntryToItemOptions = {
	/** 1-based */
	index: number
	productFields?: EcommerceProductFields | null
	/** Per-SKU pricing — used only for `coupon` (`promotionId`) */
	pricing?: ProductPriceUpdated
}

export const mapCartEntryToItem = (
	entry: CartEntry,
	options: MapCartEntryToItemOptions,
): EcommerceItem => {
	const product = entry.product
	const sku = product.sku?.trim() ?? ''
	const { discount, value, currency } = resolveCartEntryPrice(entry)

	const base: EcommerceItem = {
		item_id: sku,
		item_name: product.name?.trim() ?? '',
		price: roundMoney(value),
		discount: roundMoney(discount),
		item_brand: 'grohe',
		item_category: 'n/a',
		item_variant: 'n/a',
		ean: 'n/a',
		quantity: entry.quantity ?? 0,
		...(currency ? { currency } : {}),
		item_list_id: ECOMMERCE_ITEM_LIST_CART_ID,
		item_list_name: ECOMMERCE_ITEM_LIST_CART_NAME,
		index: options.index,
		coupon: itemCouponFromPricing(options.pricing) ?? 'n/a',
		affiliation: ECOMMERCE_AFFILIATION_ONLINE_STORE,
		mots: 'n/a',
		productLine: 'n/a',
		room: 'n/a',
		size: 'n/a',
		subbrand: 'n/a',
		sustainabilityFeatures: 'n/a',
	}

	if (options.productFields) {
		return { ...base, ...options.productFields }
	}

	return base
}

export type MapOrderEntryToItemOptions = {
	/** 1-based */
	index: number
	productFields?: EcommerceProductFields | null
	/** Per-SKU pricing — used only for `coupon` (`promotionId`) */
	pricing?: ProductPriceUpdated
}

export const mapOrderEntryToItem = (
	entry: OrderDetailEntry,
	options: MapOrderEntryToItemOptions,
): EcommerceItem => {
	const product = entry.product
	const code = product.code?.trim() ?? ''
	const name = product.name?.trim() ?? ''
	const { discount, value, currency } = resolveOrderEntryPrice(entry)

	const base: EcommerceItem = {
		item_id: code,
		item_name: name,
		price: roundMoney(value),
		discount: roundMoney(discount),
		item_brand: 'grohe',
		item_category: 'n/a',
		item_variant: 'n/a',
		ean: 'n/a',
		quantity: entry.quantity ?? 1,
		...(currency ? { currency } : {}),
		item_list_id: ECOMMERCE_ITEM_LIST_CART_ID,
		item_list_name: ECOMMERCE_ITEM_LIST_CART_NAME,
		index: options.index,
		coupon: itemCouponFromPricing(options.pricing) ?? 'n/a',
		affiliation: ECOMMERCE_AFFILIATION_ONLINE_STORE,
		mots: 'n/a',
		productLine: 'n/a',
		room: 'n/a',
		size: product.size?.trim() || 'n/a',
		subbrand: 'n/a',
		sustainabilityFeatures: 'n/a',
	}

	if (options.productFields) {
		return { ...base, ...options.productFields }
	}

	return base
}

export type MapPLPProductToItemOptions = {
	/** 1-based */
	index: number
	item_list_id: string
	item_list_name: string
	/** Defaults to first finish */
	finishIndex?: number
	/** Defaults to 1 */
	quantity?: number
}

/**
 * Maps a product listing product item to an ecommerce item
 */
export const mapPLPProductToItem = (
	product: Product,
	pricing: ProductPriceUpdated | undefined,
	options: MapPLPProductToItemOptions,
): EcommerceItem => {
	const fi = options.finishIndex ?? 0
	const finish = product.finishes[fi]

	const itemId = finish?.sku || product.baseSku
	const itemVariant = finish?.color
		? `color: ${finish?.color.toLowerCase()}`
		: null

	const { value, discount, currency } = resolveTrackingPrice(pricing)

	const categories = assignCategoryLevels(product.categories ?? [])

	return {
		item_name: product.title,
		item_id: itemId,
		price: roundMoney(value),
		discount: roundMoney(discount),
		item_brand: product.isSpa ? 'grohe spa' : 'grohe',
		...categories,
		item_variant: itemVariant ?? 'n/a',
		ean: finish?.ean?.toString() ?? 'n/a',
		quantity: options.quantity ?? 1,
		currency,
		item_list_id: options.item_list_id,
		item_list_name: options.item_list_name,
		index: options.index,
		size: finish?.size || 'n/a',
		subbrand: product.subBrand || 'n/a',
		productLine: product.collection || 'n/a',
		affiliation: ECOMMERCE_AFFILIATION_ONLINE_STORE,

		coupon: itemCouponFromPricing(pricing) ?? 'n/a',
		mots: 'n/a',
		room: 'n/a',
		sustainabilityFeatures: 'n/a',
	}
}

export const mapCartCoupon = (
	appliedVouchers: CartAppliedVoucher[] | null | undefined,
): string => {
	const codes = (appliedVouchers ?? [])
		.map((v) => v.code?.trim())
		.filter((code): code is string => !!code)
	return codes.length > 0 ? codes.join(', ') : 'n/a'
}

export const mapOrderCoupon = (
	coupons: OrderDetailApiResponse['coupons'] | undefined,
): string => {
	const codes = (coupons ?? [])
		.map((c) => c.couponCode?.trim())
		.filter((code): code is string => !!code)
	return codes.length > 0 ? codes.join(', ') : 'n/a'
}

export const mapCartEntriesToItems = (
	entries: CartEntry[],
	productFieldsMap?: Record<string, EcommerceProductFields>,
	prices?: Record<string, ProductPriceUpdated>,
): EcommerceItem[] => {
	return entries.map((entry, i) => {
		const sku = entry.product?.sku?.trim() ?? ''
		const productFields = productFieldsMap?.[sku] ?? null
		const pricing = prices?.[sku]
		return mapCartEntryToItem(entry, { index: i + 1, productFields, pricing })
	})
}

export const ecommerceEventForQuantityDelta = (
	delta: number,
): 'add_to_cart' | 'remove_from_cart' | null => {
	if (delta === 0) return null
	return delta > 0 ? 'add_to_cart' : 'remove_from_cart'
}

export const mapOrderEntriesToItems = (
	entries: OrderDetailEntry[],
	productFieldsMap?: Record<string, EcommerceProductFields>,
	prices?: Record<string, ProductPriceUpdated>,
): EcommerceItem[] => {
	return entries.map((entry, i) => {
		const sku = entry.product?.code?.trim() ?? ''
		const productFields = productFieldsMap?.[sku] ?? null
		const pricing = prices?.[sku]
		return mapOrderEntryToItem(entry, { index: i + 1, productFields, pricing })
	})
}
