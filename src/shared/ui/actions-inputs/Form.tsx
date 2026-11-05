import type * as LabelPrimitive from '@radix-ui/react-label'
import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'
import {
	Controller,
	type ControllerProps,
	type FieldPath,
	type FieldValues,
	FormProvider,
	useFormContext,
} from 'react-hook-form'

import { Label } from '@/shared/ui/actions-inputs/Label'
import { cn } from '@/shared/utils/cn'
import { cva } from 'class-variance-authority'

const Form = FormProvider

type FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
	name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
	{} as FormFieldContextValue,
)

const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	...props
}: ControllerProps<TFieldValues, TName>) => {
	return (
		<FormFieldContext.Provider value={{ name: props.name }}>
			<Controller {...props} />
		</FormFieldContext.Provider>
	)
}

const useFormField = () => {
	const fieldContext = React.useContext(FormFieldContext)
	const itemContext = React.useContext(FormItemContext)
	const { getFieldState, formState } = useFormContext()

	const fieldState = getFieldState(fieldContext.name, formState)

	if (!fieldContext) {
		throw new Error('useFormField should be used within <FormField>')
	}

	const { id } = itemContext

	return {
		id,
		name: fieldContext.name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	}
}

type FormItemContextValue = {
	id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
	{} as FormItemContextValue,
)

const FormItem = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	const id = React.useId()

	return (
		<FormItemContext.Provider value={{ id }}>
			<div ref={ref} className={cn(className)} {...props} />
		</FormItemContext.Provider>
	)
})
FormItem.displayName = 'FormItem'

const FormLabelWrapper = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	return (
		<div
			ref={ref}
			className={cn('mb-1.5 flex h-6 items-center gap-0.5', className)}
			{...props}
		/>
	)
})

const FormLabel = React.forwardRef<
	React.ElementRef<typeof LabelPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
		required?: boolean
		optional?: string
	}
>(({ className, required, optional, ...props }, ref) => {
	const { formItemId } = useFormField()

	return (
		<Label
			ref={ref}
			className={cn(
				'typo-label-lg-medium flex items-center [&_a]:font-bold [&_a]:underline',
				className,
			)}
			htmlFor={formItemId}
			{...props}
		>
			{props.children}
			<span
				className={cn('ms-1.5', required && 'pointer-events-none text-red-300')}
				aria-hidden
			>
				{required && '*'}
				{optional && `(${optional})`}
			</span>
		</Label>
	)
})

FormLabel.displayName = 'FormLabel'

const formControlWrapperStyles = cva(
	'relative flex has-[input[data-tag="custom-input"]]:cursor-text min-h-14 gap-2.5 border items-center rounded-1 typo-text-lg-regular focus-within:outline focus-within:outline-2 focus-within:outline-brand-500 has-[>:disabled]:bg-gray-100 has-[>:disabled]:border-gray-400 has-[>:disabled]:text-gray-500 has-[>:disabled]:cursor-not-allowed bg-base-white text-base-black has-[input[data-tag="custom-input"]]:px-3 has-[input[data-tag="custom-input"]]:py-1',
	{
		variants: {
			error: {
				true: 'border-red-500 hover:border-red-700 focus-within:border-brand-500 focus-within:hover:border-brand-500',
				false:
					'border-gray-400 hover:border-brand-800 focus-within:border-brand-500 focus-within:hover:border-brand-500',
			},
			noPadding: {
				true: 'has-[input[data-tag="custom-input"]]:px-0 has-[input[data-tag="custom-input"]]:py-0',
			},
		},
		defaultVariants: {
			error: false,
		},
	},
)

const FormControlWrapper = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & { noPadding?: boolean }
>(({ className, noPadding, ...props }, ref) => {
	const { error, formItemId } = useFormField()

	const handleWrapperClick = () => {
		const inputElement = document.getElementById(formItemId)
		if (inputElement) {
			inputElement.focus()
		}
	}

	return (
		<div
			ref={ref}
			className={cn(
				formControlWrapperStyles({ error: !!error, noPadding }),
				className,
			)}
			onClick={handleWrapperClick}
			{...props}
		/>
	)
})

const FormControl = React.forwardRef<
	React.ElementRef<typeof Slot>,
	React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
	const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
	const [descriptionExists, setDescriptionExists] = React.useState(false)

	// Check if the <FormDescription> exists in the DOM on the client-side
	React.useEffect(() => {
		const description = document.getElementById(formDescriptionId)
		setDescriptionExists(description !== null)
	}, [formDescriptionId])

	return (
		<Slot
			ref={ref}
			id={formItemId}
			aria-describedby={
				error
					? `${formMessageId} ${descriptionExists ? formDescriptionId : ''}`.trim()
					: descriptionExists
						? formDescriptionId
						: undefined
			}
			aria-invalid={!!error}
			{...props}
		/>
	)
})

FormControl.displayName = 'FormControl'

const FormDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
	const { formDescriptionId } = useFormField()

	return (
		<p
			ref={ref}
			id={formDescriptionId}
			className={cn(
				'typo-text-md-regular mt-2 text-gray-500 dark:text-gray-300',
				className,
			)}
			{...props}
		/>
	)
})
FormDescription.displayName = 'FormDescription'

const FormDescriptionLink = React.forwardRef<
	HTMLAnchorElement,
	React.AnchorHTMLAttributes<HTMLAnchorElement>
>(({ className, ...props }, ref) => {
	return (
		<div className="flex justify-end">
			<a
				ref={ref}
				className={cn(
					'typo-text-md-medium focus-ring mt-2 text-right text-brand-800 underline',
					className,
				)}
				{...props}
			/>
		</div>
	)
})
FormDescriptionLink.displayName = 'FormDescriptionLink'

const FormMessage = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
	const { error, formMessageId } = useFormField()
	const body = error ? String(error?.message) : children

	if (!body) {
		return null
	}

	return (
		<p
			ref={ref}
			id={formMessageId}
			className={cn('typo-text-md-regular mt-2 text-red-700', className)}
			{...props}
		>
			{body}
		</p>
	)
})
FormMessage.displayName = 'FormMessage'

export {
	useFormField,
	Form,
	FormItem,
	FormLabelWrapper,
	FormLabel,
	FormControl,
	FormControlWrapper,
	FormDescription,
	FormDescriptionLink,
	FormMessage,
	FormField,
}
