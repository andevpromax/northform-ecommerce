import type { SVGProps } from 'react'
import { withStyles } from '@/shared/icons/utils/withStyles'
export const IconCheckTickInCircle16 = withStyles(
	(props: SVGProps<SVGSVGElement>) => {
		return (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				xmlSpace="preserve"
				viewBox="0 0 16 16"
				{...props}
			>
				<path
					d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2m0 10.8a4.8 4.8 0 1 1 .01-9.61A4.8 4.8 0 0 1 8 12.8m1.91-6.84L7.1 8.77l-1.01-1a.6.6 0 0 0-.85 0 .6.6 0 0 0 0 .84l1.86 1.86 3.66-3.67c.23-.23.23-.6 0-.84s-.62-.24-.85 0"
					style={{
						fill: 'currentColor',
					}}
				/>
			</svg>
		)
	},
)
