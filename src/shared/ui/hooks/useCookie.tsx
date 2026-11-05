'use client'

import { useCallback, useEffect, useState } from 'react'

const isClient = typeof window !== 'undefined'

interface CookieOptions {
	initialValue?: string
	days?: number
	/** Pass 'toplevel' to auto-derive TLD (e.g. ".grohe.com"), or an explicit domain string. */
	domain?: 'toplevel' | (string & {})
	/** Pass false to omit SameSite attribute. Defaults to 'lax'. */
	sameSite?: 'lax' | 'strict' | 'none' | false
}

const resolveTopLevelDomain = (): string | undefined => {
	if (!isClient) return undefined

	const hostname = window.location.hostname

	if (hostname === 'localhost') {
		return undefined
	}

	const parts = hostname.split('.')
	if (parts.length < 2) return undefined

	return `.${parts.slice(-2).join('.')}`
}

const resolveDomain = (domain: CookieOptions['domain']): string => {
	if (!domain) return ''

	const resolved = domain === 'toplevel' ? resolveTopLevelDomain() : domain
	return resolved ? `; domain=${resolved}` : ''
}

export const getCookie = (name: string): string | null => {
	if (!isClient) return null
	const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
	return match ? decodeURIComponent(match[2]) : null
}

export const setCookie = (
	name: string,
	value: string,
	options?: CookieOptions,
) => {
	if (!isClient) return

	const expires = options?.days
		? `; expires=${new Date(Date.now() + options.days * 864e5).toUTCString()}`
		: ''

	const secure = window.location.protocol === 'https:'
	const sameSite =
		options?.sameSite !== false
			? `; samesite=${options?.sameSite ?? 'lax'}`
			: ''
	const path = '/'
	const domain = resolveDomain(options?.domain)

	document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=${path}${domain}${secure ? '; secure' : ''}${sameSite}`
}

export const deleteCookie = (
	name: string,
	options?: Pick<CookieOptions, 'domain' | 'sameSite'>,
) => {
	if (!isClient) return

	const secure = window.location.protocol === 'https:'
	const sameSite =
		options?.sameSite !== false
			? `; samesite=${options?.sameSite ?? 'lax'}`
			: ''
	const path = '/'
	const domain = resolveDomain(options?.domain)

	document.cookie = `${name}=; Max-Age=-99999999; path=${path}${domain}${secure ? '; secure' : ''}${sameSite}`
}

export function useCookie(
	key: string,
	options?: CookieOptions,
): [
	string | null,
	(value: string, options?: CookieOptions) => void,
	() => void,
	boolean,
] {
	const [isPending, setIsPending] = useState(true)
	const [cookie, setCookieState] = useState<string | null>(null)

	useEffect(() => {
		const existingCookie = getCookie(key)
		setIsPending(false)
		setCookieState(existingCookie)
	}, [key])

	const updateCookie = useCallback(
		(value: string, newOptions?: CookieOptions) => {
			const mergedOptions = {
				...options,
				...newOptions,
			}
			setCookie(key, value, mergedOptions)
			setCookieState(value)
		},
		[key, options],
	)

	const removeCookie = useCallback(() => {
		deleteCookie(key)
		setCookieState(null)
	}, [key])

	return [cookie, updateCookie, removeCookie, isPending]
}
