import type { SVGProps } from 'react'
import { withStyles } from '@/shared/icons/utils/withStyles'
export const IconMinus16 = withStyles((props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			xmlSpace="preserve"
			viewBox="0 0 16 16"
			{...props}
		>
			<path
				d="M12.33 8.6H3.67a.6.6 0 0 1 0-1.2h8.66a.6.6 0 1 1 0 1.2"
				style={{
					fill: 'currentColor',
				}}
			/>
		</svg>
	)
})
