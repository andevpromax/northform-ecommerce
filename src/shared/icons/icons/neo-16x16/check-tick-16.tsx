import type { SVGProps } from 'react'
import { withStyles } from '@/shared/icons/utils/withStyles'
export const IconCheckTick16 = withStyles((props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			xmlSpace="preserve"
			viewBox="0 0 16 16"
			{...props}
		>
			<path
				d="m6.12 12.22-3.4-3.4a.6.6 0 0 1 .85-.85l2.55 2.55 6.32-6.31a.6.6 0 1 1 .84.85z"
				style={{
					fill: 'currentColor',
				}}
			/>
		</svg>
	)
})
