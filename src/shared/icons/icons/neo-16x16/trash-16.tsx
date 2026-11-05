import type { SVGProps } from 'react'
import { withStyles } from '@/shared/icons/utils/withStyles'
export const IconTrash16 = withStyles((props: SVGProps<SVGSVGElement>) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			xmlSpace="preserve"
			viewBox="0 0 16 16"
			{...props}
		>
			<path
				d="m10.3 3 .01-.02a2.31 2.31 0 1 0-4.62 0V3H2.1a.6.6 0 0 0 0 1.2h.45l.97 8.5c.09.74.71 1.3 1.46 1.3h6.06c.75 0 1.37-.56 1.46-1.3l.97-8.5h.44a.6.6 0 0 0 0-1.2zM8 1.87c.61 0 1.11.5 1.11 1.1V3H6.89v-.02c0-.61.5-1.11 1.11-1.11m3.3 10.7a.3.3 0 0 1-.27.23H4.97a.3.3 0 0 1-.27-.24L3.75 4.2h8.5zM10 6H8.8v4.07a.6.6 0 0 0 1.2 0zM7.2 6H6v4.07a.6.6 0 0 0 1.2 0z"
				style={{
					fill: 'currentColor',
				}}
			/>
		</svg>
	)
})
