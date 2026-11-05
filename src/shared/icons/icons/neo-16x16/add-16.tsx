import type { SVGProps } from 'react'
import { withStyles } from '@/shared/icons/utils/withStyles'
export const IconAdd16 = withStyles((props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			xmlSpace="preserve"
			viewBox="0 0 16 16"
			{...props}
		>
			<path
				d="M13 7.4H8.6V3a.6.6 0 1 0-1.2 0v4.4H3a.6.6 0 1 0 0 1.2h4.4V13a.6.6 0 1 0 1.2 0V8.6H13a.6.6 0 0 0 0-1.2"
				style={{
					fill: 'currentColor',
				}}
			/>
		</svg>
	)
})
