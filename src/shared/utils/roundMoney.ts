/** Rounds a monetary amount to 2 decimal places (cent precision). */
export const roundMoney = (value: number): number =>
	Number((Math.round(value * 100) / 100).toFixed(2))
