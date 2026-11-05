import type { SVGProps } from 'react'
import { withStyles } from '@/shared/icons/utils/withStyles'
export const IconCross24 = withStyles((props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			xmlSpace="preserve"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				d="m13.06 12 5.47-5.47a.75.75 0 1 0-1.06-1.06L12 10.94 6.53 5.47a.75.75 0 1 0-1.06 1.06L10.94 12l-5.47 5.47a.75.75 0 0 0 1.06 1.06L12 13.06l5.47 5.47a.75.75 0 0 0 1.06 0 .75.75 0 0 0 0-1.06z"
				style={{
					fill: 'currentColor',
				}}
			/>
		</svg>
	)
})
