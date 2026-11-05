/**
 * GA4-style ecommerce payloads for GTM dataLayer (NEO-3182).
 * Category fields use underscore naming: item_category_2, not item_category2.
 */

export type EcommerceItem = {
	item_name: string
	item_id: string
	/** Post-discount unit price; rounded to 2 decimal places */
	price: number
	/** Unit discount; rounded to 2 decimal places */
	discount: number
	item_brand: string
	item_category?: string
	item_category_2?: string
	item_category_3?: string
	item_category_4?: string
	item_category_5?: string
	/** Format: `color: {finishName}` */
	item_variant: string
	ean: string
	quantity: number
	currency?: string
	item_list_id?: string
	item_list_name?: string
	/** 1-based */
	index: number
	/** Product pricing `promotionId` per line only — otherwise `'n/a'` (cart/order voucher stays on `ecommerce.coupon`) */
	coupon?: string
	affiliation?: string
	mots: string
	productLine: string
	room: string
	size: string
	subbrand: string
	sustainabilityFeatures: string
}

/** Fields that can be filled from product search data */
export type EcommerceProductFields = Pick<
	EcommerceItem,
	| 'ean'
	| 'item_brand'
	| 'item_category'
	| 'item_category_2'
	| 'item_category_3'
	| 'item_category_4'
	| 'item_category_5'
	| 'item_variant'
	| 'mots'
	| 'productLine'
	| 'room'
	| 'size'
	| 'subbrand'
	| 'sustainabilityFeatures'
>

export type ViewItemEvent = {
	event: 'view_item'
	ecommerce: {
		currency: string
		value: number
		items: EcommerceItem[]
	}
}

export type ViewItemListEvent = {
	event: 'view_item_list'
	ecommerce: {
		item_list_id: string
		item_list_name: string
		currency: string
		items: EcommerceItem[]
	}
}

export type SelectItemEvent = {
	event: 'select_item'
	ecommerce: {
		item_list_id: string
		item_list_name: string
		currency: string
		items: EcommerceItem[]
	}
}

export type ViewCartEvent = {
	event: 'view_cart'
	ecommerce: {
		currency: string
		value: number
		coupon?: string
		items: EcommerceItem[]
	}
}

export type AddToCartEvent = {
	event: 'add_to_cart'
	ecommerce: {
		currency: string
		value: number
		items: EcommerceItem[]
	}
}

export type RemoveFromCartEvent = {
	event: 'remove_from_cart'
	ecommerce: {
		currency: string
		value: number
		items: EcommerceItem[]
	}
}

export type BeginCheckoutEvent = {
	event: 'begin_checkout'
	ecommerce: {
		currency: string
		value: number
		coupon: string
		/** 'registered user' | 'guest' */
		option: string
		items: EcommerceItem[]
	}
}

export type AddShippingInfoEvent = {
	event: 'add_shipping_info'
	ecommerce: {
		currency: string
		value: number
		coupon: string
		shipping_tier: string
		option: string
		items: EcommerceItem[]
	}
}

export type AddPaymentInfoEvent = {
	event: 'add_payment_info'
	ecommerce: {
		currency: string
		value: number
		coupon: string
		payment_type: string
		option: string
		items: EcommerceItem[]
	}
}

export type PurchaseEvent = {
	event: 'purchase'
	ecommerce: {
		transaction_id: string
		value: number
		tax: number
		shipping: number
		currency: string
		coupon: string
		items: EcommerceItem[]
	}
}

export type EcommerceEvent =
	| ViewItemEvent
	| ViewItemListEvent
	| SelectItemEvent
	| ViewCartEvent
	| AddToCartEvent
	| RemoveFromCartEvent
	| BeginCheckoutEvent
	| AddShippingInfoEvent
	| AddPaymentInfoEvent
	| PurchaseEvent
