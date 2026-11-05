import type { SVGProps } from 'react'
import { withStyles } from '@/shared/icons/utils/withStyles'
export const IconCross16 = withStyles((props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			xmlSpace="preserve"
			viewBox="0 0 16 16"
			{...props}
		>
			<path
				d="m8.85 8 3.57-3.58a.6.6 0 0 0-.84-.85L8 7.15 4.42 3.58a.6.6 0 1 0-.84.85L7.15 8l-3.58 3.58a.6.6 0 0 0 .85.84L8 8.85l3.58 3.57a.6.6 0 0 0 .84 0 .6.6 0 0 0 0-.84z"
				style={{
					fill: 'currentColor',
				}}
			/>
		</svg>
	)
})
