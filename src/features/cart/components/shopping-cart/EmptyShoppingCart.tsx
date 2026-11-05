import { Button } from '@/shared/ui/actions-inputs/Button'
import { IconArrowRight16 } from '@/shared/icons/icons/neo-16x16/arrow-right-16'
import { IconShoppingCart16 } from '@/shared/icons/icons/neo-16x16/shopping-cart-16'
import { Link } from '@/shared/cms/atoms/Link'
import { RichText } from '@/shared/cms/atoms/RichText'

const EmptyShoppingCart = ({
	emptyCartHeadingText,
	emptyCartText,
	linkToProductListingPage,
	pageEditing,
}: {
	emptyCartHeadingText?: object
	emptyCartText?: object
	linkToProductListingPage?: object
	pageEditing?: boolean | null
}) => {
	return (
		<div className="m-auto flex 1280:max-w-[1008] flex-col items-center justify-center 1280:gap-10 gap-6 1280:px-20 768:px-8 py-6 text-center">
			<div className="h-[64px] w-[64px]">
				<IconShoppingCart16 size="28" className="text-brand-800" />
			</div>

			<div className="1280:mb-0 mb-2">
				<RichText
					field={emptyCartHeadingText}
					tag="h2"
					className="typo-headline-sm-bold 1280:typo-headline-lg-bold mb-4 text-brand-800"
				/>

				<RichText
					field={emptyCartText}
					tag="p"
					className="typo-text-lg-regular text-base-dark"
				/>
			</div>

			<Button asChild variant="primary">
				{pageEditing ? (
					<span>
						<Link
							field={linkToProductListingPage}
							className="768:w-auto w-full"
						/>
						<IconArrowRight16 className="rtl:rotate-180" />
					</span>
				) : (
					<Link
						field={linkToProductListingPage}
						showLinkTextWithChildrenPresent
						className="768:w-auto w-full"
					>
						<IconArrowRight16 className="rtl:rotate-180" />
					</Link>
				)}
			</Button>
		</div>
	)
}

export default EmptyShoppingCart
