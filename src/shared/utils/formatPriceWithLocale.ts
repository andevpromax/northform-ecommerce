export const formatPriceWithLocale = (
	price: number,
	currencyISO: string,
	locale = 'en-US',
) => {
	const numericPrice = Number(price)

	if (Number.isNaN(numericPrice)) return 'Invalid price'

	try {
		return new Intl.NumberFormat(locale, {
			style: 'currency',
			currency: currencyISO,
		}).format(numericPrice)
	} catch (_error) {
		return 'Invalid currency'
	}
}
