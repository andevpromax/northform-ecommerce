'use client'

import { IconCross24 } from '@/shared/icons/icons/neo-24x24/cross-24'
import { IconCross48 } from '@/shared/icons/icons/neo-48x48/cross-48'
import { cn } from '@/shared/utils/cn'
import * as ModalPrimitive from '@radix-ui/react-dialog'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import * as React from 'react'

type ModalPropsVariant = 'content' | 'video'

export interface ModalProps {
	variant: ModalPropsVariant
}

const Modal = ModalPrimitive.Root

const ModalTrigger = ModalPrimitive.Trigger

const ModalPortal = ModalPrimitive.Portal

const ModalClose = ModalPrimitive.Close

const ModalOverlay = React.forwardRef<
	React.ElementRef<typeof ModalPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof ModalPrimitive.Overlay> & {
		variant?: ModalPropsVariant
	}
>(({ className, variant, ...props }, ref) => (
	<ModalPrimitive.Overlay
		ref={ref}
		className={cn(
			'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-gray-900/70 data-[state=closed]:animate-out data-[state=open]:animate-in',
			{
				'bg-base-transparent backdrop-blur-2xl': variant === 'video',
			},
			className,
		)}
		{...props}
	/>
))
ModalOverlay.displayName = ModalPrimitive.Overlay.displayName

const modalContentVariants = cva(
	'fixed left-[50%] flex flex-col z-50 w-full translate-x-[-50%] bg-base-white p-4 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
	{
		variants: {
			variant: {
				content:
					'max-768:bottom-0 max-768:top-auto max-768:max-h-[calc(100dvh-32px)] max-768:rounded-t-2 max-768:rounded-b-none rounded-2 max-w-5xl h-auto px-4 pt-18 1280:pt-16 768:pt-10 pb-8 1280:p-16 768:px-10 1280:px-16 768:top-1/2 768:-translate-y-1/2 768:max-h-[calc(100dvh-32px)] overflow-y-auto',
				video:
					'top-0 gap-4 w-screen justify-between max-w-screen py-20 pt-4 overflow-y-auto landscape:max-1280:overflow-hidden landscape:max-1280:items-center h-screen flex flex-col 1280:p-10 bg-gray-900/70 1280:pt-10',
			},
		},
		defaultVariants: {
			variant: 'content',
		},
	},
)

export type ModalContentRef = React.ElementRef<typeof ModalPrimitive.Content>

export interface ModalContentProps
	extends React.ComponentPropsWithoutRef<typeof ModalPrimitive.Content> {
	variant: ModalPropsVariant
	TmodalClose?: string
}

const ModalContent = React.forwardRef<ModalContentRef, ModalContentProps>(
	({ className, children, TmodalClose, variant, ...props }, ref) => {
		return (
			<ModalPortal>
				<ModalOverlay variant={variant} />
				<ModalPrimitive.Content
					ref={ref}
					className={cn(modalContentVariants({ variant }), className)}
					{...props}
				>
					<div className="flex w-full justify-end">
						<ModalPrimitive.Close
							aria-label={TmodalClose}
							className={cn(
								'focus-ring typo-text-lg-regular flex flex-shrink-0 items-center justify-center opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-offset-6 disabled:pointer-events-none',
								{
									'absolute 1280:end-6 end-4 top-6 focus-visible:outline-brand-800':
										variant === 'content',
									'h-16 w-16 rounded-full border border-base-white focus-visible:outline-base-white':
										variant === 'video',
								},
							)}
						>
							{variant === 'content' ? (
								<IconCross48 size="12" className="text-brand-800" />
							) : (
								<IconCross24 size="md" className="text-base-white" />
							)}
							{TmodalClose && <span className="sr-only">{TmodalClose}</span>}
						</ModalPrimitive.Close>
					</div>
					{children}
				</ModalPrimitive.Content>
			</ModalPortal>
		)
	},
)

ModalContent.displayName = ModalPrimitive.Content.displayName

const ModalHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('mb-5 flex flex-col space-y-1', className)} {...props} />
)
ModalHeader.displayName = 'ModalHeader'

const ModalFooter = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			'flex 768:flex-row flex-col-reverse justify-start gap-3 768:pt-8 pt-6',
			className,
		)}
		{...props}
	/>
)
ModalFooter.displayName = 'ModalFooter'

const ModalTitle = React.forwardRef<
	React.ElementRef<typeof ModalPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof ModalPrimitive.Title>
>(({ className, ...props }, ref) => (
	<ModalPrimitive.Title
		ref={ref}
		className={cn(
			'typo-headline-xs-bold 1280:typo-headline-sm-bold text-brand-800',
			className,
		)}
		{...props}
	/>
))
ModalTitle.displayName = ModalPrimitive.Title.displayName

const ModalDescription = React.forwardRef<
	React.ElementRef<typeof ModalPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof ModalPrimitive.Description>
>(({ className, ...props }, ref) => (
	<ModalPrimitive.Description
		ref={ref}
		className={cn('typo-text-lg-regular', className)}
		{...props}
	/>
))
ModalDescription.displayName = ModalPrimitive.Description.displayName

export {
	Modal,
	ModalPortal,
	ModalOverlay,
	ModalTrigger,
	ModalClose,
	ModalContent,
	ModalHeader,
	ModalFooter,
	ModalTitle,
	ModalDescription,
}
