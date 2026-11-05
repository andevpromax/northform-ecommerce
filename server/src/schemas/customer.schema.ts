import { z } from 'zod'
import {
	DELIVERY_COUNTRIES,
	isValidPostalCode,
	postalCodeMessage,
} from './postal-codes.js'

// Port of the storefront guest checkout rules (src/features/checkout/schema.ts
// and the shared name/address validators). Keep both in sync.
const NAME_CHARS = /^[\p{L}\p{M}\s'.-]+$/u
const ONLY_SPACES = /^\s+$/
const REPEATED_CHARS = /(.)\1{2,}/u
const ADDRESS = /^[\p{L}\p{N}\p{M}\s\-'\.#,\/]{1,200}$/u
const CITY = /^[\p{L}\p{M}\s\-'\.]{1,250}$/u

const personName = z
	.string()
	.min(1)
	.max(100)
	.refine((value) => NAME_CHARS.test(value), 'Invalid characters')
	.refine((value) => value.trim() === value, 'Leading or trailing spaces')
	.refine((value) => !ONLY_SPACES.test(value), 'Only spaces')
	.refine((value) => !REPEATED_CHARS.test(value), 'Repeated characters')

export const customerSchema = z
	.object({
		firstName: personName,
		lastName: personName,
		email: z.string().trim().email().max(160),
		streetAndNumber: z.string().trim().regex(ADDRESS),
		city: z.string().trim().regex(CITY),
		zipCode: z.string().trim().min(1).max(12),
		country: z.enum(DELIVERY_COUNTRIES),
	})
	// The postal code must use the format of the selected country.
	.superRefine((value, ctx) => {
		if (!isValidPostalCode(value.country, value.zipCode))
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['zipCode'],
				message: postalCodeMessage(value.country),
			})
	})

export type Customer = z.infer<typeof customerSchema>
