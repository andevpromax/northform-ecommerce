// Copy of src/shared/schemas/Addresses/postalCodes.ts (the storefront rules).
// server/test/customer.test.ts fails if the two drift apart.
export const DELIVERY_COUNTRIES = [
	'Czech Republic',
	'Germany',
	'Netherlands',
	'United Kingdom',
] as const

export type DeliveryCountry = (typeof DELIVERY_COUNTRIES)[number]

export const POSTAL_CODE_FORMATS: Record<
	DeliveryCountry,
	{ pattern: RegExp; example: string }
> = {
	'Czech Republic': { pattern: /^[1-7]\d{2} ?\d{2}$/, example: '186 00' },
	Germany: { pattern: /^\d{5}$/, example: '10115' },
	Netherlands: { pattern: /^[1-9]\d{3} ?[A-Za-z]{2}$/, example: '1012 AB' },
	'United Kingdom': {
		pattern: /^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$/,
		example: 'SW1A 1AA',
	},
}

export const isValidPostalCode = (country: DeliveryCountry, code: string) =>
	POSTAL_CODE_FORMATS[country].pattern.test(code.trim())

export const postalCodeMessage = (country: DeliveryCountry) =>
	`Enter a postal code from ${country}, for example ${POSTAL_CODE_FORMATS[country].example}`
