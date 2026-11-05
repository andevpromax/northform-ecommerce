import { describe, expect, it } from 'vitest'
import { calculateTotals, toMajor } from '../src/services/pricing.js'

const lamp = { unitPriceCents: 8900, quantity: 2 }
const throwBlanket = { unitPriceCents: 5400, quantity: 1 }
const demo10 = { discountType: 'PERCENTAGE', discountValue: 10 } as const

describe('calculateTotals', () => {
	it('matches the storefront numbers with DEMO10', () => {
		expect(calculateTotals([lamp, throwBlanket], demo10)).toEqual({
			subtotalCents: 23200,
			discountCents: 2320,
			shippingCents: 500,
			vatCents: 3480,
			totalCents: 21380,
		})
	})

	it('adds shipping and included VAT without a voucher', () => {
		const totals = calculateTotals([lamp], null)
		expect(toMajor(totals.totalCents)).toBe(183)
		expect(toMajor(totals.vatCents)).toBe(29.67)
	})

	it('charges nothing for an empty cart, even with a voucher', () => {
		expect(calculateTotals([], demo10)).toEqual({
			subtotalCents: 0,
			discountCents: 0,
			shippingCents: 0,
			vatCents: 0,
			totalCents: 0,
		})
	})

	it('caps fixed discounts at the subtotal', () => {
		const totals = calculateTotals([throwBlanket], {
			discountType: 'FIXED',
			discountValue: 10_000,
		})
		expect(totals.discountCents).toBe(5400)
		expect(totals.totalCents).toBe(500)
	})

	it('keeps every amount in whole cents', () => {
		const totals = calculateTotals([{ unitPriceCents: 2900, quantity: 7 }], {
			discountType: 'PERCENTAGE',
			discountValue: 15,
		})
		for (const value of Object.values(totals))
			expect(Number.isInteger(value)).toBe(true)
	})
})
