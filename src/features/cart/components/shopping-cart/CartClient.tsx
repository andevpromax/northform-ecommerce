import { ACCESS_TOKEN_KEY } from '@/shared/constants/auth'
import { Button } from '@/shared/ui/actions-inputs/Button'
import { ButtonLink } from '@/shared/ui/actions-inputs/ButtonLink'
import { LoadingSpinner } from '@/shared/ui/feedback/LoadingSpinner'
import { getCookie } from '@/shared/ui/hooks/useCookie'
import { useLocaleParts } from '@/shared/hooks/useLocaleParts'
import { IconArrowRight16 } from '@/shared/icons/icons/neo-16x16/arrow-right-16'
import { IconDiscountCoupon16 } from '@/shared/icons/icons/neo-16x16/discount-coupon-16'
import { IconShippingCostsTrackOrder16 } from '@/shared/icons/icons/neo-16x16/shipping-costs-track-order-16'
import { IconTrash16 } from '@/shared/icons/icons/neo-16x16/trash-16'
import { Link } from '@/shared/cms/atoms/Link'
import { RichText } from '@/shared/cms/atoms/RichText'
import type { LinkValue } from '@/shared/cms/types/fields'
import type {
	CartAppliedVoucher,
	CartDetailsResponse,
	CartEntry,
} from '@/shared/schemas/cart'
import {
	Modal,
	ModalClose,
	ModalContent,
	ModalDescription,
	ModalFooter,
	ModalHeader,
	ModalTitle,
	ModalTrigger,
} from '@/shared/ui-shared/components/Modal'
import {
	mapCartCoupon,
	mapCartEntriesToItems,
	mapCartEntryToItem,
} from '@/features/tracking/ecommerce/mappers'
import { sendEcommerceEvent } from '@/features/tracking/ecommerce/sendEcommerceEvent'
import type { BeginCheckoutEvent } from '@/features/tracking/ecommerce/types'
import { useEcommerceEnrichment } from '@/features/tracking/ecommerce/useEcommerceEnrichment'
import { roundMoney } from '@/shared/utils/roundMoney'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useT } from 'talkr'
import useDeleteCartItemMutation from '@/features/cart/hooks/mutations/useDeleteCartItemMutation'
import useDeleteCartMutation from '@/features/cart/hooks/mutations/useDeleteCartMutation'
import useRemoveVoucherMutation from '@/features/cart/hooks/mutations/voucher/useRemoveVoucherMutation'
import { calculateSubtotal } from '@/features/cart/utils/calculateSubtotal'
import { resolveVoucherDiscount } from '@/features/cart/utils/resolveVoucherDiscount'
import CartPriceSummary from '@/features/cart/components/shopping-cart/CartPriceSummary'
import CartProductTileCard from '@/features/cart/components/shopping-cart/CartProductTileCard'
import CouponCodeInput from '@/features/cart/components/shopping-cart/CouponCodeInput'

interface CartClientProps {
	cartData: CartDetailsResponse
	title: string
	shippingLabel: object
	vatLabel: string
	linkToProductListingPage: LinkValue
	pdpLink: string
	pageEditing?: boolean | null
	proceedToCheckoutLink?: LinkValue
	maxQuantity?: number
}

const CartClient = ({
	cartData,
	title,
	shippingLabel,
	vatLabel,
	linkToProductListingPage,
	pdpLink,
	pageEditing,
	proceedToCheckoutLink,
	maxQuantity = 99,
}: CartClientProps) => {
	const { T } = useT()
	const { raw: locale } = useLocaleParts()
	const router = useRouter()
	const [isDeleteAllProductsModalOpen, setIsDeleteAllProductsModalOpen] =
		useState(false)

	const cartId = cartData?.data?.cartId || ''

	// TODO: Revert to backend subtotal once BE provides right subtotal
	// const subtotal = cartData?.data?.subtotal || 0
	const totalPrice = cartData?.data?.totalPrice || 0
	const shippingPrice = cartData?.data?.shippingPrice || 0
	const VAT = cartData?.data?.VAT || 0
	const currencyISO = cartData?.data?.currencyISO || 'EUR'
	const appliedVouchers = cartData?.data?.appliedVouchers || []
	const appliedOrderPromotions = cartData?.data?.appliedOrderPromotions || []
	const appliedProductPromotions =
		cartData?.data?.appliedProductPromotions || []
	const allPromotions = [...appliedOrderPromotions, ...appliedProductPromotions]
	const entries = cartData?.data?.entries || []
	const orderDiscounts = cartData?.data?.orderDiscounts || 0

	const skus = entries
		.map((e) => e.product?.sku?.trim())
		.filter(Boolean) as string[]
	const {
		productFieldsMap,
		prices,
		isLoading: isEnrichmentLoading,
	} = useEcommerceEnrichment(skus)

	const viewCartFiredRef = useRef(false)

	useEffect(() => {
		if (viewCartFiredRef.current) return
		if (entries.length === 0) return
		if (isEnrichmentLoading) return

		viewCartFiredRef.current = true

		const items = mapCartEntriesToItems(entries, productFieldsMap, prices)
		const coupon = mapCartCoupon(appliedVouchers)

		sendEcommerceEvent({
			event: 'view_cart',
			ecommerce: {
				currency: currencyISO,
				value: roundMoney(totalPrice),
				coupon,
				items,
			},
		})
	}, [
		entries,
		isEnrichmentLoading,
		productFieldsMap,
		prices,
		currencyISO,
		totalPrice,
		appliedVouchers,
	])

	// TODO: Remove once BE provides right subtotal
	const subtotal = calculateSubtotal(entries)

	const { mutate: deleteCartItemMutate } = useDeleteCartItemMutation()

	const { mutate: deleteCartMutate, isPending: isDeleteCartPending } =
		useDeleteCartMutation()

	const { mutate: removeVoucherMutate, isPending: isRemoveVoucherPending } =
		useRemoveVoucherMutation()

	const hasManualPromo = appliedVouchers?.some((v) => !!v.voucherCode?.trim())

	const handleProceedToCheckout = useCallback(() => {
		if (entries.length > 0) {
			const items = mapCartEntriesToItems(entries, productFieldsMap, prices)
			const coupon = mapCartCoupon(appliedVouchers)
			const option = getCookie(ACCESS_TOKEN_KEY) ? 'registered user' : 'guest'

			const event: BeginCheckoutEvent = {
				event: 'begin_checkout',
				ecommerce: {
					currency: currencyISO,
					value: roundMoney(totalPrice),
					coupon,
					option,
					items,
				},
			}

			sendEcommerceEvent(event)
		}

		const href = proceedToCheckoutLink?.value?.href

		if (href) {
			router.push(href)
		}
	}, [
		entries,
		currencyISO,
		appliedVouchers,
		totalPrice,
		proceedToCheckoutLink,
		router,
		productFieldsMap,
		prices,
	])

	return (
		<div
			className="flex flex-col 768:gap-10 gap-3"
			data-testid="cart-container"
		>
			<div className="flex flex-col">
				<h1 className="768:typo-headline-xl-bold 1280:typo-headline-2xl-bold typo-headline-md-bold 768:mb-1 mb-2 text-brand-800">
					{title}
				</h1>
				<p className="typo-text-lg-regular 1280:mb-4 mb-3 text-gray-600">
					{T('cart.id')} {cartId}
				</p>
				<div className="flex 768:items-center gap-2">
					<IconShippingCostsTrackOrder16 size="lg" className="text-brand-500" />
					<RichText field={shippingLabel} tag="p" className="richtext" />
				</div>
			</div>
			<div className="flex flex-col 768:gap-10 gap-3">
				<div className="flex 768:flex-row flex-col-reverse 768:items-center justify-between gap-10">
					<Modal
						open={isDeleteAllProductsModalOpen}
						onOpenChange={setIsDeleteAllProductsModalOpen}
					>
						<ModalTrigger asChild>
							<ButtonLink className="self-start 768:self-center">
								<IconTrash16 size="md" /> {T('cart.empty_cart')}
							</ButtonLink>
						</ModalTrigger>
						<ModalContent
							variant="content"
							className="mx-auto flex w-full max-w-[592px] items-center"
						>
							<ModalHeader className="flex items-center gap-3">
								<ModalTitle>{T('cart.empty_cart')}?</ModalTitle>
								<ModalDescription className="text-center">
									{T('ModalDescription.modal_empty_cart_description')}
								</ModalDescription>
							</ModalHeader>
							<ModalFooter className="flex w-full gap-3">
								<Button
									variant="secondary"
									onClick={() => setIsDeleteAllProductsModalOpen(false)}
									className="flex-1"
									disabled={isDeleteCartPending}
								>
									{T('cart.cancel')}
								</Button>
								<ModalClose asChild>
									<Button
										className="flex-1"
										variant="primary"
										onClick={() => deleteCartMutate()}
										isLoading={isDeleteCartPending}
									>
										<IconTrash16 /> {T('cart.empty_cart')}
									</Button>
								</ModalClose>
							</ModalFooter>
						</ModalContent>
					</Modal>
					{pageEditing ? (
						<Button asChild>
							<span>
								<Link field={proceedToCheckoutLink} />
								<IconArrowRight16 className="rtl:rotate-180" size="md" />
							</span>
						</Button>
					) : (
						<Button onClick={handleProceedToCheckout}>
							{proceedToCheckoutLink?.value?.text}
							<IconArrowRight16 className="rtl:rotate-180" size="md" />
						</Button>
					)}
				</div>
				<div className="768:mb-0 mb-7 flex flex-col 768:gap-3 gap-3">
					<div className="1268:mb-4 mb-3 flex flex-col gap-3">
						{!!entries?.length &&
							entries.map((entry: CartEntry, idx: number) => {
								const lineSku = entry.product?.sku?.trim() ?? ''
								const lineProductFields = productFieldsMap[lineSku] ?? null
								const linePricing = prices[lineSku]

								return (
									<CartProductTileCard
										quantity={entry.quantity ?? 0}
										onCartRemove={() => {
											const item = mapCartEntryToItem(entry, {
												index: idx + 1,
												productFields: lineProductFields,
												pricing: linePricing,
											})
											const removedQty = entry.quantity ?? 1
											const removeCurrency = item.currency ?? currencyISO

											deleteCartItemMutate(
												{ entryNumber: entry.entryNumber ?? 0 },
												{
													onSuccess: () => {
														sendEcommerceEvent({
															event: 'remove_from_cart',
															ecommerce: {
																currency: removeCurrency,
																value: roundMoney(item.price * removedQty),
																items: [item],
															},
														})
													},
												},
											)
										}}
										entryNumber={entry.entryNumber ?? 0}
										product={entry.product}
										cartEntry={entry}
										lineIndex={idx + 1}
										productFields={lineProductFields}
										ecommercePricing={linePricing}
										// entryNumber is a position and shifts when a line is removed;
										// the SKU identifies the line (one line per product).
										key={entry.product?.sku ?? entry.entryNumber}
										pdpLink={pdpLink}
										maxQuantity={maxQuantity}
									/>
								)
							})}
					</div>

					{appliedVouchers
						?.filter((voucher) => !!voucher.voucherCode?.trim())
						.map((voucher: CartAppliedVoucher) => {
							const hasDescription = !!voucher.description?.trim()
							const discountDisplay = resolveVoucherDiscount(
								voucher,
								allPromotions,
								currencyISO,
								locale,
							)
							return (
								<div
									key={voucher.voucherCode}
									className="typo-text-lg-bold mt-0 rounded-2 bg-gray-50 p-6 1280:ps-26 768:ps-4 1280:pe-4 768:pe-4 text-green-700"
								>
									<div className="flex 768:flex-row flex-col items-start 768:items-center 1280:justify-between gap-8">
										<div className="flex flex-col">
											<div className="flex 768:flex-row flex-col 768:items-center gap-2">
												<IconDiscountCoupon16 size="md" />
												<span>
													{T('cart.coupon_code')} - {voucher.voucherCode}{' '}
													{hasDescription ? `-${voucher.description}` : null}
												</span>
											</div>
										</div>

										<div className="flex w-full flex-1 items-center 1280:justify-end justify-between gap-8 768:pe-4">
											<ButtonLink
												onClick={() =>
													removeVoucherMutate({
														voucherId: voucher.voucherCode ?? '',
														cartId,
														locale,
													})
												}
												disabled={isRemoveVoucherPending}
												aria-label={T('cart.remove_cart')}
											>
												{isRemoveVoucherPending ? (
													<LoadingSpinner />
												) : (
													<IconTrash16 />
												)}
												<span className="inline 768:hidden">
													{T('cart.remove_cart')}
												</span>
											</ButtonLink>

											{discountDisplay && <span>{discountDisplay}</span>}
										</div>
									</div>
								</div>
							)
						})}

					<div className="flex 768:flex-row flex-col 768:items-center justify-between gap-3 1280:py-4 py-3">
						<ButtonLink
							className="self-start"
							onClick={() => setIsDeleteAllProductsModalOpen(true)}
						>
							<IconTrash16 size="md" /> {T('cart.empty_cart')}
						</ButtonLink>
						<CouponCodeInput
							cartId={cartId}
							locale={locale}
							hasManualPromo={hasManualPromo}
						/>
					</div>

					<div className="flex justify-end gap-3 1280:pt-2 pt-4 pb-2">
						<CartPriceSummary
							subtotal={subtotal}
							totalPrice={totalPrice}
							shippingPrice={shippingPrice}
							VAT={VAT}
							currencyISO={currencyISO}
							vatLabel={vatLabel}
							orderDiscounts={orderDiscounts}
						/>
					</div>
				</div>

				<div className="flex 768:flex-row flex-col-reverse 768:items-center justify-between gap-3">
					<Button asChild variant="secondary">
						{pageEditing ? (
							<span>
								<Link field={linkToProductListingPage} />
							</span>
						) : (
							<Link field={linkToProductListingPage} />
						)}
					</Button>

					{pageEditing ? (
						<Button asChild>
							<span>
								<Link field={proceedToCheckoutLink} />
								<IconArrowRight16 className="rtl:rotate-180" size="md" />
							</span>
						</Button>
					) : (
						<Button onClick={handleProceedToCheckout}>
							{proceedToCheckoutLink?.value?.text}
							<IconArrowRight16 className="rtl:rotate-180" size="md" />
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}

export default CartClient
