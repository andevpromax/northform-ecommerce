import { test, expect } from '@playwright/test'
async function checkout(page: import('@playwright/test').Page) {
	await page.goto('/products')
	await page
		.getByRole('heading', { name: 'Arc Desk Lamp', exact: true })
		.getByRole('link')
		.click()
	await expect(page).toHaveURL(/\/products\/arc-lamp$/)
	await page.getByRole('button', { name: 'Add to cart', exact: true }).click()
	await expect(page.getByText('Added to your cart')).toBeVisible()
	// The header link's name includes the item count ("Cart (1 item)").
	await page.getByRole('link', { name: /^Cart/ }).click()
	await page
		.getByRole('button', { name: 'Increase quantity', exact: true })
		.click()
	await expect(
		page.getByRole('spinbutton', { name: 'Quantity', exact: true }),
	).toHaveValue('2')
	await page.screenshot({
		path: test.info().outputPath('cart.png'),
		fullPage: true,
	})
	await page
		.getByRole('button', { name: 'Proceed to checkout' })
		.first()
		.click()
	await page
		.getByRole('textbox', { name: 'First name', exact: true })
		.fill('Alex')
	await page
		.getByRole('textbox', { name: 'Last name', exact: true })
		.fill('Taylor')
	await page
		.getByRole('textbox', { name: 'Email', exact: true })
		.fill('alex@example.test')
	await page
		.getByRole('textbox', { name: 'Street and number', exact: true })
		.fill('12 Example Street')
	await page.getByRole('textbox', { name: 'City', exact: true }).fill('London')
	// No country is preselected; the postal code must match the chosen one.
	await page
		.getByRole('combobox', { name: 'Country' })
		.selectOption('United Kingdom')
	await page
		.getByRole('textbox', { name: 'Postal code', exact: true })
		.fill('SW1A 1AA')
	await page.getByRole('checkbox').check()
	await page
		.getByRole('button', { name: 'Create order & continue to payment' })
		.click()
	await expect(page).toHaveURL(/\/payment\?orderID=/)
}
test('complete shopping journey survives confirmation refresh', async ({
	page,
}) => {
	const errors: string[] = []
	page.on('pageerror', (e) => errors.push(e.message))
	await checkout(page)
	await page
		.getByRole('radio', { name: 'Simulated payment — succeed', exact: true })
		.click()
	await page.getByRole('button', { name: 'Complete simulated payment' }).click()
	await expect(
		page.getByRole('heading', { name: 'Thank you. Order confirmed.' }),
	).toBeVisible()
	await expect(page.getByText('Arc Desk Lamp × 2')).toBeVisible()
	await expect(page.getByText('Total: €183.00', { exact: true })).toBeVisible()
	await page.reload()
	await expect(
		page.getByText('alex@example.test', { exact: false }),
	).toBeVisible()
	await page.screenshot({
		path: test.info().outputPath('confirmation.png'),
		fullPage: true,
	})
	expect(errors).toEqual([])
})
test('declined payment can be retried after refreshing', async ({ page }) => {
	await checkout(page)
	await page
		.getByRole('radio', { name: 'Simulated payment — decline', exact: true })
		.click()
	await page.getByRole('button', { name: 'Complete simulated payment' }).click()
	await expect(
		page.getByRole('alert').filter({ hasText: 'Simulated payment declined' }),
	).toBeVisible()
	await page.reload()
	await page
		.getByRole('radio', { name: 'Simulated payment — succeed', exact: true })
		.click()
	await page.getByRole('button', { name: 'Complete simulated payment' }).click()
	await expect(
		page.getByRole('heading', { name: 'Thank you. Order confirmed.' }),
	).toBeVisible()
})
