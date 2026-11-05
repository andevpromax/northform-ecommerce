// OpenAPI 3.0.3 description of the Express API. Examples are real responses
// (server/test/openapi.test.ts validates them against the schemas).

const arcLamp = {
	id: 'arc-lamp',
	sku: 'arc-lamp',
	name: 'Arc Desk Lamp',
	description:
		'A thoughtfully made arc desk lamp for everyday spaces. A fictional product in the North & Form engineering showcase.',
	price: 89,
	currency: 'EUR',
	category: 'Lighting',
	image: '/images/arc-lamp.jpg',
	available: true,
	stock: 12,
}

const wovenBasket = {
	id: 'woven-basket',
	sku: 'woven-basket',
	name: 'Woven Basket',
	description:
		'A thoughtfully made woven basket for everyday spaces. A fictional product in the North & Form engineering showcase.',
	price: 48,
	currency: 'EUR',
	category: 'Living',
	image: '/images/woven-basket.jpg',
	available: false,
	stock: 0,
}

const emptyCartExample = {
	cartId: null,
	subtotal: 0,
	VAT: 0,
	shippingPrice: 0,
	totalPrice: 0,
	currencyISO: 'EUR',
	referenceId: null,
	fiscalCode: null,
	totalNumberOfItems: 0,
	entries: [],
	orderDiscounts: 0,
	appliedVouchers: [],
}

const cartEntries = [
	{
		entryNumber: 0,
		quantity: 2,
		totalPrice: { value: 178, currencyISO: 'EUR' },
		product: {
			sku: 'arc-lamp',
			name: 'Arc Desk Lamp',
			dimensions: 'Lighting',
			price: { value: 89, currencyISO: 'EUR' },
			discount: null,
			imageUrl: '/images/arc-lamp.jpg',
		},
	},
	{
		entryNumber: 1,
		quantity: 1,
		totalPrice: { value: 54, currencyISO: 'EUR' },
		product: {
			sku: 'linen-throw',
			name: 'Linen Throw',
			dimensions: 'Textiles',
			price: { value: 54, currencyISO: 'EUR' },
			discount: null,
			imageUrl: '/images/linen-throw.jpg',
		},
	},
]

const cartExample = {
	cartId: '3f6c1b52-8a4e-4d1f-9b7a-2c5e8d9f0a13',
	subtotal: 232,
	VAT: 38.67,
	shippingPrice: 5,
	totalPrice: 237,
	currencyISO: 'EUR',
	referenceId: null,
	fiscalCode: null,
	totalNumberOfItems: 3,
	entries: cartEntries,
	orderDiscounts: 0,
	appliedVouchers: [],
}

const discountedCartExample = {
	...cartExample,
	VAT: 34.8,
	totalPrice: 213.8,
	orderDiscounts: 23.2,
	appliedVouchers: [
		{
			code: 'DEMO10',
			voucherCode: 'DEMO10',
			description: '10% demo discount',
			appliedValue: { value: 23.2 },
		},
	],
}

const customerExample = {
	firstName: 'Alex',
	lastName: 'Taylor',
	email: 'alex@example.test',
	streetAndNumber: '12 Example Street',
	city: 'London',
	zipCode: 'SW1A 1AA',
	country: 'United Kingdom',
}

const orderExample = {
	id: '6f1c2a9e-3b7d-4c55-9a1e-2d8f0b4c7e31',
	createdAt: '2026-11-05T14:00:00.000Z',
	customer: customerExample,
	cart: { ...discountedCartExample, cartId: null },
	status: 'awaiting_payment',
	paymentStatus: 'Pending',
	attempts: 0,
}

const paidOrderExample = {
	...orderExample,
	status: 'confirmed',
	paymentStatus: 'Authorised',
	attempts: 1,
}

const declinedOrderExample = {
	...orderExample,
	status: 'payment_failed',
	paymentStatus: 'Refused',
	attempts: 1,
}

const json = (schema: object, example?: unknown) => ({
	'application/json': example === undefined ? { schema } : { schema, example },
})

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })
const response = (name: string) => ({
	$ref: `#/components/responses/${name}`,
})

const errorResponse = (description: string, error: string) => ({
	description,
	content: json(ref('Error'), { error }),
})

const cartResponse = (description: string, example: unknown) => ({
	description,
	content: json(ref('Cart'), example),
})

const orderResponse = (description: string, example: unknown) => ({
	description,
	content: json(ref('Order'), example),
})

// The internal token is only enforced when the server has one configured.
const sessionSecurity = [
	{ sessionId: [], internalToken: [] },
	{ sessionId: [] },
]
const internalSecurity = [{ internalToken: [] }, {}]

const sessionResponses = {
	400: response('BadRequest'),
	401: response('Unauthorized'),
}

const entryNumberParameter = {
	name: 'entryNumber',
	in: 'path',
	required: true,
	description:
		'Zero-based position of the line in the cart (insertion order), as returned in `entries[].entryNumber`.',
	schema: { type: 'integer', minimum: 0 },
	example: 0,
}

const orderIdParameter = {
	name: 'orderId',
	in: 'path',
	required: true,
	description: 'Order ID returned by `POST /api/orders`.',
	schema: { type: 'string', format: 'uuid' },
	example: orderExample.id,
}

const money = (description: string) => ({
	type: 'number',
	minimum: 0,
	description,
})

const price = {
	type: 'object',
	additionalProperties: false,
	required: ['value', 'currencyISO'],
	properties: {
		value: { type: 'number', minimum: 0 },
		currencyISO: { type: 'string', example: 'EUR' },
	},
}

export const openApiDocument = {
	openapi: '3.0.3',
	info: {
		title: 'North & Form Commerce API',
		version: '2.0.0',
		description: [
			'Backend for the North & Form e-commerce showcase: catalogue, guest carts, vouchers, orders and **simulated** payments, persisted in PostgreSQL.',
			'',
			'**Trying the shopping flow:** click **Authorize** and enter any UUID as `sessionId` (for example `0b6f3c1e-2d4a-4f8b-9c7d-1e2f3a4b5c6d`). Add a token only if the server has `INTERNAL_API_TOKEN` configured. Then: add items → apply `DEMO10` → create an order → pay it.',
			'',
			'Idempotency keys must be fresh UUIDs per order or payment attempt. Repeating a key replays the original result.',
			'',
			'All amounts are server-calculated in major currency units (EUR). Client-supplied prices or totals are ignored. No card data is accepted or stored.',
		].join('\n'),
	},
	servers: [{ url: '/', description: 'Current host' }],
	tags: [
		{ name: 'Health', description: 'Service status' },
		{ name: 'Products', description: 'Public product catalogue' },
		{ name: 'Cart', description: 'Guest shopping cart' },
		{ name: 'Vouchers', description: 'Discount codes applied to the cart' },
		{ name: 'Orders', description: 'Checkout and order history' },
		{ name: 'Payments', description: 'Simulated payments' },
	],
	paths: {
		'/health': {
			get: {
				tags: ['Health'],
				summary: 'Check service health',
				operationId: 'getHealth',
				security: [],
				responses: {
					200: {
						description: 'The service is running.',
						content: json(ref('Health'), { status: 'ok' }),
					},
				},
			},
		},
		'/api/products': {
			get: {
				tags: ['Products'],
				summary: 'List all products',
				description:
					'Returns every product, including unavailable ones, as a bare JSON array in catalogue order.',
				operationId: 'listProducts',
				security: [],
				responses: {
					200: {
						description: 'All products.',
						content: json({ type: 'array', items: ref('Product') }, [
							arcLamp,
							wovenBasket,
						]),
					},
				},
			},
		},
		'/api/products/{sku}': {
			get: {
				tags: ['Products'],
				summary: 'Get a product by SKU',
				operationId: 'getProductBySku',
				security: [],
				parameters: [
					{
						name: 'sku',
						in: 'path',
						required: true,
						description: 'Product SKU.',
						schema: { type: 'string' },
						examples: {
							available: { summary: 'Available product', value: 'arc-lamp' },
							unavailable: {
								summary: 'Unavailable product',
								value: 'woven-basket',
							},
							unknown: { summary: 'Unknown SKU (404)', value: 'unknown-sku' },
						},
					},
				],
				responses: {
					200: {
						description: 'The product with the given SKU.',
						content: {
							'application/json': {
								schema: ref('Product'),
								examples: {
									available: { value: arcLamp },
									unavailable: { value: wovenBasket },
								},
							},
						},
					},
					404: errorResponse(
						'No product exists with the given SKU.',
						'Product not found',
					),
				},
			},
		},
		'/api/cart': {
			get: {
				tags: ['Cart'],
				summary: 'Get the current cart',
				description:
					'Returns the session cart with server-calculated totals. A session without a cart receives an empty cart (`cartId: null`); no data is created by this request.',
				operationId: 'getCart',
				security: sessionSecurity,
				responses: {
					200: {
						description: 'The current cart.',
						content: {
							'application/json': {
								schema: ref('Cart'),
								examples: {
									withItems: { value: discountedCartExample },
									empty: { value: emptyCartExample },
								},
							},
						},
					},
					...sessionResponses,
				},
			},
			delete: {
				tags: ['Cart'],
				summary: 'Empty the cart',
				description: 'Removes every line and the applied voucher.',
				operationId: 'clearCart',
				security: sessionSecurity,
				responses: {
					200: cartResponse('The emptied cart.', {
						...emptyCartExample,
						cartId: cartExample.cartId,
					}),
					...sessionResponses,
				},
			},
		},
		'/api/cart/items': {
			post: {
				tags: ['Cart'],
				summary: 'Add a product to the cart',
				description:
					'Adds a line, or increases the quantity of an existing line for the same product. The merged quantity is checked against availability and stock.',
				operationId: 'addCartItem',
				security: sessionSecurity,
				requestBody: {
					required: true,
					content: json(ref('AddCartItemRequest'), {
						sku: 'arc-lamp',
						quantity: 1,
					}),
				},
				responses: {
					200: cartResponse('The updated cart.', cartExample),
					...sessionResponses,
					404: errorResponse('Unknown SKU.', 'Product not found'),
					409: errorResponse(
						'The product is unavailable, the quantity exceeds stock, or the line would exceed 99 items.',
						'Requested quantity is unavailable',
					),
					413: response('PayloadTooLarge'),
				},
			},
		},
		'/api/cart/items/{entryNumber}': {
			patch: {
				tags: ['Cart'],
				summary: 'Change the quantity of a cart line',
				operationId: 'setCartItemQuantity',
				security: sessionSecurity,
				parameters: [entryNumberParameter],
				requestBody: {
					required: true,
					content: json(ref('SetQuantityRequest'), { quantity: 2 }),
				},
				responses: {
					200: cartResponse('The updated cart.', cartExample),
					...sessionResponses,
					404: errorResponse(
						'No line at this position.',
						'Cart item not found',
					),
					409: errorResponse(
						'The product is unavailable or the quantity exceeds stock.',
						'Requested quantity is unavailable',
					),
					413: response('PayloadTooLarge'),
				},
			},
			delete: {
				tags: ['Cart'],
				summary: 'Remove a cart line',
				description:
					'Remaining lines are renumbered, so `entryNumber` values may shift.',
				operationId: 'removeCartItem',
				security: sessionSecurity,
				parameters: [entryNumberParameter],
				responses: {
					200: cartResponse('The updated cart.', {
						...emptyCartExample,
						cartId: cartExample.cartId,
					}),
					...sessionResponses,
					404: errorResponse(
						'No line at this position.',
						'Cart item not found',
					),
				},
			},
		},
		'/api/cart/voucher': {
			put: {
				tags: ['Vouchers'],
				summary: 'Apply a voucher',
				description:
					'Applies a voucher to the cart, replacing any previous one. Codes are case-sensitive. The seeded demo voucher is `DEMO10` (10 % off the subtotal).',
				operationId: 'applyVoucher',
				security: sessionSecurity,
				requestBody: {
					required: true,
					content: json(ref('ApplyVoucherRequest'), { code: 'DEMO10' }),
				},
				responses: {
					200: cartResponse(
						'The cart with the discount applied.',
						discountedCartExample,
					),
					...sessionResponses,
					404: errorResponse('Unknown voucher code.', 'Voucher not found'),
					409: errorResponse(
						'The voucher is inactive, expired or not yet valid.',
						'Voucher has expired',
					),
					413: response('PayloadTooLarge'),
				},
			},
			delete: {
				tags: ['Vouchers'],
				summary: 'Remove the voucher',
				operationId: 'removeVoucher',
				security: sessionSecurity,
				responses: {
					200: cartResponse('The cart without a discount.', cartExample),
					...sessionResponses,
				},
			},
		},
		'/api/payment-methods': {
			get: {
				tags: ['Payments'],
				summary: 'List simulated payment methods',
				description:
					'The method `type` is the simulated outcome to send to `POST /api/orders/{orderId}/payments`.',
				operationId: 'listPaymentMethods',
				security: internalSecurity,
				responses: {
					200: {
						description: 'Available payment methods.',
						content: json(ref('PaymentMethods'), {
							paymentMethods: [
								{
									type: 'success',
									name: 'Simulated payment — succeed',
									isExternalPaymentMethod: false,
								},
								{
									type: 'failure',
									name: 'Simulated payment — decline',
									isExternalPaymentMethod: false,
								},
							],
							storedPaymentMethodList: [],
						}),
					},
					401: response('Unauthorized'),
				},
			},
		},
		'/api/orders': {
			post: {
				tags: ['Orders'],
				summary: 'Create an order from the cart',
				description:
					'Snapshots the cart (products, prices, voucher, totals) and the customer into a new order awaiting payment, then empties the cart. Stock and availability are re-checked. Repeating the same `idempotencyKey` with the same customer returns the original order with status 200; with a different customer it is rejected with 409.',
				operationId: 'createOrder',
				security: sessionSecurity,
				requestBody: {
					required: true,
					content: json(ref('CreateOrderRequest'), {
						customer: customerExample,
						idempotencyKey: '9a0e5c3d-7b21-4f6a-8c4e-5d2b1a0f9e87',
						paymentMethodType: 'simulation',
					}),
				},
				responses: {
					201: orderResponse('Order created.', orderExample),
					200: orderResponse(
						'Idempotent replay: the order previously created with this key.',
						orderExample,
					),
					...sessionResponses,
					409: errorResponse(
						'Empty cart, unavailable stock, or idempotency key reused with different customer details.',
						'Your cart is empty',
					),
					413: response('PayloadTooLarge'),
					429: errorResponse(
						'The session reached the demo order limit (50).',
						'Demo order limit reached',
					),
				},
			},
		},
		'/api/orders/latest': {
			get: {
				tags: ['Orders'],
				summary: 'Get the most recent order',
				operationId: 'getLatestOrder',
				security: sessionSecurity,
				responses: {
					200: orderResponse('The latest order of this session.', orderExample),
					...sessionResponses,
					404: errorResponse('The session has no orders.', 'No orders found'),
				},
			},
		},
		'/api/orders/{orderId}': {
			get: {
				tags: ['Orders'],
				summary: 'Get an order',
				description: 'Only orders of the calling guest session are visible.',
				operationId: 'getOrder',
				security: sessionSecurity,
				parameters: [orderIdParameter],
				responses: {
					200: orderResponse('The order.', orderExample),
					...sessionResponses,
					404: errorResponse(
						'Unknown order, malformed ID, or an order of another session.',
						'Order not found',
					),
				},
			},
		},
		'/api/orders/{orderId}/payments': {
			post: {
				tags: ['Payments'],
				summary: 'Simulate a payment attempt',
				description: [
					'Records a simulated payment attempt and updates the order:',
					'- `success` → `confirmed` / `Authorised`',
					'- `failure` → `payment_failed` / `Refused` (can be retried with a new key)',
					'',
					'Repeating a key replays the original result without a new attempt; reusing it for another order or outcome returns 409. An authorised order is returned unchanged and never charged again.',
				].join('\n'),
				operationId: 'payOrder',
				security: sessionSecurity,
				parameters: [orderIdParameter],
				requestBody: {
					required: true,
					content: json(ref('PaymentRequest'), {
						outcome: 'success',
						idempotencyKey: '2c8e7f14-5a3b-4d9c-8e1f-6b0a9d2c3e45',
					}),
				},
				responses: {
					200: {
						description: 'The order after the payment attempt.',
						content: {
							'application/json': {
								schema: ref('Order'),
								examples: {
									authorised: { value: paidOrderExample },
									declined: { value: declinedOrderExample },
								},
							},
						},
					},
					...sessionResponses,
					404: errorResponse(
						'Unknown order, malformed ID, or an order of another session.',
						'Order not found',
					),
					409: errorResponse(
						'The idempotency key was already used for another order or outcome.',
						'Payment key conflict',
					),
					413: response('PayloadTooLarge'),
					429: errorResponse(
						'The order reached the demo payment attempt limit (20).',
						'Demo payment attempt limit reached',
					),
				},
			},
		},
	},
	components: {
		securitySchemes: {
			sessionId: {
				type: 'apiKey',
				in: 'header',
				name: 'X-Session-Id',
				description:
					'Guest session ID (UUID). Forwarded by the Next.js storefront from its HttpOnly session cookie. Any UUID starts a new guest session.',
			},
			internalToken: {
				type: 'apiKey',
				in: 'header',
				name: 'X-Internal-Token',
				description:
					'Shared secret between the storefront and this API. Required on all `/api` routes except the product catalogue when the server sets `INTERNAL_API_TOKEN`.',
			},
		},
		responses: {
			BadRequest: {
				description:
					'Invalid request: malformed JSON, body or path validation failure, or a missing or invalid `X-Session-Id` header.',
				content: {
					'application/json': {
						schema: ref('Error'),
						examples: {
							validation: {
								value: {
									error: 'Invalid request',
									details: [
										{
											path: 'quantity',
											message: 'Number must be less than or equal to 99',
										},
									],
								},
							},
							session: {
								value: { error: 'Missing or invalid X-Session-Id header' },
							},
							json: { value: { error: 'Invalid JSON' } },
						},
					},
				},
			},
			Unauthorized: errorResponse(
				'Missing or wrong `X-Internal-Token` (only when the server requires one).',
				'Unauthorized',
			),
			PayloadTooLarge: errorResponse(
				'The JSON body exceeds 16 KB.',
				'Request too large',
			),
		},
		schemas: {
			Product: {
				type: 'object',
				additionalProperties: false,
				required: [
					'id',
					'sku',
					'name',
					'description',
					'price',
					'currency',
					'category',
					'image',
					'available',
					'stock',
				],
				properties: {
					id: { type: 'string', example: 'arc-lamp' },
					sku: { type: 'string', example: 'arc-lamp' },
					name: { type: 'string', example: 'Arc Desk Lamp' },
					description: { type: 'string' },
					price: {
						type: 'number',
						description: 'Unit price in major currency units.',
						example: 89,
					},
					currency: {
						type: 'string',
						description: 'ISO 4217 currency code.',
						example: 'EUR',
					},
					category: { type: 'string', example: 'Lighting' },
					image: {
						type: 'string',
						description: 'Image path relative to the storefront origin.',
						example: '/images/arc-lamp.jpg',
					},
					available: { type: 'boolean', example: true },
					stock: { type: 'integer', minimum: 0, example: 12 },
				},
			},
			Health: {
				type: 'object',
				additionalProperties: false,
				required: ['status'],
				properties: { status: { type: 'string', enum: ['ok'] } },
			},
			Error: {
				type: 'object',
				additionalProperties: false,
				required: ['error'],
				properties: {
					error: { type: 'string', example: 'Product not found' },
					details: {
						type: 'array',
						description: 'Validation issues (400 only).',
						items: {
							type: 'object',
							additionalProperties: false,
							required: ['path', 'message'],
							properties: {
								path: { type: 'string', example: 'quantity' },
								message: { type: 'string' },
							},
						},
					},
				},
			},
			Price: price,
			CartEntry: {
				type: 'object',
				additionalProperties: false,
				required: ['entryNumber', 'quantity', 'totalPrice', 'product'],
				properties: {
					entryNumber: { type: 'integer', minimum: 0 },
					quantity: { type: 'integer', minimum: 1, maximum: 99 },
					totalPrice: ref('Price'),
					product: {
						type: 'object',
						additionalProperties: false,
						required: [
							'sku',
							'name',
							'dimensions',
							'price',
							'discount',
							'imageUrl',
						],
						properties: {
							sku: { type: 'string' },
							name: { type: 'string' },
							dimensions: {
								type: 'string',
								description: 'Product category.',
							},
							price: ref('Price'),
							discount: {
								type: 'string',
								nullable: true,
								description: 'Always null: no line-level discounts.',
							},
							imageUrl: { type: 'string' },
						},
					},
				},
			},
			AppliedVoucher: {
				type: 'object',
				additionalProperties: false,
				required: ['code', 'voucherCode', 'description', 'appliedValue'],
				properties: {
					code: { type: 'string', example: 'DEMO10' },
					voucherCode: { type: 'string', example: 'DEMO10' },
					description: { type: 'string', example: '10% demo discount' },
					appliedValue: {
						type: 'object',
						additionalProperties: false,
						required: ['value'],
						properties: { value: money('Discount amount.') },
					},
				},
			},
			Cart: {
				type: 'object',
				additionalProperties: false,
				description:
					'Cart with server-calculated totals. VAT (20 %) is included in the discounted subtotal; shipping is €5 for non-empty carts.',
				required: [
					'cartId',
					'subtotal',
					'VAT',
					'shippingPrice',
					'totalPrice',
					'currencyISO',
					'referenceId',
					'fiscalCode',
					'totalNumberOfItems',
					'entries',
					'orderDiscounts',
					'appliedVouchers',
				],
				properties: {
					cartId: {
						type: 'string',
						format: 'uuid',
						nullable: true,
						description:
							'Cart ID, unrelated to the session ID. Null when the session has no cart, and in order snapshots.',
					},
					subtotal: money('Sum of line totals.'),
					VAT: money('VAT included in the total.'),
					shippingPrice: money('Delivery cost.'),
					totalPrice: money('subtotal − orderDiscounts + shippingPrice.'),
					currencyISO: { type: 'string', example: 'EUR' },
					referenceId: { type: 'string', nullable: true },
					fiscalCode: { type: 'string', nullable: true },
					totalNumberOfItems: { type: 'integer', minimum: 0 },
					entries: { type: 'array', items: ref('CartEntry') },
					orderDiscounts: money('Voucher discount.'),
					appliedVouchers: {
						type: 'array',
						maxItems: 1,
						items: ref('AppliedVoucher'),
					},
				},
			},
			Customer: {
				type: 'object',
				additionalProperties: false,
				description:
					'Guest customer and delivery address. Validated with the storefront checkout rules (letters, marks, spaces and limited punctuation; no HTML).',
				required: [
					'firstName',
					'lastName',
					'email',
					'streetAndNumber',
					'city',
					'zipCode',
					'country',
				],
				properties: {
					firstName: { type: 'string', minLength: 1, maxLength: 100 },
					lastName: { type: 'string', minLength: 1, maxLength: 100 },
					email: { type: 'string', format: 'email', maxLength: 160 },
					streetAndNumber: { type: 'string', minLength: 1, maxLength: 200 },
					city: { type: 'string', minLength: 1, maxLength: 250 },
					zipCode: {
						type: 'string',
						minLength: 1,
						maxLength: 12,
						description:
							'Must use the format of the selected country: Czech Republic `186 00`, Germany `10115`, Netherlands `1012 AB`, United Kingdom `SW1A 1AA`.',
					},
					country: {
						type: 'string',
						enum: [
							'Czech Republic',
							'Germany',
							'Netherlands',
							'United Kingdom',
						],
					},
				},
			},
			Order: {
				type: 'object',
				additionalProperties: false,
				required: [
					'id',
					'createdAt',
					'customer',
					'cart',
					'status',
					'paymentStatus',
					'attempts',
				],
				properties: {
					id: { type: 'string', format: 'uuid' },
					createdAt: { type: 'string', format: 'date-time' },
					customer: ref('Customer'),
					cart: {
						allOf: [ref('Cart')],
						description: 'Immutable snapshot taken when the order was created.',
					},
					status: {
						type: 'string',
						enum: ['awaiting_payment', 'payment_failed', 'confirmed'],
					},
					paymentStatus: {
						type: 'string',
						enum: ['Pending', 'Refused', 'Authorised'],
					},
					attempts: {
						type: 'integer',
						minimum: 0,
						description: 'Number of recorded payment attempts.',
					},
				},
			},
			PaymentMethods: {
				type: 'object',
				additionalProperties: false,
				required: ['paymentMethods', 'storedPaymentMethodList'],
				properties: {
					paymentMethods: {
						type: 'array',
						items: {
							type: 'object',
							additionalProperties: false,
							required: ['type', 'name', 'isExternalPaymentMethod'],
							properties: {
								type: { type: 'string', enum: ['success', 'failure'] },
								name: { type: 'string' },
								isExternalPaymentMethod: { type: 'boolean' },
							},
						},
					},
					storedPaymentMethodList: {
						type: 'array',
						maxItems: 0,
						description: 'Always empty: no payment credentials are stored.',
						items: { type: 'object' },
					},
				},
			},
			AddCartItemRequest: {
				type: 'object',
				required: ['sku', 'quantity'],
				properties: {
					sku: { type: 'string', minLength: 1, maxLength: 80 },
					quantity: { type: 'integer', minimum: 1, maximum: 99 },
				},
			},
			SetQuantityRequest: {
				type: 'object',
				required: ['quantity'],
				properties: {
					quantity: { type: 'integer', minimum: 1, maximum: 99 },
				},
			},
			ApplyVoucherRequest: {
				type: 'object',
				required: ['code'],
				properties: {
					code: {
						type: 'string',
						minLength: 1,
						maxLength: 50,
						pattern: '^[a-zA-Z0-9+-]+$',
					},
				},
			},
			CreateOrderRequest: {
				type: 'object',
				required: ['customer', 'idempotencyKey', 'paymentMethodType'],
				properties: {
					customer: ref('Customer'),
					idempotencyKey: {
						type: 'string',
						format: 'uuid',
						description: 'Fresh UUID per checkout attempt.',
					},
					paymentMethodType: { type: 'string', enum: ['simulation'] },
				},
			},
			PaymentRequest: {
				type: 'object',
				required: ['outcome', 'idempotencyKey'],
				properties: {
					outcome: { type: 'string', enum: ['success', 'failure'] },
					idempotencyKey: {
						type: 'string',
						format: 'uuid',
						description: 'Fresh UUID per payment attempt.',
					},
				},
			},
		},
	},
}
