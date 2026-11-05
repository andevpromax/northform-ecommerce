// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { checkoutSchema } from '@/features/checkout/schema'
import { roundMoney } from '@/shared/utils/roundMoney'
// Cart, voucher, order and payment rules are enforced by the Express backend
// and tested in server/test. These cover the storefront's own validation.
const customer = {
	firstName: 'Alex',
	lastName: 'Taylor',
	email: 'alex@example.test',
	streetAndNumber: '12 Example Street',
	city: 'London',
	zipCode: 'SW1A 1AA',
	country: 'United Kingdom',
}
describe('Storefront checkout validation', () => {
	it('validates guest checkout fields with production name/address rules', () => {
		expect(checkoutSchema.safeParse({ ...customer, terms: true }).success).toBe(
			true,
		)
		for (const invalid of [
			{ email: 'not-email' },
			{ firstName: '' },
			{ streetAndNumber: '<script>' },
			{ zipCode: 'x' },
			{ terms: false },
		])
			expect(
				checkoutSchema.safeParse({ ...customer, terms: true, ...invalid })
					.success,
			).toBe(false)
	})
	it('rounds money consistently', () => {
		expect(roundMoney(19.999)).toBe(20)
	})
})
