import { IconSpinner24 } from '@/shared/icons/icons/neo-24x24/spinner-24'
import { cn } from '@/shared/utils/cn'
import { type VariantProps, cva } from 'class-variance-authority'
import type React from 'react'

const spinnerVariants = cva('flex-col items-center justify-center', {
	variants: {
		show: {
			true: 'flex',
			false: 'hidden',
		},
	},
	defaultVariants: {
		show: true,
	},
})

const iconVariants = cva('animate-spin text-brand-500', {
	variants: {
		size: {
			xs: 'size-3',
			sm: 'size-4.5',
			md: 'size-6',
			lg: 'size-9',
		},
	},
	defaultVariants: {
		size: 'md',
	},
})

interface SpinnerContentProps
	extends VariantProps<typeof spinnerVariants>,
		VariantProps<typeof iconVariants> {
	className?: string
	children?: React.ReactNode
}

export const LoadingSpinner: React.FC<SpinnerContentProps> = ({
	show,
	size,
	className,
	children,
}) => {
	return (
		<div className={cn(spinnerVariants({ show }), className)}>
			<IconSpinner24 className={cn(iconVariants({ size }), className)} />
			{children}
		</div>
	)
}
