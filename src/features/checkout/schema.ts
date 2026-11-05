import { z } from 'zod'
import {
	addressFormSchema,
	ADDRESS_REGEX,
	CITY_REGEX,
} from '@/shared/schemas/Addresses/deliveryAddress'
import {
	DELIVERY_COUNTRIES,
	isValidPostalCode,
	postalCodeMessage,
} from '@/shared/schemas/Addresses/postalCodes'
import {
	buildFirstNameSchema,
	buildLastNameSchema,
} from '@/shared/schemas/forms'
// Guest checkout did not exist in the source. Reuse its address shapes and validation rules.
const customerFields = addressFormSchema
	.pick({
		firstName: true,
		lastName: true,
		streetAndNumber: true,
		city: true,
		zipCode: true,
		country: true,
	})
	.extend({
		firstName: buildFirstNameSchema({
			firstNameRequiredMessage: 'First name is required',
			firstNameInvalidMessage: 'Enter a valid first name',
		}),
		lastName: buildLastNameSchema({
			lastNameRequiredMessage: 'Last name is required',
			lastNameInvalidMessage: 'Enter a valid last name',
		}),
		email: z
			.string()
			.trim()
			.min(1, 'Email is required')
			.email('Enter a valid email address, for example name@example.com')
			.max(160),
		streetAndNumber: z
			.string()
			.trim()
			.min(1, 'Street and number is required')
			.regex(ADDRESS_REGEX, 'Enter a valid street and number'),
		city: z
			.string()
			.trim()
			.min(1, 'City is required')
			.regex(CITY_REGEX, 'Enter a valid city'),
		zipCode: z.string().trim().min(1, 'Postal code is required').max(12),
		country: z.enum(DELIVERY_COUNTRIES, {
			errorMap: () => ({ message: 'Select a country' }),
		}),
	})

// City names are not globally unique, so consistency is checked through the
// postal code, which must use the format of the selected country.
const requirePostalCodeOfCountry = (
	value: z.infer<typeof customerFields>,
	ctx: z.RefinementCtx,
) => {
	if (!isValidPostalCode(value.country, value.zipCode))
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ['zipCode'],
			message: postalCodeMessage(value.country),
		})
}

export const customerSchema = customerFields.superRefine(
	requirePostalCodeOfCountry,
)
export type Customer = z.infer<typeof customerSchema>
export const checkoutSchema = customerFields
	.extend({
		terms: z.literal(true, {
			errorMap: () => ({ message: 'Please accept the demo terms' }),
		}),
	})
	.superRefine(requirePostalCodeOfCountry)
export type CheckoutValues = z.infer<typeof checkoutSchema>
