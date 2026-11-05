import type { SVGProps } from 'react'
import { withStyles } from '@/shared/icons/utils/withStyles'
export const IconCross48 = withStyles((props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			xmlSpace="preserve"
			viewBox="0 0 48 48"
			{...props}
		>
			<path
				d="m25.41 24 11.3-11.3a1 1 0 1 0-1.42-1.4L24 22.58l-11.3-11.3a1 1 0 1 0-1.4 1.42L22.58 24l-11.3 11.3a1 1 0 1 0 1.42 1.4L24 25.42l11.3 11.3a1 1 0 0 0 1.4 0 1 1 0 0 0 0-1.42z"
				style={{
					fill: 'currentColor',
				}}
			/>
		</svg>
	)
})
