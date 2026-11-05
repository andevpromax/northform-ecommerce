'use client'

import { RadioGroupItem } from '@/shared/ui/actions-inputs/RadioGroup'
import type { PaymentMethods } from '@/shared/cms/types/fields'
import type { StoredPaymentMethod } from '@/shared/schemas/paymentMethods'
import { cn } from '@/shared/utils/cn'

type Provider = {
	id: string
	name: string
	icon?: string
}

type CartPaymentTileProps = {
	id: string
	name: string
	type: string
	providers: Provider[]
	stored: StoredPaymentMethod[]
	isSelected?: boolean
	selectedPaymentMethodId?: string | null
	isExternal: boolean
	paymentMethodsDatasource?: PaymentMethods
}

const CartPaymentTile = ({
	id,
	name,
	type,
	stored,
	providers,
	isSelected,
	selectedPaymentMethodId,
	isExternal,
	paymentMethodsDatasource,
}: CartPaymentTileProps) => {
	return (
		<div
			className={cn(
				'flex w-full flex-col items-start 1280:gap-6 gap-8 rounded-2 border border-2 border-base-transparent bg-gray-50 p-6',
				{
					'border-brand-500': isSelected,
				},
			)}
		>
			<div className="relative flex items-start 1280:items-center gap-3">
				<RadioGroupItem
					value={id}
					id={id}
					className="after:absolute after:inset-0 after:content-['']"
				/>
				<div className="flex 1280:flex-row flex-col 1280:items-center 1280:gap-3 gap-1">
					<label
						htmlFor={id}
						className="typo-text-lg-regular cursor-pointer text-gray-800"
					>
						{name}
					</label>
					<div className="flex gap-1">
						<span className="text-sm text-gray-500">
							Simulated • no card details
						</span>
					</div>
				</div>
			</div>
		</div>
	)
}

export default CartPaymentTile
