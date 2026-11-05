import type { SVGProps } from 'react'
import { withStyles } from '@/shared/icons/utils/withStyles'
export const IconCrossInCircle16 = withStyles(
	(props: SVGProps<SVGSVGElement>) => {
		return (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				xmlSpace="preserve"
				viewBox="0 0 16 16"
				{...props}
			>
				<path
					d="M10.42 5.58a.6.6 0 0 0-.84 0L8 7.15 6.42 5.58a.6.6 0 1 0-.84.84L7.15 8 5.58 9.58A.6.6 0 0 0 6 10.6a.6.6 0 0 0 .42-.18L8 8.85l1.58 1.57a.6.6 0 0 0 .84 0 .6.6 0 0 0 0-.84L8.85 8l1.57-1.58a.6.6 0 0 0 0-.84M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2m0 10.8a4.8 4.8 0 1 1 .01-9.61A4.8 4.8 0 0 1 8 12.8"
					style={{
						fill: 'currentColor',
					}}
				/>
			</svg>
		)
	},
)
