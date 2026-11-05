'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/shared/utils/cn'

const RadioGroupRoot = React.forwardRef<
	React.ElementRef<typeof RadioGroupPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
	return (
		<RadioGroupPrimitive.Root
			className={cn('grid gap-2', className)}
			{...props}
			ref={ref}
		/>
	)
})

RadioGroupRoot.displayName = 'RadioGroupRoot'

const radioButtonClasses = cva(
	'flex items-center justify-center rounded-full border border-gray-400 focus-ring focus-visible:outline-offset-3 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500 disabled:data-[state=checked]:border-gray-300 disabled:data-[state=checked]:bg-gray-300',
	{
		variants: {
			size: {
				default: 'size-6',
				small: 'size-4',
			},
		},
	},
)

const indicatorClasses = cva(
	'flex rounded-full bg-base-white data-[disabled]:bg-gray-500',
	{
		variants: {
			size: {
				default: 'size-2.5',
				small: 'size-1.5',
			},
		},
	},
)

export interface RadioGroupItemProps
	extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
	size?: 'default' | 'small'
}

const RadioGroupItem = React.forwardRef<
	React.ElementRef<typeof RadioGroupPrimitive.Item>,
	RadioGroupItemProps
>(({ className, size = 'default', ...props }, ref) => {
	return (
		<RadioGroupPrimitive.Item
			ref={ref}
			className={cn(radioButtonClasses({ size, className }))}
			{...props}
		>
			<RadioGroupPrimitive.Indicator
				className={cn(indicatorClasses({ size }))}
			/>
		</RadioGroupPrimitive.Item>
	)
})

RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroupRoot, RadioGroupItem }
