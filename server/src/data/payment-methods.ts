// Simulated methods offered by the storefront. The `type` is the payment outcome.
export const paymentMethods = {
	paymentMethods: [
		{
			type: 'success',
			name: 'Simulated payment — succeed',
			isExternalPaymentMethod: false,
		},
		{
			type: 'failure',
			name: 'Simulated payment — decline',
			isExternalPaymentMethod: false,
		},
	],
	storedPaymentMethodList: [],
}
