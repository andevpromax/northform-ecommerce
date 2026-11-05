'use client'

import {
	type FC,
	type HTMLAttributes,
	type PropsWithChildren,
	createContext,
	useContext,
} from 'react'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

const HeadingLevelContext = createContext<HeadingLevel>(0 as HeadingLevel)

const HeadingProvider: FC<PropsWithChildren & { skipLevel?: boolean }> = ({
	children,
	skipLevel,
}) => {
	const level = useContext(HeadingLevelContext)
	const nextLevel: HeadingLevel = skipLevel
		? level
		: (Math.min(level + 1, 6) as HeadingLevel)

	return (
		<HeadingLevelContext.Provider value={nextLevel}>
			{children}
		</HeadingLevelContext.Provider>
	)
}

const Heading: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({
	className,
	...props
}) => {
	const level = useContext(HeadingLevelContext)

	const Comp: React.ElementType = `h${level}`

	return <Comp className={className} {...props} />
}

export { Heading, HeadingProvider, HeadingLevelContext }
