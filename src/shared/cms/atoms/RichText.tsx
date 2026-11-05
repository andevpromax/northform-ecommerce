import { createElement, type HTMLAttributes } from 'react'
export function RichText({
	field,
	tag = 'span',
	purifyConfig: _purify,
	...props
}: HTMLAttributes<HTMLElement> & {
	field?: object
	tag?: string
	purifyConfig?: string
}) {
	return createElement(tag, props, (field as { value?: string })?.value ?? '')
}
