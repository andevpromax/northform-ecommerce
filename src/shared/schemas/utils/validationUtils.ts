import { HTML_TAG_REGEX } from '@/shared/constants/formValidationRegex'

export const noHtmlValidation = (val: unknown): boolean => {
	return typeof val === 'string' && !HTML_TAG_REGEX.test(val)
}

export const getHtmlErrorMessage = (
	T: ((key: string) => string) | string | undefined,
): string => {
	return (
		(typeof T === 'string' ? T : T?.('form.errorInvalidHtml')) ||
		'Invalid HTML characters'
	)
}
