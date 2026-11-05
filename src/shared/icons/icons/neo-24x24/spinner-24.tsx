import type { SVGProps } from 'react'
import { withStyles } from '@/shared/icons/utils/withStyles'
export const IconSpinner24 = withStyles((props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			xmlSpace="preserve"
			viewBox="0 0 24 24"
			{...props}
		>
			<path
				d="M12 3a9 9 0 1 0 0 18v-1.5a7.5 7.5 0 1 1 7.5-7.5H21a9 9 0 0 0-9-9"
				style={{
					fill: 'currentColor',
				}}
			/>
		</svg>
	)
})
