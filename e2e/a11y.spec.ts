import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from '@playwright/test'

const WCAG_22_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function expectNoViolations(page: Page) {
	await page.waitForLoadState('networkidle')
	// Scan the settled UI: mid-transition colours (e.g. a button fading from
	// disabled to enabled) are not what users read.
	await page.waitForFunction(() => document.getAnimations().length === 0)
	const { violations } = await new AxeBuilder({ page })
		.withTags(WCAG_22_AA)
		.analyze()
	expect(
		violations.flatMap((v) =>
			v.nodes.map((n) => `${v.id}: ${n.html} — ${n.failureSummary}`),
		),
	).toEqual([])
}

test('storefront journey has no automatically detectable WCAG 2.2 AA violations', async ({
	page,
}) => {
	await page.goto('/products')
	await expectNoViolations(page)
	await page.goto('/products/arc-lamp')
	await expectNoViolations(page)
	await page.getByRole('button', { name: 'Add to cart', exact: true }).click()
	await expect(page.getByRole('link', { name: 'Cart (1 item)' })).toBeVisible()
	await page.goto('/cart')
	await expect(page.getByRole('spinbutton', { name: 'Quantity' })).toBeVisible()
	await expectNoViolations(page)
	await page.goto('/checkout')
	await expectNoViolations(page)
	await page.getByRole('checkbox').check()
	await page
		.getByRole('button', { name: 'Create order & continue to payment' })
		.click()
	await expect(page.getByText('First name is required')).toBeVisible()
	await expectNoViolations(page)
})

test('checkout works with the keyboard and reports errors accessibly', async ({
	page,
}) => {
	await page.goto('/products/arc-lamp')
	await page.getByRole('button', { name: 'Add to cart', exact: true }).click()
	await expect(page.getByRole('link', { name: 'Cart (1 item)' })).toBeVisible()
	await page.goto('/checkout')
	const submit = page.getByRole('button', {
		name: 'Create order & continue to payment',
	})
	await expect(submit).toBeDisabled()

	// Skip link is the first tab stop and moves focus past the header.
	await page.keyboard.press('Tab')
	await expect(
		page.getByRole('link', { name: 'Skip to content' }),
	).toBeFocused()

	// Accept the terms with the keyboard; the button becomes available.
	const terms = page.getByRole('checkbox')
	await terms.focus()
	await page.keyboard.press('Space')
	await expect(submit).toBeEnabled()
	await page.keyboard.press('Tab')
	await expect(submit).toBeFocused()
	await page.keyboard.press('Enter')

	// Focus moves to the first invalid field, whose error is its description.
	const firstName = page.getByRole('textbox', {
		name: 'First name',
		exact: true,
	})
	await expect(firstName).toBeFocused()
	await expect(firstName).toHaveAttribute('aria-invalid', 'true')
	await expect(firstName).toHaveAccessibleDescription('First name is required')

	// Focus indicator is visible on the focused field's wrapper.
	const outline = await firstName.evaluate(
		(el) => getComputedStyle(el.parentElement as Element).outlineStyle,
	)
	expect(outline).not.toBe('none')
})

test('respects reduced motion', async ({ browser }) => {
	const context = await browser.newContext({ reducedMotion: 'reduce' })
	const page = await context.newPage()
	await page.goto('/products')
	const duration = await page.evaluate(() => {
		const probe = document.createElement('div')
		probe.className = 'animate-pulse'
		document.body.append(probe)
		return getComputedStyle(probe).animationDuration
	})
	expect(Number.parseFloat(duration)).toBeLessThan(0.001)
	await context.close()
})
