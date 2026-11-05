'use client'

import { useAnnouncer } from '@/features/feedback/announcer/AnnouncerProvider'
import { cn } from '@/shared/utils/cn'
import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'
import { LoadingSpinner } from '@/shared/ui/feedback/LoadingSpinner'

// const buttonVariants = cva(
// 	'[word-break:break-word] typo-text-lg-bold inline-flex items-center gap-2 justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 disabled:border-0 disabled:text-gray-500 dark:disabled:text-gray-500 dark:disabled:hover:bg-gray-300 focus-ring focus-visible:outline-offset-6 disabled:hover:after:content-none disabled:hover:bg-gray-300 disabled:hover:text-gray-500 disabled:hover:border-0',
// 	{
// 		variants: {
// 			size: {
// 				large: 'min-h-16',
// 				medium: 'min-h-11',
// 				responsive: 'min-h-11 768:min-h-16',
// 			},
// 			variant: {
// 				primary:
// 					'bg-[#245447] text-white hover:bg-[#193B32] dark:bg-[#245447] dark:text-white dark:hover:bg-[#193B32]',
// 				secondary:
// 					'bg-transparent border border-gray-400 light:border-gray-400 text-brand-800 light:text-brand-800 hover:bg-brand-800 light:hover:bg-brand-800 gray:border-gray-400 gray:text-brand-800 gray:hover:bg-brand-800 gray:hover:text-base-white hover:text-base-white light:hover:text-base-white dark:bg-transparent dark:border dark:border-base-white dark:text-base-white dark:hover:bg-base-white dark:hover:text-brand-800 dark:focus-visible:after:content-none metal:border-beige-200 metal:text-beige-200 hover:metal:bg-beige-200 hover:metal:text-metal-950 beige:border-metal-950 beige:text-metal-950 hover:beige:bg-metal-950 hover:beige:text-beige-200',
// 				tertiary:
// 					'bg-brand-500 light:bg-brand-500 text-base-white light:text-base-white hover:bg-brand-600 light:hover:bg-brand-600 gray:bg-brand-500 gray:text-base-white gray:hover:bg-brand-600 dark:bg-brand-500 dark:text-base-white dark:hover:bg-brand-600 dark:focus-visible:after:content-none beige:bg-metal-950 beige:hover:bg-metal-900 beige:text-beige-200 metal:bg-beige-200 metal:text-metal-950 metal:hover:bg-beige-700',
// 			},
// 			withIcon: {
// 				true: null,
// 				false: null,
// 			},
// 			isLoading: {
// 				true: 'pointer-events-none',
// 			},
// 		},
// 		compoundVariants: [
// 			{ withIcon: true, size: 'large', className: 'p-4.5' },
// 			{ withIcon: true, size: 'medium', className: 'p-2' },
// 			{ withIcon: false, size: 'large', className: 'px-6 py-4' },
// 			{ withIcon: false, size: 'medium', className: 'px-4 py-1.5' },
// 			{
// 				withIcon: false,
// 				size: 'responsive',
// 				className: 'px-4 py-1.5 768:px-6 768:py-4',
// 			},
// 		],
// 		defaultVariants: {
// 			variant: 'primary',
// 			size: 'large',
// 		},
// 	},
// )

const buttonVariants = cva(
	'inline-flex items-center justify-center gap-2 rounded-full transition-colors focus-ring disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:border-0',
	{
		variants: {
			size: {
				large: 'min-h-16',
				medium: 'min-h-11',
				responsive: 'min-h-11 768:min-h-16',
			},
			variant: {
				primary: 'bg-[#245447] text-white hover:bg-[#193B32]',

				secondary:
					'border border-[#245447] bg-transparent text-[#245447] hover:bg-[#245447] hover:text-white',

				tertiary: 'bg-brand-500 text-white hover:bg-brand-600',
			},
			withIcon: {
				true: null,
				false: null,
			},
			isLoading: {
				true: 'pointer-events-none',
			},
		},
		compoundVariants: [
			{ withIcon: true, size: 'large', className: 'p-4.5' },
			{ withIcon: true, size: 'medium', className: 'p-2' },
			{ withIcon: false, size: 'large', className: 'px-6 py-4' },
			{ withIcon: false, size: 'medium', className: 'px-4 py-1.5' },
			{
				withIcon: false,
				size: 'responsive',
				className: 'px-4 py-1.5 768:px-6 768:py-4',
			},
		],
		defaultVariants: {
			variant: 'primary',
			size: 'large',
		},
	},
)

const buttonLoadingVariants = cva('', {
	variants: {
		variant: {
			primary: 'text-base-white',
			secondary: 'text-brand-800',
			tertiary: 'text-base-white',
		},
	},
	defaultVariants: {
		variant: 'primary',
	},
})

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean
	withIcon?: boolean
	isLoading?: boolean
	loadingMessage?: string
	customLoading?: boolean
}

/**
 * Only announce the loading message after a delay to avoid announcing it too early for immediate actions
 */
const LOADING_MESSAGE_DELAY = 500

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant,
			size,
			withIcon = false,
			asChild = false,
			isLoading = false,
			loadingMessage,
			customLoading = false,
			children,
			onKeyDown,
			disabled = false,
			...props
		},
		ref,
	) => {
		const { announce } = useAnnouncer()

		const Comp = asChild ? Slot : 'button'

		const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
			if (isLoading || disabled) {
				// Prevent activation via Enter or Space when loading or disabled
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault()
					e.stopPropagation()
					return
				}
			}

			onKeyDown?.(e)
		}

		React.useEffect(() => {
			if (!isLoading || !loadingMessage) return
			const timeoutId = setTimeout(
				() => announce(loadingMessage),
				LOADING_MESSAGE_DELAY,
			)
			return () => clearTimeout(timeoutId)
		}, [isLoading, announce, loadingMessage])

		return (
			<Comp
				aria-busy={isLoading && !disabled}
				disabled={disabled}
				className={cn(
					buttonVariants({ variant, size, withIcon, isLoading }),
					className,
				)}
				ref={ref}
				onKeyDown={handleKeyDown}
				{...props}
			>
				{isLoading && !customLoading ? (
					<LoadingSpinner className={buttonLoadingVariants({ variant })} />
				) : (
					children
				)}
			</Comp>
		)
	},
)

Button.displayName = 'Button'

export { Button, buttonVariants }
