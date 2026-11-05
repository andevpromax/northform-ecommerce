/**
 * Inspired by i18next
 * @see https://github.com/i18next/i18next-intervalPlural-postProcessor/blob/master/src/index.js
 */

type Variables = Record<string, string | number>

const variableRegex = /\{(.*?)\}/
const intervalSeparator = ';'
const intervalRegex = /\((\S*)\).*?\[((.|\n)*)\]/

/**
 * Check if an interval matches a count
 */
function intervalMatches(interval: string, count: number): boolean {
	if (interval.includes('-')) {
		const p = interval.split('-')

		if (p[1] === '') {
			const from = Number.parseInt(p[0], 10)
			return count >= from
		}

		const from = Number.parseInt(p[0], 10)
		const to = Number.parseInt(p[1], 10)

		return count >= from && count <= to
	}

	const match = Number.parseInt(interval, 10)

	return match === count
}

/**
 * Check if a string contains interval plural syntax
 */
const isIntervalPlural = (str: string): boolean => {
	return intervalRegex.test(str) && str.includes(intervalSeparator)
}

/**
 * Apply variable interpolation to a string
 */
const interpolateVariables = (str: string, params: Variables): string => {
	return str.replace(new RegExp(variableRegex, 'g'), (match) => {
		const key = String(match)?.match(variableRegex)?.[1]

		if (!key || !(key in params)) {
			return match
		}

		return String(params[key])
	})
}

/**
 * Get count value from parameters - can be any numeric parameter
 */
const getCountFromParams = (params: Variables): number => {
	if ('count' in params && typeof params.count === 'number') {
		return params.count
	}

	return 0
}

/**
 * Process interval plural string
 */
const processIntervalPlural = (str: string, count: number): string | null => {
	const parts = str.split(intervalSeparator)

	let found: string | null = null

	for (const part of parts) {
		if (found) return found

		const match = intervalRegex.exec(part.trim())

		if (match && intervalMatches(match[1], count)) {
			found = match[2]
		}
	}

	return found
}

export const compose = (str: string, params: Variables = {}): string => {
	if (!str) return ''

	if (isIntervalPlural(str)) {
		const count = getCountFromParams(params)
		const matchedText = processIntervalPlural(str, count)

		if (matchedText !== null) {
			return interpolateVariables(matchedText, params)
		}

		return str
	}

	return interpolateVariables(str, params)
}
