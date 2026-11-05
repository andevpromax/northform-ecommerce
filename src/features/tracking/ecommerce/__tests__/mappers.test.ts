import type { CartAppliedVoucher, CartEntry } from '@/shared/schemas/cart'
import type {
	OrderDetailApiResponse,
	OrderDetailEntry,
} from '@/shared/schemas/orderDetail'
import type {
	Product,
	ProductDetailAPIResponse,
	ProductPriceUpdated,
} from '@/shared/schemas/product'
import { describe, expect, it } from 'vitest'

import {
	ECOMMERCE_AFFILIATION_ONLINE_STORE,
	ecommerceEventForQuantityDelta,
	itemCouponFromPricing,
	mapCartCoupon,
	mapCartEntriesToItems,
	mapCartEntryToItem,
	mapOrderCoupon,
	mapOrderEntriesToItems,
	mapOrderEntryToItem,
	mapPLPProductToItem,
	mapProductDetailToEcommerceItem,
	mapSearchProductToProductFields,
	resolveCartEntryPrice,
	resolveOrderEntryPrice,
	resolveTrackingPrice,
} from '../mappers'
import type { EcommerceEvent, EcommerceProductFields } from '../types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const basePLPProduct: Product = {
	baseSku: 'BASE-001',
	title: 'Test Shower',
	isSpa: false,
	isWs: false,
	isSp: false,
	categories: ['Bathroom', 'Showers', 'Hand showers'],
	collection: 'Euphoria',
	imageUrl: 'https://example.com/img.png',
	onlineBuyOnly: false,
	tags: [],
	finishes: [
		{
			id: 1,
			color: 'Chrome',
			name: 'Chrome',
			sku: 'SKU-001',
			slug: 'chrome',
			ean: 4005176,
			size: '150mm',
			image: 'https://example.com/chrome.png',
			icon: 'https://example.com/chrome-icon.png',
			onlineBuyOnly: false,
		},
		{
			id: 2,
			color: 'Brushed Nickel',
			name: 'Brushed Nickel',
			sku: 'SKU-002',
			slug: 'brushed-nickel',
			ean: 4005177,
			size: '200mm',
			image: 'https://example.com/nickel.png',
			icon: 'https://example.com/nickel-icon.png',
			onlineBuyOnly: false,
		},
	],
	subBrand: 'Professional',
}

const basePDPProduct: ProductDetailAPIResponse = {
	sku: 'PDP-001',
	market: 'en',
	slug: 'test-faucet',
	brand: 'GROHE',
	title: 'Test Faucet',
	collection: 'Essence',
	ean: '4005176000001',
	status: 'active',
	successor: null,
	IsWatersystems: false,
	isSpa: false,
	IsSparePart: false,
	tags: [],
	features: [],
	variants: [
		{
			type: 'FinishVariants',
			values: [
				{
					sku: 'PDP-001',
					slug: 'chrome',
					text: 'Chrome',
					finish: { id: 1, name: 'Chrome', icon: null },
				},
				{
					sku: 'PDP-002',
					slug: 'matte-black',
					text: 'Matte Black',
					finish: { id: 2, name: 'Matte Black', icon: null },
				},
			],
		},
	],
	media: [],
	categories: [
		{
			type: 'Primary Category',
			values: [
				{ id: 1, name: 'Kitchen', path: '/kitchen', slug: 'kitchen' },
				{ id: 2, name: 'Faucets', path: '/kitchen/faucets', slug: 'faucets' },
				{
					id: 3,
					name: 'Pull-out',
					path: '/kitchen/faucets/pull-out',
					slug: 'pull-out',
				},
			],
		},
	],
	details: [],
	where_to_buy_filter_ids: [],
}

const basePricing: ProductPriceUpdated = {
	sku: 'SKU-001',
	userPrice: 100,
	originalPrice: 120,
	currencyISO: 'EUR',
	transactibility: true,
	discountPercentage: 16.67,
	userPriceNet: 84.03,
	userPriceVAT: 100,
	discountedPriceNet: 84.03,
	discountedPriceVAT: 100,
}

const baseCartEntry: CartEntry = {
	entryNumber: 0,
	quantity: 2,
	totalPrice: { value: 200, currencyISO: 'EUR' },
	product: {
		sku: 'CART-SKU-001',
		name: 'Cart Product',
		dimensions: null,
		price: { value: 89.99, currencyISO: 'EUR' },
		originalPrice: { value: 109.99, currencyISO: 'EUR' },
		discount: '18%',
		imageUrl: 'https://example.com/cart.png',
	},
	shippingLabels: null,
}

const baseOrderEntry: OrderDetailEntry = {
	product: {
		code: 'ORD-SKU-001',
		name: 'Order Product',
		imageUrl: 'https://example.com/order.png',
		basePrice: { value: 50, currencyIso: 'EUR' },
		totalPrice: { value: 160, currencyIso: 'EUR' },
		totalDiscount: null,
		totalDiscountNet: { value: 40, currencyIso: 'EUR' },
		size: '250mm',
		discountPercentage: '20%',
	},
	quantity: 4,
	shippedQuantity: null,
	shippingLabels: null,
}

const productFields: EcommerceProductFields = {
	ean: '4005176999',
	item_brand: 'grohe',
	item_category: 'Bathroom',
	item_category_2: 'Showers',
	item_variant: 'color: chrome',
	mots: 'n/a',
	productLine: 'Euphoria',
	room: 'n/a',
	size: '150mm',
	subbrand: 'n/a',
	sustainabilityFeatures: 'n/a',
}

// ---------------------------------------------------------------------------
// resolveTrackingPrice
// ---------------------------------------------------------------------------

describe('resolveTrackingPrice', () => {
	it('returns zeroes with undefined currency when pricing is undefined', () => {
		const result = resolveTrackingPrice(undefined)

		expect(result).toEqual({
			price: 0,
			discount: 0,
			value: 0,
			currency: undefined,
		})
	})

	it('sets price to userPriceVAT and value to discountedPriceVAT when promotion is active', () => {
		const pricing: ProductPriceUpdated = {
			...basePricing,
			userPriceVAT: 120,
			discountedPriceVAT: 95,
			promotionId: 'PROMO-001',
		}
		const result = resolveTrackingPrice(pricing)

		expect(result.price).toBe(120)
		expect(result.value).toBe(95)
		expect(result.currency).toBe('EUR')
	})

	it('computes discount as userPriceVAT minus discountedPriceVAT when promotion is active', () => {
		const pricing: ProductPriceUpdated = {
			...basePricing,
			userPriceVAT: 120,
			discountedPriceVAT: 95,
			promotionId: 'PROMO-001',
		}
		const result = resolveTrackingPrice(pricing)

		expect(result.discount).toBe(25)
	})

	it('sets price and value both to userPriceVAT with zero discount when no promotionId', () => {
		const pricing: ProductPriceUpdated = {
			...basePricing,
			userPriceVAT: 100,
			discountedPriceVAT: 80,
		}
		const result = resolveTrackingPrice(pricing)

		expect(result.price).toBe(100)
		expect(result.value).toBe(100)
		expect(result.discount).toBe(0)
	})

	it('sets value to userPriceVAT when promotionId is set but discountedPriceVAT is 0', () => {
		const pricing: ProductPriceUpdated = {
			...basePricing,
			userPriceVAT: 100,
			discountedPriceVAT: 0,
			promotionId: 'PROMO-002',
		}
		const result = resolveTrackingPrice(pricing)

		expect(result.price).toBe(100)
		expect(result.value).toBe(100)
		expect(result.discount).toBe(0)
	})

	it('rounds values to 2 decimal places', () => {
		const pricing: ProductPriceUpdated = {
			...basePricing,
			userPriceVAT: 100.456,
			discountedPriceVAT: 79.123,
			promotionId: 'PROMO-003',
		}
		const result = resolveTrackingPrice(pricing)

		expect(result.price).toBe(100.46)
		expect(result.value).toBe(79.12)
		expect(result.discount).toBe(21.33)
	})

	it('clamps negative discount to 0', () => {
		const pricing: ProductPriceUpdated = {
			...basePricing,
			userPriceVAT: 80,
			discountedPriceVAT: 100,
			promotionId: 'PROMO-004',
		}
		const result = resolveTrackingPrice(pricing)

		expect(result.price).toBe(80)
		expect(result.value).toBe(100)
		expect(result.discount).toBe(0)
	})
})

// ---------------------------------------------------------------------------
// itemCouponFromPricing
// ---------------------------------------------------------------------------

describe('itemCouponFromPricing', () => {
	it('returns trimmed promotionId', () => {
		const pricing: ProductPriceUpdated = {
			...basePricing,
			promotionId: '  UK_AUTOLINE40691002_7GBP  ',
			promotionLabel: null,
		}
		expect(itemCouponFromPricing(pricing)).toBe('UK_AUTOLINE40691002_7GBP')
	})

	it('uses promotionId even when promotionLabel is set', () => {
		const pricing: ProductPriceUpdated = {
			...basePricing,
			promotionId: 'PROMO-X',
			promotionLabel: 'Summer Sale',
		}
		expect(itemCouponFromPricing(pricing)).toBe('PROMO-X')
	})

	it('returns undefined when promotionId is missing', () => {
		expect(itemCouponFromPricing(basePricing)).toBeUndefined()
	})
})

// ---------------------------------------------------------------------------
// resolveCartEntryPrice
// ---------------------------------------------------------------------------

describe('resolveCartEntryPrice', () => {
	it('computes per-unit price, value, discount, and currency from line totals on a cart entry', () => {
		const result = resolveCartEntryPrice(baseCartEntry)

		expect(result.price).toBe(55)
		expect(result.value).toBe(45)
		expect(result.discount).toBe(10)
		expect(result.currency).toBe('EUR')
	})

	it('returns 0 discount when originalPrice is missing', () => {
		const noOriginal: CartEntry = {
			...baseCartEntry,
			product: { ...baseCartEntry.product, originalPrice: undefined },
		}
		const result = resolveCartEntryPrice(noOriginal)

		expect(result.discount).toBe(0)
	})

	it('returns 0 discount when originalPrice equals sale price', () => {
		const noDiscount: CartEntry = {
			...baseCartEntry,
			product: {
				...baseCartEntry.product,
				originalPrice: { value: 89.99, currencyISO: 'EUR' },
			},
		}
		const result = resolveCartEntryPrice(noDiscount)

		expect(result.discount).toBe(0)
	})

	it('returns undefined currency when currencyISO is falsy', () => {
		const noCurrency: CartEntry = {
			...baseCartEntry,
			product: {
				...baseCartEntry.product,
				price: { value: 89.99, currencyISO: null },
			},
		}
		const result = resolveCartEntryPrice(noCurrency)

		expect(result.currency).toBeUndefined()
	})
})

// ---------------------------------------------------------------------------
// resolveOrderEntryPrice
// ---------------------------------------------------------------------------

describe('resolveOrderEntryPrice', () => {
	it('uses basePrice as pre-discount unit price', () => {
		const result = resolveOrderEntryPrice(baseOrderEntry)

		expect(result.price).toBe(50)
		expect(result.value).toBe(40)
		expect(result.discount).toBe(10)
		expect(result.currency).toBe('EUR')
	})

	it('returns zero price, value, and discount when totalPrice is null', () => {
		const noTotal: OrderDetailEntry = {
			...baseOrderEntry,
			product: { ...baseOrderEntry.product, totalPrice: null },
		}
		const result = resolveOrderEntryPrice(noTotal)

		expect(result.price).toBe(0)
		expect(result.value).toBe(0)
		expect(result.discount).toBe(0)
		expect(result.currency).toBeUndefined()
	})

	it('returns undefined currency when currencyIso is falsy', () => {
		const noCurrency: OrderDetailEntry = {
			...baseOrderEntry,
			product: {
				...baseOrderEntry.product,
				totalPrice: { value: 200, currencyIso: null },
			},
		}
		const result = resolveOrderEntryPrice(noCurrency)

		expect(result.currency).toBeUndefined()
	})
})

// ---------------------------------------------------------------------------
// mapSearchProductToProductFields
// ---------------------------------------------------------------------------

describe('mapSearchProductToProductFields', () => {
	it('maps a standard PLP product correctly', () => {
		const result = mapSearchProductToProductFields(basePLPProduct, 'SKU-001')

		expect(result.ean).toBe('4005176')
		expect(result.item_brand).toBe('grohe')
		expect(result.item_category).toBe('Bathroom')
		expect(result.item_category_2).toBe('Showers')
		expect(result.item_category_3).toBe('Hand showers')
		expect(result.item_variant).toBe('color: chrome')
		expect(result.productLine).toBe('Euphoria')
		expect(result.subbrand).toBe('Professional')
		expect(result.size).toBe('150mm')
		expect(result.mots).toBe('n/a')
		expect(result.room).toBe('n/a')
		expect(result.sustainabilityFeatures).toBe('n/a')
	})

	it('sets item_brand to grohe spa when isSpa is true', () => {
		const spaProduct = { ...basePLPProduct, isSpa: true }
		const result = mapSearchProductToProductFields(spaProduct)

		expect(result.item_brand).toBe('grohe spa')
	})

	it('falls back to first finish when sku does not match', () => {
		const result = mapSearchProductToProductFields(
			basePLPProduct,
			'NONEXISTENT',
		)

		expect(result.item_variant).toBe('color: chrome')
		expect(result.ean).toBe('4005176')
	})

	it('defaults category to n/a when categories is empty', () => {
		const noCategories = { ...basePLPProduct, categories: [] }
		const result = mapSearchProductToProductFields(noCategories)

		expect(result.item_category).toBe('n/a')
		expect(result.item_category_2).toBeUndefined()
	})

	it('defaults item_variant to n/a when finish has no color', () => {
		const noColor = {
			...basePLPProduct,
			finishes: [{ ...basePLPProduct.finishes[0], color: '' }],
		}
		const result = mapSearchProductToProductFields(noColor)

		expect(result.item_variant).toBe('n/a')
	})

	it('defaults productLine to n/a when collection is empty', () => {
		const noCollection = { ...basePLPProduct, collection: '' }
		const result = mapSearchProductToProductFields(noCollection)

		expect(result.productLine).toBe('n/a')
	})

	it('defaults subbrand to n/a when subBrand is null', () => {
		const noSubBrand = { ...basePLPProduct, subBrand: null }
		const result = mapSearchProductToProductFields(noSubBrand)

		expect(result.subbrand).toBe('n/a')
	})
})

// ---------------------------------------------------------------------------
// mapProductDetailToEcommerceItem
// ---------------------------------------------------------------------------

describe('mapProductDetailToEcommerceItem', () => {
	const baseOptions = {
		quantity: 1,
		index: 1,
		price: 149.99,
		discount: 10,
		currency: 'EUR',
		activeSku: 'PDP-001',
		value: 139.99,
	}

	it('maps a standard PDP product correctly', () => {
		const result = mapProductDetailToEcommerceItem(basePDPProduct, baseOptions)

		expect(result.item_name).toBe('Test Faucet')
		expect(result.item_id).toBe('PDP-001')
		expect(result.price).toBe(139.99)
		expect(result.discount).toBe(10)
		expect(result.item_brand).toBe('grohe')
		expect(result.item_category).toBe('Kitchen')
		expect(result.item_category_2).toBe('Faucets')
		expect(result.item_category_3).toBe('Pull-out')
		expect(result.item_variant).toBe('color: chrome')
		expect(result.ean).toBe('4005176000001')
		expect(result.quantity).toBe(1)
		expect(result.currency).toBe('EUR')
		expect(result.index).toBe(1)
		expect(result.coupon).toBe('n/a')
		expect(result.affiliation).toBe(ECOMMERCE_AFFILIATION_ONLINE_STORE)
		expect(result.productLine).toBe('Essence')
		expect(result.mots).toBe('n/a')
		expect(result.room).toBe('n/a')
		expect(result.size).toBe('n/a')
		expect(result.sustainabilityFeatures).toBe('n/a')
	})

	it('resolves variant from activeSku', () => {
		const result = mapProductDetailToEcommerceItem(basePDPProduct, {
			...baseOptions,
			activeSku: 'PDP-002',
		})

		expect(result.item_variant).toBe('color: matte black')
	})

	it('sets subbrand to watersystems when IsWatersystems is true', () => {
		const wsProduct = { ...basePDPProduct, IsWatersystems: true }
		const result = mapProductDetailToEcommerceItem(wsProduct, baseOptions)

		expect(result.subbrand).toBe('watersystems')
	})

	it('sets subbrand to spa when isSpa is true', () => {
		const spaProduct = { ...basePDPProduct, isSpa: true }
		const result = mapProductDetailToEcommerceItem(spaProduct, baseOptions)

		expect(result.subbrand).toBe('spa')
	})

	it('sets brand to n/a when brand is null', () => {
		const noBrand = { ...basePDPProduct, brand: null }
		const result = mapProductDetailToEcommerceItem(noBrand, baseOptions)

		expect(result.item_brand).toBe('n/a')
	})

	it('sorts categories by path depth', () => {
		const deepCategories: ProductDetailAPIResponse = {
			...basePDPProduct,
			categories: [
				{
					type: 'Primary Category',
					values: [
						{ id: 3, name: 'Deep', path: '/a/b/c', slug: 'deep' },
						{ id: 1, name: 'Top', path: '/a', slug: 'top' },
						{ id: 2, name: 'Mid', path: '/a/b', slug: 'mid' },
					],
				},
			],
		}
		const result = mapProductDetailToEcommerceItem(deepCategories, baseOptions)

		expect(result.item_category).toBe('Top')
		expect(result.item_category_2).toBe('Mid')
		expect(result.item_category_3).toBe('Deep')
	})

	it('defaults category to n/a when categories is empty', () => {
		const noCat = { ...basePDPProduct, categories: [] }
		const result = mapProductDetailToEcommerceItem(noCat, baseOptions)

		expect(result.item_category).toBe('n/a')
		expect(result.item_category_2).toBeUndefined()
	})

	it('uses promotionId from pricing when set', () => {
		const pricing: ProductPriceUpdated = {
			...basePricing,
			sku: 'PDP-001',
			promotionId: 'PROMO-P1',
			promotionLabel: null,
		}
		const result = mapProductDetailToEcommerceItem(basePDPProduct, {
			...baseOptions,
			pricing,
		})

		expect(result.coupon).toBe('PROMO-P1')
	})

	it('rounds discounted price and discount to 2 decimal places', () => {
		const result = mapProductDetailToEcommerceItem(basePDPProduct, {
			...baseOptions,
			price: 99.999,
			discount: 5.555,
			value: 94.444,
		})

		expect(result.price).toBe(94.44)
		expect(result.discount).toBe(5.56)
	})

	it('sets variant to n/a when no FinishVariants group exists', () => {
		const noVariants = { ...basePDPProduct, variants: [] }
		const result = mapProductDetailToEcommerceItem(noVariants, baseOptions)

		expect(result.item_variant).toBe('n/a')
	})

	it('omits currency when not provided', () => {
		const result = mapProductDetailToEcommerceItem(basePDPProduct, {
			...baseOptions,
			currency: undefined,
		})

		expect(result.currency).toBeUndefined()
	})

	it('sets productLine to n/a when collection is empty', () => {
		const noCollection = { ...basePDPProduct, collection: '' }
		const result = mapProductDetailToEcommerceItem(noCollection, baseOptions)

		expect(result.productLine).toBe('n/a')
	})
})

// ---------------------------------------------------------------------------
// mapCartEntryToItem
// ---------------------------------------------------------------------------

describe('mapCartEntryToItem', () => {
	it('maps a cart entry without product fields enrichment', () => {
		const result = mapCartEntryToItem(baseCartEntry, { index: 1 })

		expect(result.item_id).toBe('CART-SKU-001')
		expect(result.item_name).toBe('Cart Product')
		expect(result.price).toBe(45)
		expect(result.discount).toBe(10)
		expect(result.quantity).toBe(2)
		expect(result.item_list_id).toBe('cart')
		expect(result.item_list_name).toBe('cart')
		expect(result.index).toBe(1)
		expect(result.coupon).toBe('n/a')
		expect(result.affiliation).toBe(ECOMMERCE_AFFILIATION_ONLINE_STORE)
		expect(result.item_brand).toBe('grohe')
		expect(result.item_category).toBe('n/a')
		expect(result.item_variant).toBe('n/a')
		expect(result.ean).toBe('n/a')
		expect(result.mots).toBe('n/a')
		expect(result.productLine).toBe('n/a')
		expect(result.room).toBe('n/a')
		expect(result.size).toBe('n/a')
		expect(result.subbrand).toBe('n/a')
		expect(result.sustainabilityFeatures).toBe('n/a')
	})

	it('merges product fields over base', () => {
		const result = mapCartEntryToItem(baseCartEntry, {
			index: 1,
			productFields,
		})

		expect(result.ean).toBe('4005176999')
		expect(result.item_brand).toBe('grohe')
		expect(result.item_category).toBe('Bathroom')
		expect(result.item_category_2).toBe('Showers')
		expect(result.item_variant).toBe('color: chrome')
		expect(result.productLine).toBe('Euphoria')
		expect(result.size).toBe('150mm')
	})

	it('computes discount as 0 when originalPrice is missing', () => {
		const noOriginal: CartEntry = {
			...baseCartEntry,
			product: { ...baseCartEntry.product, originalPrice: undefined },
		}
		const result = mapCartEntryToItem(noOriginal, { index: 1 })

		expect(result.discount).toBe(0)
	})

	it('computes discount as 0 when originalPrice equals sale price', () => {
		const noDiscount: CartEntry = {
			...baseCartEntry,
			product: {
				...baseCartEntry.product,
				originalPrice: { value: 89.99, currencyISO: 'EUR' },
			},
		}
		const result = mapCartEntryToItem(noDiscount, { index: 1 })

		expect(result.discount).toBe(0)
	})

	it('omits currency when product currency is null', () => {
		const noCurrency: CartEntry = {
			...baseCartEntry,
			product: {
				...baseCartEntry.product,
				price: { value: 89.99, currencyISO: null },
			},
		}
		const result = mapCartEntryToItem(noCurrency, { index: 1 })

		expect(result.currency).toBeUndefined()
	})

	it('handles null quantity gracefully', () => {
		const nullQty: CartEntry = { ...baseCartEntry, quantity: null }
		const result = mapCartEntryToItem(nullQty, { index: 1 })

		expect(result.quantity).toBe(0)
	})

	it('sets coupon to n/a when no pricing', () => {
		const result = mapCartEntryToItem(baseCartEntry, { index: 1 })

		expect(result.coupon).toBe('n/a')
	})

	it('uses promotionId from pricing when provided', () => {
		const pricing: ProductPriceUpdated = {
			...basePricing,
			sku: 'CART-SKU-001',
			promotionId: 'UK_AUTOLINE40691002_7GBP',
		}
		const result = mapCartEntryToItem(baseCartEntry, { index: 1, pricing })

		expect(result.coupon).toBe('UK_AUTOLINE40691002_7GBP')
	})
})

// ---------------------------------------------------------------------------
// mapOrderEntryToItem
// ---------------------------------------------------------------------------

describe('mapOrderEntryToItem', () => {
	it('maps an order entry without product fields enrichment', () => {
		const result = mapOrderEntryToItem(baseOrderEntry, { index: 2 })

		expect(result.item_id).toBe('ORD-SKU-001')
		expect(result.item_name).toBe('Order Product')
		expect(result.price).toBe(40)
		expect(result.discount).toBe(10)
		expect(result.quantity).toBe(4)
		expect(result.currency).toBe('EUR')
		expect(result.item_list_id).toBe('cart')
		expect(result.item_list_name).toBe('cart')
		expect(result.index).toBe(2)
		expect(result.size).toBe('250mm')
		expect(result.coupon).toBe('n/a')
		expect(result.affiliation).toBe(ECOMMERCE_AFFILIATION_ONLINE_STORE)
	})

	it('merges product fields over base', () => {
		const result = mapOrderEntryToItem(baseOrderEntry, {
			index: 1,
			productFields,
		})

		expect(result.item_brand).toBe('grohe')
		expect(result.item_category).toBe('Bathroom')
		expect(result.item_variant).toBe('color: chrome')
		expect(result.productLine).toBe('Euphoria')
	})

	it('sets discounted unit price from totalPrice / qty', () => {
		const result = mapOrderEntryToItem(baseOrderEntry, { index: 1 })

		expect(result.price).toBe(40)
	})

	it('computes unit discount from totalDiscount / quantity', () => {
		const result = mapOrderEntryToItem(baseOrderEntry, { index: 1 })

		// totalDiscount = 40, quantity = 4 => unitDiscount = 10
		expect(result.discount).toBe(10)
	})

	it('zeros monetary fields when totalPrice is null', () => {
		const noTotal: OrderDetailEntry = {
			...baseOrderEntry,
			product: { ...baseOrderEntry.product, totalPrice: null },
		}
		const result = mapOrderEntryToItem(noTotal, { index: 1 })

		expect(result.price).toBe(0)
		expect(result.discount).toBe(0)
	})

	it('defaults quantity to 1 when null', () => {
		const nullQty: OrderDetailEntry = { ...baseOrderEntry, quantity: null }
		const result = mapOrderEntryToItem(nullQty, { index: 1 })

		expect(result.quantity).toBe(1)
	})

	it('omits currency when product currency is null', () => {
		const noProdCurrency: OrderDetailEntry = {
			...baseOrderEntry,
			product: {
				...baseOrderEntry.product,
				totalPrice: { value: 200, currencyIso: null },
			},
		}
		const result = mapOrderEntryToItem(noProdCurrency, { index: 1 })

		expect(result.currency).toBeUndefined()
	})
})

// ---------------------------------------------------------------------------
// mapPLPProductToItem
// ---------------------------------------------------------------------------

describe('mapPLPProductToItem', () => {
	const baseOptions = {
		index: 3,
		item_list_id: 'category plp',
		item_list_name: 'category hand showers',
	}

	it('maps a PLP product with pricing correctly', () => {
		const result = mapPLPProductToItem(basePLPProduct, basePricing, baseOptions)

		expect(result.item_name).toBe('Test Shower')
		expect(result.item_id).toBe('SKU-001')
		expect(result.price).toBe(100)
		expect(result.discount).toBe(0)
		expect(result.item_brand).toBe('grohe')
		expect(result.item_category).toBe('Bathroom')
		expect(result.item_category_2).toBe('Showers')
		expect(result.item_category_3).toBe('Hand showers')
		expect(result.item_variant).toBe('color: chrome')
		expect(result.ean).toBe('4005176')
		expect(result.quantity).toBe(1)
		expect(result.currency).toBe('EUR')
		expect(result.item_list_id).toBe('category plp')
		expect(result.item_list_name).toBe('category hand showers')
		expect(result.index).toBe(3)
		expect(result.subbrand).toBe('Professional')
		expect(result.productLine).toBe('Euphoria')
		expect(result.coupon).toBe('n/a')
		expect(result.affiliation).toBe(ECOMMERCE_AFFILIATION_ONLINE_STORE)
		expect(result.mots).toBe('n/a')
		expect(result.room).toBe('n/a')
		expect(result.sustainabilityFeatures).toBe('n/a')
	})

	it('sets grohe spa brand when isSpa is true', () => {
		const spaProduct = { ...basePLPProduct, isSpa: true }
		const result = mapPLPProductToItem(spaProduct, basePricing, baseOptions)

		expect(result.item_brand).toBe('grohe spa')
	})

	it('uses baseSku when finish has no sku', () => {
		const noFinishSku = {
			...basePLPProduct,
			finishes: [{ ...basePLPProduct.finishes[0], sku: '' }],
		}
		const result = mapPLPProductToItem(noFinishSku, basePricing, baseOptions)

		expect(result.item_id).toBe('BASE-001')
	})

	it('uses second finish when finishIndex is 1', () => {
		const result = mapPLPProductToItem(basePLPProduct, basePricing, {
			...baseOptions,
			finishIndex: 1,
		})

		expect(result.item_id).toBe('SKU-002')
		expect(result.item_variant).toBe('color: brushed nickel')
		expect(result.ean).toBe('4005177')
	})

	it('defaults price to 0 when pricing is undefined', () => {
		const result = mapPLPProductToItem(basePLPProduct, undefined, baseOptions)

		expect(result.price).toBe(0)
		expect(result.discount).toBe(0)
		expect(result.currency).toBeUndefined()
	})

	it('computes discount when promotion is active', () => {
		const discountedPricing: ProductPriceUpdated = {
			...basePricing,
			userPriceVAT: 120,
			discountedPriceVAT: 100,
			promotionId: 'PROMO-001',
		}
		const result = mapPLPProductToItem(
			basePLPProduct,
			discountedPricing,
			baseOptions,
		)

		expect(result.price).toBe(100)
		expect(result.discount).toBe(20)
	})

	it('uses userPriceVAT with no discount when promotion is absent despite price difference', () => {
		const noPromoPricing: ProductPriceUpdated = {
			...basePricing,
			userPriceVAT: 120,
			discountedPriceVAT: 100,
		}
		const result = mapPLPProductToItem(
			basePLPProduct,
			noPromoPricing,
			baseOptions,
		)

		expect(result.price).toBe(120)
		expect(result.discount).toBe(0)
	})

	it('uses quantity from options when provided', () => {
		const result = mapPLPProductToItem(basePLPProduct, basePricing, {
			...baseOptions,
			quantity: 5,
		})

		expect(result.quantity).toBe(5)
	})

	it('fills coupon from pricing promotionId when set', () => {
		const priced: ProductPriceUpdated = {
			...basePricing,
			promotionId: 'P-LIST',
			promotionLabel: null,
		}
		const result = mapPLPProductToItem(basePLPProduct, priced, baseOptions)

		expect(result.coupon).toBe('P-LIST')
	})
})

// ---------------------------------------------------------------------------
// mapCartCoupon
// ---------------------------------------------------------------------------

describe('mapCartCoupon', () => {
	it('joins multiple coupon codes with comma', () => {
		const vouchers: CartAppliedVoucher[] = [
			{
				code: 'SUMMER20',
				description: null,
				appliedValue: { value: 10, currencyIso: 'EUR' },
			},
			{
				code: 'EXTRA5',
				description: null,
				appliedValue: { value: 5, currencyIso: 'EUR' },
			},
		]

		expect(mapCartCoupon(vouchers)).toBe('SUMMER20, EXTRA5')
	})

	it('returns n/a when no promotions', () => {
		expect(mapCartCoupon([])).toBe('n/a')
		expect(mapCartCoupon(null)).toBe('n/a')
		expect(mapCartCoupon(undefined)).toBe('n/a')
	})

	it('skips promotions with null or empty codes', () => {
		const vouchers: CartAppliedVoucher[] = [
			{
				code: null,
				description: null,
				appliedValue: { value: 10, currencyIso: 'EUR' },
			},
			{
				code: 'VALID',
				description: null,
				appliedValue: { value: 5, currencyIso: 'EUR' },
			},
			{
				code: '  ',
				description: null,
				appliedValue: { value: 5, currencyIso: 'EUR' },
			},
		]

		expect(mapCartCoupon(vouchers)).toBe('VALID')
	})
})

// ---------------------------------------------------------------------------
// mapOrderCoupon
// ---------------------------------------------------------------------------

describe('mapOrderCoupon', () => {
	it('joins multiple coupon codes', () => {
		const coupons: OrderDetailApiResponse['coupons'] = [
			{ couponCode: 'ORDER10', couponDiscount: 10 },
			{ couponCode: 'FREE', couponDiscount: 5 },
		]

		expect(mapOrderCoupon(coupons)).toBe('ORDER10, FREE')
	})

	it('returns n/a when coupons is null or empty', () => {
		expect(mapOrderCoupon(null)).toBe('n/a')
		expect(mapOrderCoupon([])).toBe('n/a')
	})

	it('skips null coupon codes', () => {
		const coupons: OrderDetailApiResponse['coupons'] = [
			{ couponCode: null, couponDiscount: 10 },
			{ couponCode: 'VALID', couponDiscount: 5 },
		]

		expect(mapOrderCoupon(coupons)).toBe('VALID')
	})
})

// ---------------------------------------------------------------------------
// mapCartEntriesToItems
// ---------------------------------------------------------------------------

describe('mapCartEntriesToItems', () => {
	const productFieldsMap = { 'CART-SKU-001': productFields }

	it('maps multiple entries with 1-based index', () => {
		const entries: CartEntry[] = [
			baseCartEntry,
			{
				...baseCartEntry,
				product: {
					...baseCartEntry.product,
					sku: 'CART-SKU-002',
					name: 'Second Product',
				},
			},
		]

		const result = mapCartEntriesToItems(entries, productFieldsMap)

		expect(result).toHaveLength(2)
		expect(result[0].index).toBe(1)
		expect(result[0].item_id).toBe('CART-SKU-001')
		expect(result[1].index).toBe(2)
		expect(result[1].item_id).toBe('CART-SKU-002')
	})

	it('applies product fields per-sku', () => {
		const result = mapCartEntriesToItems([baseCartEntry], productFieldsMap)

		expect(result[0].item_category).toBe('Bathroom')
		expect(result[0].item_variant).toBe('color: chrome')
	})

	it('returns empty array for empty entries', () => {
		expect(mapCartEntriesToItems([], productFieldsMap)).toEqual([])
	})

	it('passes per-sku pricing promotionId to each item', () => {
		const prices: Record<string, ProductPriceUpdated> = {
			'CART-SKU-001': {
				...basePricing,
				sku: 'CART-SKU-001',
				promotionId: 'LINE-PROMO',
			},
		}
		const result = mapCartEntriesToItems([baseCartEntry], undefined, prices)

		expect(result[0].coupon).toBe('LINE-PROMO')
	})
})

// ---------------------------------------------------------------------------
// mapOrderEntriesToItems
// ---------------------------------------------------------------------------

describe('mapOrderEntriesToItems', () => {
	const productFieldsMap = { 'ORD-SKU-001': productFields }

	it('maps multiple entries with 1-based index', () => {
		const entries: OrderDetailEntry[] = [
			baseOrderEntry,
			{
				...baseOrderEntry,
				product: {
					...baseOrderEntry.product,
					code: 'ORD-SKU-002',
					name: 'Second Order',
				},
			},
		]

		const result = mapOrderEntriesToItems(entries)

		expect(result).toHaveLength(2)
		expect(result[0].index).toBe(1)
		expect(result[0].item_id).toBe('ORD-SKU-001')
		expect(result[1].index).toBe(2)
		expect(result[1].item_id).toBe('ORD-SKU-002')
	})

	it('applies product fields per-sku', () => {
		const result = mapOrderEntriesToItems([baseOrderEntry], productFieldsMap)

		expect(result[0].item_category).toBe('Bathroom')
		expect(result[0].item_variant).toBe('color: chrome')
	})

	it('returns empty array for empty entries', () => {
		expect(mapOrderEntriesToItems([])).toEqual([])
	})

	it('passes per-sku pricing promotionId to each item', () => {
		const prices: Record<string, ProductPriceUpdated> = {
			'ORD-SKU-001': {
				...basePricing,
				sku: 'ORD-SKU-001',
				promotionId: 'ORDER-LINE-PROMO',
			},
		}
		const result = mapOrderEntriesToItems([baseOrderEntry], undefined, prices)

		expect(result[0].coupon).toBe('ORDER-LINE-PROMO')
	})
})

describe('ecommerceEventForQuantityDelta', () => {
	it('routes quantity deltas to add_to_cart, remove_from_cart, or skip', () => {
		expect(ecommerceEventForQuantityDelta(2)).toBe('add_to_cart')
		expect(ecommerceEventForQuantityDelta(-1)).toBe('remove_from_cart')
		expect(ecommerceEventForQuantityDelta(0)).toBe(null)
	})
})

describe('EcommerceEvent union', () => {
	it('accepts select_item, view_cart, add_to_cart, remove_from_cart payloads', () => {
		const item = mapPLPProductToItem(basePLPProduct, basePricing, {
			index: 1,
			item_list_id: 'list-1',
			item_list_name: 'list one',
		})

		const events: EcommerceEvent[] = [
			{
				event: 'select_item',
				ecommerce: {
					item_list_id: 'list-1',
					item_list_name: 'list one',
					currency: 'EUR',
					items: [item],
				},
			},
			{
				event: 'view_cart',
				ecommerce: { currency: 'EUR', value: 10, coupon: 'n/a', items: [item] },
			},
			{
				event: 'add_to_cart',
				ecommerce: { currency: 'EUR', value: 10, items: [item] },
			},
			{
				event: 'remove_from_cart',
				ecommerce: { currency: 'EUR', value: 10, items: [item] },
			},
		]

		expect(events).toHaveLength(4)
	})
})
