import * as React from 'react'

import { cn } from '@/shared/utils/cn'

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				data-tag="custom-input"
				className={cn(
					'max-w-full flex-1 placeholder:text-gray-500 placeholder:italic focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100',
					className,
				)}
				ref={ref}
				{...props}
			/>
		)
	},
)
Input.displayName = 'Input'

export { Input }
