import { CartContainer } from '@/features/cart/components/shopping-cart/CartContainer'
export default function Cart() {
	return (
		<CartContainer
			title="Your cart"
			shippingLabel={{ value: 'Delivery €5. Try DEMO10 for a 10% discount.' }}
			vatLabel="VAT included"
			linkToProductListingPage={{
				value: { href: '/products', text: 'Continue shopping' },
			}}
			pdpLink="/products/"
			proceedToCheckoutLink={{
				value: { href: '/checkout', text: 'Proceed to checkout' },
			}}
			emptyCartHeadingText={{ value: 'Your cart is empty' }}
			emptyCartText={{
				value: 'Explore the collection to find your everyday essentials.',
			}}
		/>
	)
}
