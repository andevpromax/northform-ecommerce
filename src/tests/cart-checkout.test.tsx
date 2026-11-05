import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Providers } from '@/app/providers'
import { AddToCart } from '@/features/catalog/AddToCart'
import { CartNavLink } from '@/features/cart/components/CartNavLink'
import { CartContainer } from '@/features/cart/components/shopping-cart/CartContainer'
import { CheckoutForm } from '@/features/checkout/CheckoutForm'
import { checkoutSchema, customerSchema } from '@/features/checkout/schema'
import { useCheckoutStore } from '@/shared/store/cart/useCheckoutStore'
import { installFakeStorefront } from './fakeStorefront'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

let storefront: ReturnType<typeof installFakeStorefront>
beforeEach(() => {
	useCheckoutStore.getState().clearStore()
	sessionStorage.clear()
	storefront = installFakeStorefront()
})
afterEach(() => vi.unstubAllGlobals())

const wrap = (ui: React.ReactNode) => render(<Providers>{ui}</Providers>)
const cartPage = (
	<>
		<CartNavLink />
		<CartContainer
			title="Your cart"
			shippingLabel={{ value: 'Delivery €5' }}
			vatLabel="VAT included"
			linkToProductListingPage={{ value: { href: '/products', text: 'Shop' } }}
			pdpLink="/products/"
			proceedToCheckoutLink={{ value: { href: '/checkout', text: 'Checkout' } }}
			emptyCartHeadingText={{ value: 'Your cart is empty' }}
			emptyCartText={{ value: 'Browse products' }}
		/>
	</>
)
const cartLink = () => screen.getByRole('link', { name: /^Cart/ })
const quantity = () =>
	screen.getByRole('spinbutton', { name: 'Quantity' }) as HTMLInputElement
const quantityCalls = () =>
	storefront.calls
		.filter((c) => c.url === '/api/cart/change-entry-quantity')
		.map((c) => c.body)

describe('Header cart badge', () => {
	it('shows the total quantity of all cart lines', async () => {
		storefront.lines.push(
			{ sku: 'arc-lamp', quantity: 2 },
			{ sku: 'linen-throw', quantity: 3 },
		)
		wrap(<CartNavLink />)
		await waitFor(() =>
			expect(cartLink()).toHaveAccessibleName('Cart (5 items)'),
		)
		expect(screen.getByTestId('cart-count')).toHaveTextContent('5')
		expect(cartLink()).toHaveAttribute('href', '/cart')
	})

	it('shows no count for an empty cart and while loading', async () => {
		wrap(<CartNavLink />)
		expect(cartLink()).toHaveAccessibleName('Cart')
		await waitFor(() =>
			expect(storefront.calls.some((c) => c.url.startsWith('/api/cart'))).toBe(
				true,
			),
		)
		expect(screen.queryByTestId('cart-count')).toBeNull()
	})

	it('updates immediately after adding a product, from the shared cart query', async () => {
		wrap(
			<>
				<CartNavLink />
				<AddToCart sku="arc-lamp" available />
			</>,
		)
		await waitFor(() => expect(cartLink()).toHaveAccessibleName('Cart'))
		await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
		await waitFor(() =>
			expect(cartLink()).toHaveAccessibleName('Cart (1 item)'),
		)
		await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
		await waitFor(() =>
			expect(cartLink()).toHaveAccessibleName('Cart (2 items)'),
		)
	})
})

describe('Cart quantity controls', () => {
	it('decrements 3 → 2 → 1 and keeps totals and badge in sync', async () => {
		storefront.lines.push({ sku: 'arc-lamp', quantity: 3 })
		wrap(cartPage)
		await waitFor(() => expect(quantity().value).toBe('3'))
		const minus = screen.getByRole('button', { name: 'Decrease quantity' })

		await userEvent.click(minus)
		await waitFor(() => expect(quantity().value).toBe('2'))
		expect(cartLink()).toHaveAccessibleName('Cart (2 items)')
		expect(screen.getAllByText('€183.00').length).toBeGreaterThan(0)

		// Regression: 2 → 1 must decrease, not empty the cart.
		await userEvent.click(minus)
		await waitFor(() => expect(quantity().value).toBe('1'))
		expect(screen.queryByText('Your cart is empty')).toBeNull()
		expect(cartLink()).toHaveAccessibleName('Cart (1 item)')
		expect(screen.getAllByText('€94.00').length).toBeGreaterThan(0)
		expect(quantityCalls()).toEqual([
			{ entryNumber: 0, quantity: 2, locale: 'en-GB' },
			{ entryNumber: 0, quantity: 1, locale: 'en-GB' },
		])
	})

	it('removes the product when decreasing from 1, after confirmation', async () => {
		storefront.lines.push({ sku: 'arc-lamp', quantity: 1 })
		wrap(cartPage)
		await waitFor(() => expect(quantity().value).toBe('1'))
		const minus = screen.getByRole('button', { name: 'Decrease quantity' })
		expect(minus).toBeEnabled()

		await userEvent.click(minus)
		const dialog = await screen.findByRole('dialog', {
			name: 'Remove this item?',
		})
		// Cancelling keeps the product and its quantity.
		await userEvent.click(
			within(dialog).getByRole('button', { name: 'Cancel' }),
		)
		expect(quantity().value).toBe('1')
		expect(quantityCalls()).toEqual([])

		await userEvent.click(minus)
		const confirm = await screen.findByRole('dialog', {
			name: 'Remove this item?',
		})
		await userEvent.click(
			within(confirm).getByRole('button', { name: 'Remove Arc Desk Lamp' }),
		)
		await screen.findByText('Your cart is empty')
		expect(storefront.lines).toEqual([])
		expect(cartLink()).toHaveAccessibleName('Cart')
	})

	it('decreases the right line when there are several', async () => {
		storefront.lines.push(
			{ sku: 'arc-lamp', quantity: 3 },
			{ sku: 'linen-throw', quantity: 2 },
		)
		wrap(cartPage)
		await screen.findByText('Linen Throw')
		const [, secondMinus] = screen.getAllByRole('button', {
			name: 'Decrease quantity',
		})
		await userEvent.click(secondMinus)
		await waitFor(() => expect(storefront.lines[1].quantity).toBe(1))
		expect(storefront.lines[0].quantity).toBe(3)
		expect(quantityCalls()).toEqual([
			{ entryNumber: 1, quantity: 1, locale: 'en-GB' },
		])
	})

	it('shows an error, not the empty state, when the cart cannot be loaded', async () => {
		storefront.lines.push({ sku: 'arc-lamp', quantity: 2 })
		vi.stubGlobal(
			'fetch',
			vi.fn(
				async () =>
					new Response(JSON.stringify({ error: 'Endpoint not found' }), {
						status: 404,
					}),
			),
		)
		wrap(cartPage)
		// The query retries once (app default) before reporting the error.
		expect(
			await screen.findByRole('alert', {}, { timeout: 5000 }),
		).toHaveTextContent(/Unable to load your cart/)
		expect(screen.queryByText('Your cart is empty')).toBeNull()
	})
})

describe('Checkout address validation', () => {
	const valid = {
		firstName: 'Alex',
		lastName: 'Taylor',
		email: 'alex@example.test',
		streetAndNumber: '12 Example Street',
	}
	const errorsOf = (input: object) => {
		const result = customerSchema.safeParse({ ...valid, ...input })
		return result.success
			? []
			: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
	}

	it.each([
		['Czech Republic', 'Prague', '18600'],
		['Czech Republic', 'Brno', '602 00'],
		['United Kingdom', 'London', 'SW1A 1AA'],
		['United Kingdom', 'Manchester', 'M1 1AE'],
		['Germany', 'München', '80331'],
		['Netherlands', 'Amsterdam', '1012 AB'],
	])('accepts %s, %s, %s', (country, city, zipCode) => {
		expect(errorsOf({ country, city, zipCode })).toEqual([])
	})

	it('rejects a postal code that does not belong to the selected country', () => {
		expect(
			errorsOf({ country: 'United Kingdom', city: 'Prague', zipCode: '18600' }),
		).toEqual([
			'zipCode: Enter a postal code from United Kingdom, for example SW1A 1AA',
		])
		expect(
			errorsOf({
				country: 'Czech Republic',
				city: 'Prague',
				zipCode: 'SW1A 1AA',
			}),
		).toEqual([
			'zipCode: Enter a postal code from Czech Republic, for example 186 00',
		])
		expect(
			errorsOf({ country: 'Germany', city: 'Berlin', zipCode: '1011' }),
		).toHaveLength(1)
	})

	it('requires a country to be chosen (no default)', () => {
		expect(
			errorsOf({ country: '', city: 'Prague', zipCode: '18600' }),
		).toContain('country: Select a country')
		expect(
			checkoutSchema.safeParse({
				...valid,
				city: 'Prague',
				zipCode: '18600',
				country: 'France',
				terms: true,
			}).success,
		).toBe(false)
	})
})

describe('Checkout form', () => {
	const fillValidForm = async () => {
		const user = userEvent.setup()
		for (const [name, value] of [
			['First name', 'Alex'],
			['Last name', 'Taylor'],
			['Email', 'alex@example.test'],
			['Street and number', 'Václavské náměstí 1'],
			['City', 'Prague'],
			['Postal code', '110 00'],
		])
			await user.type(
				screen.getByRole('textbox', { name: new RegExp(`^${name}`) }),
				value,
			)
		await user.selectOptions(
			screen.getByRole('combobox', { name: /^Country/ }),
			'Czech Republic',
		)
		return user
	}

	it('enables the submit button only while the terms are accepted', async () => {
		storefront.lines.push({ sku: 'arc-lamp', quantity: 1 })
		wrap(<CheckoutForm />)
		const submit = await screen.findByRole('button', {
			name: 'Create order & continue to payment',
		})
		const terms = screen.getByRole('checkbox', {
			name: /accept the demo terms/,
		})
		expect(submit).toBeDisabled()
		expect(submit).toHaveAccessibleDescription(
			'Accept the demo terms to continue.',
		)
		await userEvent.click(terms)
		expect(submit).toBeEnabled()
		expect(submit).not.toHaveAccessibleDescription()
		await userEvent.click(terms)
		expect(submit).toBeDisabled()
	})

	it('associates errors with their fields and focuses the first one', async () => {
		storefront.lines.push({ sku: 'arc-lamp', quantity: 1 })
		wrap(<CheckoutForm />)
		await userEvent.click(await screen.findByRole('checkbox'))
		await userEvent.type(
			screen.getByRole('textbox', { name: /^City/ }),
			'Prague',
		)
		await userEvent.selectOptions(
			screen.getByRole('combobox', { name: /^Country/ }),
			'United Kingdom',
		)
		await userEvent.type(
			screen.getByRole('textbox', { name: /^Postal code/ }),
			'18600',
		)
		await userEvent.click(
			screen.getByRole('button', {
				name: 'Create order & continue to payment',
			}),
		)
		const firstName = screen.getByRole('textbox', { name: /^First name/ })
		await waitFor(() => expect(firstName).toHaveFocus())
		expect(firstName).toBeRequired()
		expect(firstName).toHaveAttribute('aria-invalid', 'true')
		expect(firstName).toHaveAccessibleDescription('First name is required')
		expect(
			screen.getByRole('textbox', { name: /^Postal code/ }),
		).toHaveAccessibleDescription(
			'Enter a postal code from United Kingdom, for example SW1A 1AA',
		)
		expect(screen.getByRole('textbox', { name: /^City/ })).toHaveAttribute(
			'aria-invalid',
			'false',
		)
	})

	it('creates exactly one order when submitted repeatedly', async () => {
		storefront.lines.push({ sku: 'arc-lamp', quantity: 1 })
		const base = fetch
		let resolveOrder: (r: Response) => void = () => {}
		const orderRequests: unknown[] = []
		vi.stubGlobal(
			'fetch',
			vi.fn((url: string, init?: RequestInit) => {
				if (url !== '/api/order/createOrder') return base(url, init)
				orderRequests.push(JSON.parse(String(init?.body)))
				return new Promise<Response>((resolve) => {
					resolveOrder = resolve
				})
			}),
		)
		wrap(<CheckoutForm />)
		await screen.findByRole('checkbox')
		const user = await fillValidForm()
		await user.click(screen.getByRole('checkbox'))
		const submit = screen.getByRole('button', {
			name: 'Create order & continue to payment',
		})
		await user.click(submit)
		await user.click(submit)
		await user.keyboard('{Enter}')
		await waitFor(() => expect(submit).toBeDisabled())
		expect(orderRequests).toHaveLength(1)
		expect(orderRequests[0]).toMatchObject({
			customer: {
				city: 'Prague',
				country: 'Czech Republic',
				zipCode: '110 00',
			},
			paymentMethodType: 'simulation',
		})
		resolveOrder(
			new Response(
				JSON.stringify({
					status: 'success',
					data: {
						order: {
							code: 'order-1',
							guid: 'order-1',
							status: 'awaiting_payment',
						},
						adyen: { resultCode: 'Pending', action: null },
					},
				}),
				{ status: 201 },
			),
		)
		// Still disabled while navigating to payment: no second order possible.
		await waitFor(() => expect(submit).toBeDisabled())
		expect(orderRequests).toHaveLength(1)
	})
})
