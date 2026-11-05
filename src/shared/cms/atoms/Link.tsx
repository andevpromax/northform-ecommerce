import NextLink from 'next/link'
import type { ComponentProps } from 'react'
import type { LinkValue } from '@/shared/cms/types/fields'
export function Link({
	field,
	showLinkTextWithChildrenPresent,
	children,
	...props
}: Omit<ComponentProps<typeof NextLink>, 'href'> & {
	href?: string
	field?: LinkValue
	showLinkTextWithChildrenPresent?: boolean
}) {
	return (
		<NextLink href={props.href || field?.value?.href || '/'} {...props}>
			{(!children || showLinkTextWithChildrenPresent) && field?.value?.text}
			{children}
		</NextLink>
	)
}
