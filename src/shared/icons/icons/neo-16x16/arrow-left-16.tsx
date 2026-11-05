import type { SVGProps } from 'react'
import { withStyles } from '@/shared/icons/utils/withStyles'
export const IconArrowLeft16 = withStyles((props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			xmlSpace="preserve"
			viewBox="0 0 16 16"
			{...props}
		>
			<path
				d="M12.67 7.4H4.78l2.98-2.98a.6.6 0 0 0-.85-.84L2.48 8l4.43 4.42a.6.6 0 0 0 .85 0 .6.6 0 0 0 0-.85L4.78 8.6h7.89a.6.6 0 0 0 0-1.2"
				style={{
					fill: 'currentColor',
				}}
			/>
		</svg>
	)
})
