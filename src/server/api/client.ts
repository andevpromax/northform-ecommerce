import type { z } from 'zod'
import { ApiError } from './errors'

const TIMEOUT_MS = 5000

// Express business errors that are meaningful to the storefront and keep their
// status. Anything else (401/403 from a token mismatch, unknown routes, 5xx)
// means the integration is broken and becomes a 502.
const PASS_THROUGH = new Set([400, 404, 409, 413, 429])

type RequestOptions<T> = {
	schema: z.ZodType<T>
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
	body?: unknown
	/** Guest session forwarded as X-Session-Id. */
	sessionId?: string
	/** Names the upstream in error messages, e.g. "Product service unavailable". */
	service?: string
}

// Server-only configuration, read at call time: neither value is NEXT_PUBLIC_,
// so neither can be inlined into a browser bundle.
function serverUrl(service: string) {
	const url = process.env.COMMERCE_SERVER_URL?.trim()
	if (!url) {
		console.error('COMMERCE_SERVER_URL is not configured')
		throw new ApiError(`${service} service is not configured`, 503)
	}
	return url
}

// JSON request to the Express API. There is no local fallback: when Express
// is unreachable or misbehaves, the caller gets an error.
export async function apiRequest<T>(
	path: string,
	{
		schema,
		method = 'GET',
		body,
		sessionId,
		service = 'Commerce',
	}: RequestOptions<T>,
): Promise<T> {
	const url = new URL(path, serverUrl(service))
	const token = process.env.INTERNAL_API_TOKEN
	let res: Response
	try {
		res = await fetch(url, {
			method,
			cache: 'no-store',
			headers: {
				accept: 'application/json',
				...(body === undefined ? {} : { 'content-type': 'application/json' }),
				...(sessionId ? { 'x-session-id': sessionId } : {}),
				...(token ? { 'x-internal-token': token } : {}),
			},
			body: body === undefined ? undefined : JSON.stringify(body),
			signal: AbortSignal.timeout(TIMEOUT_MS),
		})
	} catch {
		throw new ApiError(`${service} service unavailable`, 502)
	}

	const payload: unknown = await res.json().catch(() => undefined)
	if (!res.ok) {
		const message = (payload as { error?: unknown } | undefined)?.error
		if (
			PASS_THROUGH.has(res.status) &&
			typeof message === 'string' &&
			message !== 'Endpoint not found'
		)
			throw new ApiError(message, res.status)
		console.error(
			`${service} API ${method} ${url.pathname} returned ${res.status}`,
		)
		throw new ApiError(`${service} service error`, 502)
	}

	const parsed = schema.safeParse(payload)
	if (!parsed.success) {
		console.error(
			`${service} API ${method} ${url.pathname} returned an unexpected payload`,
		)
		throw new ApiError(`Invalid ${service.toLowerCase()} service response`, 502)
	}
	return parsed.data
}
