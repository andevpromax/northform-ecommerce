'use client'

import { Skeleton } from '@/shared/ui/custom/Skeleton'
import { useLocaleParts } from '@/shared/hooks/useLocaleParts'
import { RichText } from '@/shared/cms/atoms/RichText'
import type { StringValue } from '@/shared/cms/types/fields'
import { cn } from '@/shared/utils/cn'
import { formatPriceWithLocale } from '@/shared/utils/formatPriceWithLocale'
import { useT } from 'talkr'

const isValidNumber = (value: unknown): value is number =>
	typeof value === 'number' && !Number.isNaN(value)

const CartPriceSummary = ({
	className,
	isLoading,
	subtotal,
	shippingPrice,
	VAT,
	totalPrice,
	currencyISO,
	vatLabel,
	shippingLabel,
	subtotalLabel,
	totalOrderLabel,
	orderDiscounts,
}: {
	className?: string
	isLoading?: boolean
	subtotal: number
	shippingPrice: number
	VAT: number
	totalPrice: number
	currencyISO: string
	vatLabel?: StringValue | string
	shippingLabel?: StringValue
	subtotalLabel?: StringValue
	totalOrderLabel?: StringValue
	orderDiscountsLabel?: StringValue
	orderDiscounts: number
}) => {
	const { T } = useT()
	const { raw: locale } = useLocaleParts()
	const validSubtotalPrice = isValidNumber(subtotal) ? subtotal : 0
	const validShippingPrice = isValidNumber(shippingPrice) ? shippingPrice : 0
	const validVAT = isValidNumber(VAT) ? VAT : 0
	const validTotalPrice = isValidNumber(totalPrice) ? totalPrice : 0

	const subtotalFormatted = formatPriceWithLocale(
		validSubtotalPrice,
		currencyISO,
		locale,
	)
	const shippingPriceFormatted = formatPriceWithLocale(
		validShippingPrice,
		currencyISO,
		locale,
	)
	const VATFormatted = formatPriceWithLocale(validVAT, currencyISO, locale)
	const totalPriceFormatted = formatPriceWithLocale(
		validTotalPrice,
		currencyISO,
		locale,
	)

	if (isLoading) {
		return (
			<div
				className={cn('flex 1280:w-[487px] w-full flex-col gap-3', className)}
			>
				{Array.from({ length: 5 }).map((_, index) => (
					<div key={`cart-price-summary-skeleton-${index}`} className="flex">
						<Skeleton className="h-6 w-20" />
						<Skeleton className="h-6 w-20" />
					</div>
				))}
			</div>
		)
	}

	return (
		<div className={cn('flex 1280:w-[487px] w-full flex-col gap-3', className)}>
			<div className="typo-text-lg-regular flex justify-between">
				{subtotalLabel ? (
					<RichText field={subtotalLabel} />
				) : (
					<span>{T('cart.subtotal')}</span>
				)}
				<span>{subtotalFormatted}</span>
			</div>

			{!!orderDiscounts && (
				<div className="typo-text-lg-regular flex justify-between text-green-700">
					<span>{T('cart.discounts')}</span>
					<span>
						-{' '}
						{formatPriceWithLocale(
							orderDiscounts ?? 0,
							currencyISO ?? '',
							locale,
						)}
					</span>
				</div>
			)}

			<div className="typo-text-lg-regular flex justify-between">
				{shippingLabel ? (
					<RichText field={shippingLabel} />
				) : (
					<span>{T('cart.shipping')}</span>
				)}
				<span className={cn('', { 'text-green-700': shippingPrice === 0 })}>
					{shippingPriceFormatted}
				</span>
			</div>
			<div className="typo-text-lg-regular flex justify-between">
				{typeof vatLabel === 'string' ? (
					vatLabel
				) : vatLabel ? (
					<RichText field={vatLabel} />
				) : (
					T('cart.vat')
				)}
				<span>{VATFormatted}</span>
			</div>
			<div className="typo-text-2xl-bold flex justify-between">
				{totalOrderLabel ? (
					<RichText field={totalOrderLabel} />
				) : (
					<span>{T('cart.total_order')}</span>
				)}
				<span>{totalPriceFormatted}</span>
			</div>
		</div>
	)
}

export default CartPriceSummary
