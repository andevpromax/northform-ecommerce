/**
 * Get locale-specific anonymous cart cookie name
 * @param locale - The locale string (e.g., 'en-GB', 'nl-NL')
 * @returns Cookie name with neo prefix and locale suffix (e.g., '__neo-anon_cart_id_en-GB')
 */
export const getAnonCartCookieName = (locale: string) =>
	`__neo-anon_cart_id_${locale}`
