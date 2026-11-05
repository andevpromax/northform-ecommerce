import type { CountryCode } from 'libphonenumber-js'

export const validatePhoneNumber = async (
	phoneNumber: string | null | undefined,
	countryCode?: CountryCode | string,
): Promise<boolean> => {
	if (!phoneNumber || phoneNumber.trim().length === 0) {
		return false
	}

	try {
		const { isValidPhoneNumber } = await import('libphonenumber-js')

		if (phoneNumber.trim().startsWith('+')) {
			return isValidPhoneNumber(phoneNumber)
		}

		if (countryCode) {
			return isValidPhoneNumber(
				phoneNumber,
				countryCode.toUpperCase() as CountryCode,
			)
		}

		return isValidPhoneNumber(phoneNumber)
	} catch {
		return false
	}
}
