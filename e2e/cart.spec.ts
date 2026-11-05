import { test, expect, type Page } from '@playwright/test'

// Against the real Express API and PostgreSQL: each test has its own browser
// context, so its own guest session and cart.
const cartLink = (page: Page) => page.getByRole('link', { name: /^Cart/ })
const quantity = (page: Page) =>
	page.getByRole('spinbutton', { name: 'Quantity', exact: true })

async function addToCart(page: Page, sku: string, times = 1) {
	await page.goto(`/products/${sku}`)
	for (let i = 0; i < times; i++) {
		const added = page.waitForResponse('**/api/product/add-to-cart')
		await page.getByRole('button', { name: 'Add to cart', exact: true }).click()
		expect((await added).ok()).toBe(true)
	}
}

test('header badge shows the total quantity and survives navigation and refresh', async ({
	page,
}) => {
	await addToCart(page, 'arc-lamp', 2)
	await expect(cartLink(page)).toHaveAccessibleName('Cart (2 items)')
	await addToCart(page, 'linen-throw', 3)
	await expect(cartLink(page)).toHaveAccessibleName('Cart (5 items)')
	await expect(page.getByTestId('cart-count')).toHaveText('5')

	await page
		.getByRole('navigation', { name: 'Main navigation' })
		.getByRole('link', { name: 'Collection' })
		.click()
	await expect(page).toHaveURL(/\/products$/)
	await expect(cartLink(page)).toHaveAccessibleName('Cart (5 items)')

	await page.reload()
	await expect(cartLink(page)).toHaveAccessibleName('Cart (5 items)')

	await cartLink(page).click()
	await expect(page).toHaveURL(/\/cart$/)
	await expect(cartLink(page)).toHaveAccessibleName('Cart (5 items)')
})

test('minus decreases 3 → 2 → 1, then removes the product; totals and badge follow', async ({
	page,
}) => {
	await addToCart(page, 'arc-lamp', 3)
	await page.goto('/cart')
	await expect(quantity(page)).toHaveValue('3')
	const minus = page.getByRole('button', {
		name: 'Decrease quantity',
		exact: true,
	})

	await minus.click()
	await expect(quantity(page)).toHaveValue('2')
	await expect(cartLink(page)).toHaveAccessibleName('Cart (2 items)')
	await expect(page.getByText('€183.00').first()).toBeVisible()

	await minus.click()
	await expect(quantity(page)).toHaveValue('1')
	await expect(cartLink(page)).toHaveAccessibleName('Cart (1 item)')
	await expect(page.getByText('€94.00').first()).toBeVisible()
	await expect(page.getByText('Your cart is empty')).toHaveCount(0)

	// The cart persists in PostgreSQL.
	await page.reload()
	await expect(quantity(page)).toHaveValue('1')

	await minus.click()
	const dialog = page.getByRole('dialog', { name: 'Remove this item?' })
	await expect(dialog).toBeVisible()
	await dialog.getByRole('button', { name: 'Remove Arc Desk Lamp' }).click()
	await expect(page.getByText('Your cart is empty')).toBeVisible()
	await expect(cartLink(page)).toHaveAccessibleName('Cart')
})

test('badge resets after an order empties the cart', async ({ page }) => {
	await addToCart(page, 'oak-tray', 1)
	await page.goto('/checkout')
	for (const [name, value] of [
		['First name', 'Jana'],
		['Last name', 'Nováková'],
		['Email', 'jana@example.test'],
		['Street and number', 'Václavské náměstí 1'],
		['City', 'Prague'],
	])
		await page.getByRole('textbox', { name, exact: true }).fill(value)
	await page
		.getByRole('combobox', { name: 'Country' })
		.selectOption('Czech Republic')
	await page
		.getByRole('textbox', { name: 'Postal code', exact: true })
		.fill('110 00')
	await page.getByRole('checkbox').check()
	await page
		.getByRole('button', { name: 'Create order & continue to payment' })
		.click()
	await expect(page).toHaveURL(/\/payment\?orderID=/)
	await expect(cartLink(page)).toHaveAccessibleName('Cart')
})
