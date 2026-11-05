import type { SVGProps } from 'react'
import { withStyles } from '@/shared/icons/utils/withStyles'
export const IconShoppingCart16 = withStyles(
	(props: SVGProps<SVGSVGElement>) => {
		return (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				xmlSpace="preserve"
				viewBox="0 0 16 16"
				{...props}
			>
				<path
					d="M11.94 11H5.73l-.6-2h7.28a.94.94 0 0 0 .9-.67L14.61 4h-11l-.39-1.29A1 1 0 0 0 2.27 2H1.1a.6.6 0 0 0 0 1.2h1.02l2.37 7.87A2 2 0 0 0 4 11 2 2 0 0 0 2 13.06 2 2 0 0 0 3.94 15a2 2 0 0 0 1.9-2.8h4.33a2 2 0 0 0 1.45 2.77 2 2 0 0 0 2.36-2.25A2.04 2.04 0 0 0 11.94 11M13 5.2l-.78 2.6H4.76l-.78-2.6zm-9 8.6a.8.8 0 0 1 0-1.6.8.8 0 0 1 0 1.6m8 0a.8.8 0 0 1 0-1.6.8.8 0 0 1 0 1.6"
					style={{
						fill: 'currentColor',
					}}
					transform="translate(.25)"
				/>
			</svg>
		)
	},
)
