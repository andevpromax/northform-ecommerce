import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { randomUUID } from 'node:crypto'
import { Providers } from '@/app/providers'
import { AddToCart } from '@/features/catalog/AddToCart'
import { CartContainer } from '@/features/cart/components/shopping-cart/CartContainer'
import { CheckoutForm } from '@/features/checkout/CheckoutForm'
import { CartPaymentMethod } from '@/features/cart/components/checkout/payment/CartPaymentMethod.client'
import { useCheckoutStore } from '@/shared/store/cart/useCheckoutStore'
import { installFakeStorefront } from './fakeStorefront'
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
let storefront: ReturnType<typeof installFakeStorefront>
beforeEach(() => {
	useCheckoutStore.getState().clearStore()
	storefront = installFakeStorefront()
})
afterEach(() => vi.unstubAllGlobals())
const wrap = (ui: React.ReactNode) => render(<Providers>{ui}</Providers>)
const cartUI = (
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
)
describe('Production-derived components', () => {
	it('adds a product through the original mutation hook', async () => {
		wrap(<AddToCart sku="arc-lamp" available />)
		await userEvent.click(screen.getByRole('button', { name: 'Add to cart' }))
		await waitFor(() => expect(storefront.totalItems()).toBe(1))
		expect(await screen.findByText('Added to your cart')).toBeVisible()
	})
	it('updates quantity and removes an item through the original cart UI', async () => {
		storefront.lines.push({ sku: 'arc-lamp', quantity: 1 })
		wrap(cartUI)
		await screen.findByText('Arc Desk Lamp')
		await userEvent.click(
			screen.getByRole('button', { name: 'Increase quantity' }),
		)
		await waitFor(() => expect(storefront.totalItems()).toBe(2))
		await userEvent.click(
			screen.getByRole('button', { name: 'Remove Arc Desk Lamp' }),
		)
		const buttons = await screen.findAllByRole('button', {
			name: 'Remove Arc Desk Lamp',
		})
		await userEvent.click(buttons.at(-1)!)
		await screen.findByText('Your cart is empty')
	})
	it('shows checkout validation errors before making an order', async () => {
		storefront.lines.push({ sku: 'arc-lamp', quantity: 1 })
		wrap(<CheckoutForm />)
		const submit = await screen.findByRole('button', {
			name: 'Create order & continue to payment',
		})
		// Submitting requires accepting the demo terms first.
		expect(submit).toBeDisabled()
		await userEvent.click(screen.getByRole('checkbox'))
		await userEvent.click(submit)
		expect(await screen.findByText('First name is required')).toBeVisible()
		expect(
			screen.getByText('Select a country', { selector: 'p' }),
		).toBeVisible()
		expect(
			storefront.calls.some((c) => c.url === '/api/order/createOrder'),
		).toBe(false)
	})
	it('shows processing, decline feedback and a retry action', async () => {
		const base = fetch
		let finish: (r: Response) => void = () => {}
		vi.stubGlobal(
			'fetch',
			vi.fn((url: string, init?: RequestInit) =>
				url.startsWith('/api/payments/')
					? new Promise<Response>((resolve) => {
							finish = resolve
						})
					: base(url, init),
			),
		)
		wrap(
			<CartPaymentMethod
				orderId={randomUUID()}
				continueToSummaryLink={{
					value: { text: 'Complete simulated payment' },
				}}
			/>,
		)
		await userEvent.click(
			await screen.findByRole('radio', { name: 'Simulated decline' }),
		)
		await userEvent.click(
			screen.getByRole('button', { name: 'Complete simulated payment' }),
		)
		expect(
			await screen.findByText('Processing simulated payment…'),
		).toBeVisible()
		finish(
			new Response(JSON.stringify({ paymentStatus: 'Refused' }), {
				status: 200,
			}),
		)
		expect(
			await screen.findByText(
				'Simulated payment declined. Choose success and try again.',
			),
		).toBeVisible()
		expect(
			screen.getByRole('button', { name: 'Complete simulated payment' }),
		).toBeEnabled()
	})
})
