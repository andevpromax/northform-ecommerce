'use client'

import { Button } from '@/shared/ui/actions-inputs/Button'
import { ButtonLink } from '@/shared/ui/actions-inputs/ButtonLink'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormLabelWrapper,
	FormMessage,
} from '@/shared/ui/actions-inputs/Form'
import { Input } from '@/shared/ui/actions-inputs/Input'
import {
	Alert,
	AlertCloseButton,
	AlertContent,
	AlertIconContainer,
	AlertTitle,
} from '@/shared/ui/feedback/Alert'
import { LoadingSpinner } from '@/shared/ui/feedback/LoadingSpinner'
import { IconArrowRight16 } from '@/shared/icons/icons/neo-16x16/arrow-right-16'
import { IconCheckTickInCircle16 } from '@/shared/icons/icons/neo-16x16/check-tick-in-circle-16'
import { IconDiscountCoupon16 } from '@/shared/icons/icons/neo-16x16/discount-coupon-16'
import {
	type VoucherFormValues,
	voucherFormSchemaWithErrors,
} from '@/shared/schemas/voucher'
import { cn } from '@/shared/utils/cn'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useT } from 'talkr'
import useApplyVoucherMutation from '@/features/cart/hooks/mutations/voucher/useApplyVoucherMutation'

const CouponCodeInput = ({
	cartId,
	locale,
	hasManualPromo,
}: {
	cartId: string
	locale: string
	hasManualPromo?: boolean
}) => {
	const { T } = useT()

	const [isExpanded, setIsExpanded] = useState(false)
	const [isSuccessAlertVisible, setIsSuccessAlertVisible] = useState(false)
	const prevHasManualPromo = useRef<boolean | undefined>(hasManualPromo)

	const { mutate, isPending } = useApplyVoucherMutation()

	useEffect(() => {
		if (
			prevHasManualPromo.current === true &&
			hasManualPromo === false &&
			isSuccessAlertVisible
		) {
			setIsSuccessAlertVisible(false)
		}
		prevHasManualPromo.current = hasManualPromo
	}, [hasManualPromo, isSuccessAlertVisible])

	const form = useForm<VoucherFormValues>({
		resolver: zodResolver(voucherFormSchemaWithErrors(T)),
		defaultValues: {
			voucherCode: '',
		},
	})

	const {
		formState: { errors },
		control,
		handleSubmit: handleFormSubmit,
		reset,
		setError,
	} = form

	const onSubmit = async (data: VoucherFormValues) => {
		mutate(
			{
				voucherCode: data.voucherCode.trim(),
				cartId,
				locale,
			},
			{
				onSuccess: () => {
					setIsSuccessAlertVisible(true)
					setIsExpanded(false)
					reset()
				},
				onError: (error) => {
					setIsSuccessAlertVisible(false)
					setError('voucherCode', {
						type: 'server',
						message: T('cart.code_not_valid') || error.message,
					})
				},
			},
		)
	}

	const handleShowCouponForm = () => {
		setIsExpanded(!isExpanded)
		form.clearErrors()
	}

	const handleCloseSuccessAlert = () => {
		setIsSuccessAlertVisible(false)
	}

	return (
		<div className="ms-auto flex 768:w-[487px] w-full flex-col gap-3">
			{isSuccessAlertVisible && (
				<Alert variant="success" className="my-4">
					<AlertIconContainer>
						<IconCheckTickInCircle16 size="lg" />
					</AlertIconContainer>
					<AlertContent>
						<AlertTitle>{T('cart.coupon_successfully_applied')}</AlertTitle>
					</AlertContent>
					<AlertCloseButton
						aria-label={T('close_notification')}
						onClick={handleCloseSuccessAlert}
					/>
				</Alert>
			)}
			{!hasManualPromo && !isSuccessAlertVisible && (
				<>
					<ButtonLink
						className="self-start 768:self-end"
						onClick={handleShowCouponForm}
						aria-expanded={isExpanded}
					>
						<IconDiscountCoupon16 />
						{T('cart.apply_coupon_code')}
					</ButtonLink>
					{isExpanded && (
						<Form {...form}>
							<form
								onSubmit={handleFormSubmit(onSubmit)}
								className="flex flex-col space-y-2"
							>
								<FormField
									name="voucherCode"
									control={control}
									render={({ field }) => (
										<FormItem>
											<FormLabelWrapper>
												<FormLabel>{T('cart.coupon_code')}</FormLabel>
											</FormLabelWrapper>
											<div className="flex h-14 items-center overflow-hidden rounded-1 border-2 border-brand-500 focus-within:outline focus-within:outline-2 focus-within:outline-brand-300">
												<FormControl>
													<Input
														{...field}
														className="typo-text-lg-regular h-14 bg-base-transparent px-3 text-base-black [&::-webkit-search-cancel-button]:appearance-none"
														type="search"
														autoComplete="off"
														aria-label={T('cart.coupon_code')}
													/>
												</FormControl>
												<Button
													type="submit"
													isLoading={isPending}
													aria-label={T('cart.apply_coupon_code')}
													customLoading
													className={cn(
														'focus-ring -mr-1 flex size-[3.5rem] min-h-14 cursor-pointer items-center justify-center rounded-se-0.5 rounded-ee-0.5 bg-brand-500 focus-visible:outline-offset-[-0.125rem] disabled:opacity-50',
													)}
												>
													{isPending ? (
														<LoadingSpinner className="size-4 text-base-white" />
													) : (
														<IconArrowRight16
															size="sm"
															className="text-base-white rtl:rotate-180"
														/>
													)}
												</Button>
											</div>

											<FormMessage>
												{errors.voucherCode?.message?.toString()}
											</FormMessage>
										</FormItem>
									)}
								/>
							</form>
						</Form>
					)}
				</>
			)}
		</div>
	)
}

export default CouponCodeInput
