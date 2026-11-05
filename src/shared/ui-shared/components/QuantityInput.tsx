'use client'

import { IconAdd16 } from '@/shared/icons/icons/neo-16x16/add-16'
import { IconMinus16 } from '@/shared/icons/icons/neo-16x16/minus-16'
import { cn } from '@/shared/utils/cn'
import { useEffect, useId, useMemo, useState } from 'react'
import { useT } from 'talkr'

const ONLY_DIGITS_REGEX = /^\d+$/

export interface QuantityInputProps {
	value: number
	onChange?: (value: number) => void
	onIncrease?: () => void
	onDecrease?: () => void
	/** Called when decreasing at the minimum (e.g. to confirm removing a cart line). */
	onDecreaseBelowMin?: () => void
	min?: number
	max?: number
	step?: number
	disabled?: boolean
	fieldsetClassName?: string
	inputClassName?: string
	buttonClassName?: string
	id?: string
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
	onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
	'aria-label'?: string
}

export const QuantityInput: React.FC<QuantityInputProps> = ({
	value,
	onChange,
	onIncrease,
	onDecrease,
	onDecreaseBelowMin,
	min = 1,
	max = 99,
	step = 1,
	disabled = false,
	fieldsetClassName,
	inputClassName,
	buttonClassName,
	id,
	onBlur,
	onKeyDown,
	'aria-label': ariaLabel,
}) => {
	const { T } = useT()
	const generatedId = useId()
	const inputId = id ?? generatedId
	const quantityLabel = ariaLabel ?? T('pdp.product_quantity_label')

	const [draftValue, setDraftValue] = useState<string>(() => String(value))
	const [isEditing, setIsEditing] = useState(false)
	const [pendingCommit, setPendingCommit] = useState<number | null>(null)

	const safeMin = useMemo(() => Math.max(0, min), [min])
	const safeMax = useMemo(() => Math.max(safeMin, max), [safeMin, max])

	useEffect(() => {
		if (isEditing) return
		setDraftValue(String(value))
	}, [value, isEditing])

	useEffect(() => {
		if (pendingCommit == null) return
		if (value === pendingCommit) {
			setPendingCommit(null)
		}
	}, [value, pendingCommit])

	const clamp = (n: number) => Math.min(safeMax, Math.max(safeMin, n))

	const commitDraft = (raw: string) => {
		if (disabled) return

		const trimmed = raw.trim()
		if (trimmed === '') {
			setDraftValue(String(value))
			return
		}

		const parsed = Number.parseInt(trimmed, 10)
		if (Number.isNaN(parsed)) {
			setDraftValue(String(value))
			return
		}

		const next = clamp(parsed)
		setDraftValue(String(next))
		if (pendingCommit === next) return
		if (next !== value) {
			setPendingCommit(next)
			onChange?.(next)
		}
	}

	const handleDecrease = () => {
		if (disabled) return
		if (value <= safeMin && onDecreaseBelowMin) {
			onDecreaseBelowMin()
			return
		}
		onDecrease?.()
		const next = clamp(value - step)
		setIsEditing(false)
		setDraftValue(String(next))
		setPendingCommit(next)
		onChange?.(next)
	}

	const handleIncrease = () => {
		if (disabled) return
		onIncrease?.()
		const next = clamp(value + step)
		setIsEditing(false)
		setDraftValue(String(next))
		setPendingCommit(next)
		onChange?.(next)
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (disabled) return
		setIsEditing(true)
		const raw = e.target.value
		setDraftValue(raw)

		// Allow clear while typing; commit on blur/Enter
		if (raw === '') return

		// Commit only clean integers in-range
		if (!ONLY_DIGITS_REGEX.test(raw)) return

		const parsedValue = Number.parseInt(raw, 10)
		if (Number.isNaN(parsedValue)) return
		if (parsedValue < safeMin || parsedValue > safeMax) return

		setPendingCommit(parsedValue)
		onChange?.(parsedValue)
		setDraftValue(String(parsedValue))
	}

	const isDecreaseDisabled =
		disabled || (value <= safeMin && !onDecreaseBelowMin)
	const isIncreaseDisabled = disabled || value >= safeMax

	return (
		<fieldset
			aria-label={quantityLabel}
			className={cn(
				'flex justify-between rounded-1 border border-gray-400 bg-base-white',
				fieldsetClassName,
			)}
			data-testid="counter-input"
		>
			<button
				type="button"
				aria-label={T('pdp.decrease_quantity')}
				disabled={isDecreaseDisabled}
				data-testid="decrease-quantity-button"
				onClick={handleDecrease}
				className={cn(
					'focus-ring relative flex h-[44px] w-[40px] items-center p-2 focus-visible:outline-brand-500 focus-visible:outline-offset-[-1px] disabled:cursor-not-allowed disabled:opacity-70',
					buttonClassName,
				)}
			>
				<IconMinus16 size="sm" />
			</button>
			<label className="sr-only" htmlFor={inputId}>
				{quantityLabel}
			</label>
			<input
				id={inputId}
				aria-label={quantityLabel}
				type="number"
				value={draftValue}
				min={safeMin}
				max={safeMax}
				step={step}
				disabled={disabled}
				data-testid="quantity-input"
				autoComplete="off"
				onChange={handleInputChange}
				onBlur={(e) => {
					setIsEditing(false)
					commitDraft(e.target.value)
					onBlur?.(e)
				}}
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						setIsEditing(false)
						commitDraft((e.currentTarget as HTMLInputElement).value)
					}
					onKeyDown?.(e)
				}}
				className={cn(
					'focus-ring typo-text-lg-bold no-spin item-center flex h-[44px] w-[48px] px-2 text-center text-base-black [appearance:textfield] focus-visible:outline-brand-500 focus-visible:outline-offset-[-1px] disabled:cursor-not-allowed disabled:opacity-70',
					inputClassName,
				)}
			/>
			<button
				type="button"
				aria-label={T('pdp.increase_quantity')}
				disabled={isIncreaseDisabled}
				data-testid="increase-quantity-button"
				onClick={handleIncrease}
				className={cn(
					'focus-ring relative flex h-[44px] w-[40px] items-center p-2 focus-visible:outline-brand-500 focus-visible:outline-offset-[-1px] disabled:cursor-not-allowed disabled:opacity-70',
					buttonClassName,
				)}
			>
				<IconAdd16 size="sm" />
			</button>
		</fieldset>
	)
}
