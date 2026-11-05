import type { ImgHTMLAttributes } from 'react'
import type { ImageValue } from '@/shared/cms/types/fields'
export const Image = ({
	field,
	...props
}: ImgHTMLAttributes<HTMLImageElement> & { field: ImageValue }) => (
	<img
		{...props}
		src={field.value.src}
		alt={field.value.alt || ''}
		width={112}
		height={160}
	/>
)
