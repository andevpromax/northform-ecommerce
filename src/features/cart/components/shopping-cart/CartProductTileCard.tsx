'use client'

import { useCartProductTileQuantity } from '@/features/cart/hooks/useCartProductTileQuantity'
import { Button } from '@/shared/ui/actions-inputs/Button'
import { ButtonLink } from '@/shared/ui/actions-inputs/ButtonLink'
import { ProductCardFallbackImageContainer } from '@/shared/ui/cards/ProductCard'
import { useLocaleParts } from '@/shared/hooks/useLocaleParts'
import { usePrice } from '@/shared/hooks/usePrice'
import { IconTrash16 } from '@/shared/icons/icons/neo-16x16/trash-16'
import { IconGroheLogoFilled } from '@/shared/icons/icons/social/grohe-logo-filled'
import { Image } from '@/shared/cms/atoms/Image'
import { RichText } from '@/shared/cms/atoms/RichText'
import type { ImageValue } from '@/shared/cms/types/fields'
import type { CartEntry } from '@/shared/schemas/cart'
import type { ProductPriceUpdated } from '@/shared/schemas/product'
import { compose } from '@/shared/schemas/utils/compose'
import { Link } from '@/shared/ui-shared/components/Link'
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
import { QuantityInput } from '@/shared/ui-shared/components/QuantityInput'
import { mapCartEntryToItem } from '@/features/tracking/ecommerce/mappers'
import { sendEcommerceEvent } from '@/features/tracking/ecommerce/sendEcommerceEvent'
import type { EcommerceProductFields } from '@/features/tracking/ecommerce/types'
import { formatPriceWithLocale } from '@/shared/utils/formatPriceWithLocale'
import { useT } from 'talkr'

const isValidNumber = (value: unknown): value is number =>
	typeof value === 'number' && !Number.isNaN(value)

type CartProductTileCardRootProps = {
	product: CartEntry['product']
	onCartRemove?: () => void
	entryNumber: number
	quantity: number
	pdpLink: string
	maxQuantity?: number
	cartEntry: CartEntry
	lineIndex: number
	productFields: EcommerceProductFields | null
	ecommercePricing: ProductPriceUpdated | undefined
}

export const CartProductTileCard = ({
	product,
	onCartRemove,
	entryNumber,
	quantity,
	pdpLink,
	maxQuantity = 99,
	cartEntry,
	lineIndex,
	productFields,
	ecommercePricing,
}: CartProductTileCardRootProps) => {
	const { T } = useT()
	const { raw: locale } = useLocaleParts()

	const { data: pricing } = usePrice({ sku: product?.sku || '', locale })
	const orderUnit = pricing?.orderUnit
	const step = orderUnit && orderUnit > 0 ? orderUnit : 1
	const min = step > 1 ? step : 1
	const stockMax = Math.min(maxQuantity, pricing.stock)
	const max = step > 1 ? Math.floor(stockMax / step) * step : stockMax

	const imageField: ImageValue = {
		value: {
			src: product?.imageUrl ?? '',
			alt: product?.name ?? '',
			width: '112',
			height: '160',
		},
	}

	const {
		openModalDeleteItem,
		setOpenModalDeleteItem,
		productQuantity,
		handleCartQuantityChange,
		isUpdating,
	} = useCartProductTileQuantity(entryNumber, quantity ?? 1, {
		step,
		min,
		ecommerceTracking: {
			cartEntry,
			lineIndex,
			productFields,
			pricing: ecommercePricing,
		},
	})

	const handleSelectItem = () => {
		const item = mapCartEntryToItem(cartEntry, {
			index: lineIndex,
			productFields,
			pricing: ecommercePricing,
		})
		sendEcommerceEvent({
			event: 'select_item',
			ecommerce: {
				item_list_id: 'cart',
				item_list_name: 'Cart',
				currency: item.currency ?? 'EUR',
				items: [item],
			},
		})
	}

	const currencyISO = product.price.currencyISO || 'EUR'
	const imageSrc = product?.imageUrl || ''

	const productName = product?.name || ''
	const productSku = product?.sku || ''
	const productDimensions = product?.dimensions || ''

	const validCurrentPrice = isValidNumber(product.price.value)
		? product.price.value
		: 0
	const validOriginalPrice = isValidNumber(product.originalPrice?.value)
		? product.originalPrice.value
		: 0

	const formattedCurrentPrice = formatPriceWithLocale(
		validCurrentPrice,
		currencyISO,
		locale,
	)
	const formattedOriginalPrice = formatPriceWithLocale(
		validOriginalPrice,
		currencyISO,
		locale,
	)

	const discount = product.discount || ''
	const isDiscountValue = Number.parseInt(discount, 10) > 0

	const fullPdpLink = pdpLink ? `${pdpLink}${product.sku}` : '/'

	return (
		<div className="grid 768:grid-cols-[auto_1fr] grid-cols-1 gap-4 768:gap-y-0 rounded-2 bg-gray-50 1280:p-4 p-6 1280:py-3">
			{imageSrc ? (
				<div className="h-[100px] w-[100px] shrink-0 overflow-hidden rounded-lg 768:h-[160px] 768:w-[160px]">
					<Image
						field={imageField}
						sizes="(max-width: 767px) 100px, 160px"
						className="block h-full w-full object-cover"
					/>
				</div>
			) : (
				<ProductCardFallbackImageContainer className="768:aspect-[7/11] aspect-[1/1] 768:h-[160px] h-[100px] 768:w-[112px] w-[100px]">
					<IconGroheLogoFilled className="h-auto w-auto max-w-[50%]" />
				</ProductCardFallbackImageContainer>
			)}

			<div className="768:my-auto grid 1280:grid-cols-[1fr_auto] items-center gap-4 1280:pe-4 768:pe-2">
				<div className="1280:mb-0 flex flex-col justify-between 1280:gap-3 gap-2 1280:pb-0 768:pb-2">
					{/* TODO: not in api, replace if there is something else instead */}
					{/* {productLine && (
						<div className="typo-text-sm-regular flex flex-col justify-between gap-2 text-gray-500">{productLine}</div>
					)} */}

					<div className="flex flex-col 1280:gap-1 gap-2">
						<div className="typo-text-lg-bold text-base-black">
							<Link
								href={fullPdpLink}
								className="underline"
								onClick={handleSelectItem}
							>
								<RichText
									field={{ value: productName }}
									tag="h2"
									purifyConfig="lineBreaksOnly"
								/>
							</Link>
						</div>

						<div className="typo-text-sm-regular flex flex-col justify-between gap-2 text-gray-500">
							{T('cart.product_number')} {productSku}
						</div>
					</div>
					{productDimensions && (
						<div className="typo-text-sm-regular flex flex-col justify-between gap-2 text-gray-500">
							{productDimensions}
						</div>
					)}
				</div>

				<div className="flex 1280:min-w-[148px] items-center justify-between 1280:gap-8 1280:self-center">
					<div className="flex 768:flex-row flex-col 768:items-center 768:gap-5 gap-4 self-end">
						<QuantityInput
							value={productQuantity}
							disabled={isUpdating}
							onChange={handleCartQuantityChange}
							onDecreaseBelowMin={() => setOpenModalDeleteItem(true)}
							min={min}
							max={max}
							step={step}
							fieldsetClassName="min-w-[130px]"
						/>
						<div className="768:flex inline-flex">
							<Modal
								open={openModalDeleteItem}
								onOpenChange={setOpenModalDeleteItem}
							>
								<ModalTrigger asChild>
									<ButtonLink
										aria-label={compose(T('cart.remove_cart_product'), {
											productName,
										})}
										className="typo-text-md-bold inline-flex items-end justify-self-start"
									>
										<IconTrash16 />
										<span className="inline 768:hidden">
											{T('cart.remove_cart')}
										</span>
									</ButtonLink>
								</ModalTrigger>
								<ModalContent
									variant="content"
									className="mx-auto flex w-full max-w-[592px] items-center"
								>
									<ModalHeader className="flex items-center gap-3">
										<ModalTitle>{T('cart.remove_item')}</ModalTitle>
										<ModalDescription className="text-center">
											{T('cart.modal_description')}
										</ModalDescription>
									</ModalHeader>
									<ModalFooter className="flex w-full gap-3">
										<Button
											variant="secondary"
											onClick={() => setOpenModalDeleteItem(false)}
											className="flex-1"
										>
											{T('cart.cancel')}
										</Button>
										<ModalClose asChild>
											<Button
												className="flex-1"
												variant="primary"
												aria-label={compose(T('cart.remove_cart_product'), {
													productName,
												})}
												onClick={() => {
													onCartRemove?.()
													setOpenModalDeleteItem(false)
												}}
											>
												<IconTrash16 /> {T('cart.remove_cart')}
											</Button>
										</ModalClose>
									</ModalFooter>
								</ModalContent>
							</Modal>
						</div>
					</div>

					<div className="flex 1280:min-w-[148px] flex-col items-end 1280:gap-1 gap-0.5 self-start 768:self-center 1280:ps-2">
						<span className="typo-text-lg-bold block text-base-black">
							{formattedCurrentPrice}
						</span>
						{isDiscountValue && (
							<div className="flex flex-wrap items-center gap-3">
								<s className="typo-text-sm-regular block text-gray-500">
									{formattedOriginalPrice}
								</s>
								<span className="!leading-none typo-text-sm-medium inline-flex rounded-full border border-green-300 bg-green-100 px-2 py-1 text-green-800 [line-height:1]">
									-{discount}
								</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default CartProductTileCard
