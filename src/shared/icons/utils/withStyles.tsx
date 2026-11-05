/// <reference path="./svg.d.ts" />

import { cn } from '@/shared/utils/cn'
import { type VariantProps, cva } from 'class-variance-authority'

const iconVariants = cva('flex-shrink-0', {
	variants: {
		size: {
			xs: 'size-4',
			sm: 'size-6',
			md: 'size-7',
			lg: 'size-8',
			'5': 'size-5',
			'10': 'size-10',
			'12': 'size-12',
			'16': 'size-16',
			'24': 'size-24',
			'28': 'size-28',
		},
	},
	defaultVariants: {
		size: 'sm',
	},
})

export type IconComponent = React.FC<
	React.SVGProps<SVGSVGElement> & VariantProps<typeof iconVariants>
>

export function withStyles(
	Icon: React.FC<React.SVGProps<SVGSVGElement>>,
): IconComponent {
	const render: IconComponent = ({ className, size, ...props }) => (
		<Icon
			aria-hidden
			{...props}
			className={cn(iconVariants({ size, className }))}
		/>
	)
	render.displayName = 'Icon'

	return render
}
