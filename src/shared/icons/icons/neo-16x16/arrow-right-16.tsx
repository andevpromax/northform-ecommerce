import type { SVGProps } from 'react'
import { withStyles } from '@/shared/icons/utils/withStyles'
export const IconArrowRight16 = withStyles((props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			xmlSpace="preserve"
			viewBox="0 0 16 16"
			{...props}
		>
			<path
				d="M3.33 7.4h7.89L8.24 4.42a.6.6 0 0 1 .85-.84L13.52 8l-4.43 4.42a.6.6 0 1 1-.85-.85l2.98-2.97H3.33a.6.6 0 0 1 0-1.2"
				style={{
					fill: 'currentColor',
				}}
			/>
		</svg>
	)
})
