import { cn } from '@/shared/utils/cn'
import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean
}

const ButtonLink = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button'
		return (
			<Comp
				className={cn(
					'typo-text-lg-bold focus-ring relative inline-flex min-h-9 items-center justify-center gap-2 rounded-none border-base-transparent border-b py-1 beige:text-metal-950 metal:text-beige-200 text-brand-800 transition-colors [word-break:break-word] hover:border-brand-800 focus-visible:outline-offset-6 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-gray-300 dark:text-base-white dark:hover:border-base-white',
					className,
				)}
				ref={ref}
				{...props}
			/>
		)
	},
)
ButtonLink.displayName = 'ButtonLink'

export { ButtonLink }
