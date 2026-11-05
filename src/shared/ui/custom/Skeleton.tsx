import { cn } from '@/shared/utils/cn'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="skeleton"
			className={cn('animate-pulse rounded-2 bg-gray-200', className)}
			{...props}
		/>
	)
}

export { Skeleton }
