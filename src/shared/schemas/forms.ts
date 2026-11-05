import { z } from 'zod'
import {
	getHtmlErrorMessage,
	noHtmlValidation,
} from '@/shared/schemas/utils/validationUtils'

const allowedCharsRegex = /^[\p{L}\p{M}\s'.-]+$/u
const onlySpacesRegex = /^\s+$/
const repeatedCharsRegex = /(.)\1{2,}/u

export const buildFirstNameSchema = ({
	firstNameRequiredMessage,
	firstNameInvalidMessage,
	T,
}: {
	firstNameRequiredMessage: string
	firstNameInvalidMessage: string
	T?: ((key: string) => string) | string
}) => {
	return z
		.string()
		.min(1, { message: firstNameRequiredMessage || 'FirstName is required' })
		.refine(
			(val) => allowedCharsRegex.test(val), // allowed chars
			{ message: firstNameInvalidMessage || 'FirstName is not valid' },
		)
		.refine(
			(val) => val.trim() === val, // no leading/trailing spaces
			{ message: firstNameInvalidMessage || 'FirstName is not valid' },
		)
		.refine(
			(val) => !onlySpacesRegex.test(val), // not only spaces
			{ message: firstNameInvalidMessage || 'FirstName is not valid' },
		)
		.refine(
			(val) => !repeatedCharsRegex.test(val), // no 3+ repeated chars
			{ message: firstNameInvalidMessage || 'FirstName is not valid' },
		)
		.refine(noHtmlValidation, { message: getHtmlErrorMessage(T) })
}

export const buildLastNameSchema = ({
	lastNameRequiredMessage,
	lastNameInvalidMessage,
	T,
}: {
	lastNameRequiredMessage: string
	lastNameInvalidMessage: string
	T?: ((key: string) => string) | string
}) => {
	return z
		.string()
		.min(1, { message: lastNameRequiredMessage || 'LastName is required' })
		.refine(
			(val) => allowedCharsRegex.test(val), // allowed chars
			{ message: lastNameInvalidMessage || 'LastName is not valid' },
		)
		.refine(
			(val) => val.trim() === val, // no leading/trailing spaces
			{ message: lastNameInvalidMessage || 'LastName is not valid' },
		)
		.refine(
			(val) => !onlySpacesRegex.test(val), // not only spaces
			{ message: lastNameInvalidMessage || 'LastName is not valid' },
		)
		.refine(
			(val) => !repeatedCharsRegex.test(val), // no 3+ repeated chars
			{ message: lastNameInvalidMessage || 'LastName is not valid' },
		)
		.refine(noHtmlValidation, { message: getHtmlErrorMessage(T) })
}

const LOCATION_TYPE_REGEX = /^[\p{L}\p{N}\p{M}\s\-'\.]*$/u

export const buildLocationTypeSchema = (
	T: (key: string) => string = () => 'Enter a valid location type',
) => {
	return z
		.string()
		.regex(LOCATION_TYPE_REGEX, {
			message: T('form.locationType.errorInvalid'),
		})
		.refine(noHtmlValidation, { message: getHtmlErrorMessage(T) })
		.optional()
}
