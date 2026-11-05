import { IconCross16 } from '@/shared/icons/icons/neo-16x16/cross-16'
import { cn } from '@/shared/utils/cn'
import { Slot } from '@radix-ui/react-slot'

export type AlertType = 'info' | 'warning' | 'error' | 'success'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode
	variant?: AlertType
}
export const Alert: React.FC<AlertProps> = ({
	variant = 'info',
	className,
	...props
}) => {
	return (
		<div
			className={cn(
				'group flex flex-wrap items-start gap-4 rounded-2 border p-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]',
				{
					'alert-info border-brand-300 bg-brand-100 text-brand-800':
						variant === 'info',
					'alert-warning border-orange-300 bg-orange-100 text-orange-800 ':
						variant === 'warning',
					'alert-error border-red-200 bg-red-100 text-red-800':
						variant === 'error',
					'alert-success border-green-200 bg-green-100 text-green-800':
						variant === 'success',
				},
				className,
			)}
			role="alert"
			{...props}
		/>
	)
}
Alert.displayName = 'Alert'

type AlertIconContainerProps = React.PropsWithChildren<
	React.HTMLAttributes<HTMLDivElement>
>
export const AlertIconContainer: React.FC<AlertIconContainerProps> = ({
	className,
	...props
}) => {
	return (
		<div
			className={cn(
				'flex-shrink-0 group-[.alert-error]:text-red-600 group-[.alert-info]:text-brand-500 group-[.alert-success]:text-green-600 group-[.alert-warning]:text-orange-600',
				className,
			)}
			{...props}
		/>
	)
}
AlertIconContainer.displayName = 'AlertIconContainer'

type AlertContentProps = React.PropsWithChildren<
	React.HTMLAttributes<HTMLDivElement>
>
export const AlertContent: React.FC<AlertContentProps> = ({
	className,
	...props
}) => {
	return (
		<div
			className={cn(
				'1024:order-2 order-3 flex 1024:w-auto w-full grow flex-col justify-center gap-1 self-stretch',
				className,
			)}
			{...props}
		/>
	)
}
AlertContent.displayName = 'AlertContent'

interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
	children: React.ReactNode
	asChild?: boolean
}
export const AlertTitle: React.FC<AlertTitleProps> = ({
	asChild,
	className,
	...props
}) => {
	const Comp = asChild ? Slot : 'h4'
	return <Comp className={cn('typo-text-lg-bold', className)} {...props} />
}
AlertTitle.displayName = 'AlertTitle'

interface AlertDescriptionProps
	extends React.HTMLAttributes<HTMLParagraphElement> {
	children: React.ReactNode
	asChild?: boolean
}
export const AlertDescription: React.FC<AlertDescriptionProps> = ({
	children,
	className,
	asChild,
}) => {
	const Comp = asChild ? Slot : 'p'
	return (
		<Comp className={cn('typo-text-lg-regular', className)}>{children}</Comp>
	)
}
AlertDescription.displayName = 'AlertDescription'

interface AlertLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	children: React.ReactNode
	asChild?: boolean
}
export const AlertLink: React.FC<AlertLinkProps> = ({
	asChild,
	className,
	...props
}) => {
	const Comp = asChild ? Slot : 'a'

	return (
		<Comp
			className={cn('typo-text-lg-bold mt-5 underline', className)}
			{...props}
		/>
	)
}
AlertLink.displayName = 'AlertLink'

export const AlertCloseButton: React.FC<
	React.HTMLAttributes<HTMLButtonElement>
> = ({ className, ...props }) => {
	return (
		<button
			className={cn(
				'-mt-1 -me-1 1024:order-3 order-2 ms-auto text-gray-900',
				className,
			)}
			{...props}
		>
			<IconCross16 size="sm" />
		</button>
	)
}
AlertCloseButton.displayName = 'AlertCloseButton'
