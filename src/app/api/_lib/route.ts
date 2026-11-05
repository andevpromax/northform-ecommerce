import { randomUUID } from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { ApiError, toApiError } from '@/server/api/errors'
import { SESSION_COOKIE, parseSessionId } from '@/shared/services/session'

const MAX_BODY_LENGTH = 16_384

type HandlerInput<P> = {
	/** Guest session UUID from the HttpOnly cookie, or a new one for this request. */
	sessionId: string
	/** Parsed JSON body ({} when empty); validate it in the handler. */
	body: unknown
	params: P
}

// Successful JSON response. Session-owned data must never be cached.
export const ok = (data: unknown, status = 200) =>
	NextResponse.json(data, {
		status,
		headers: { 'Cache-Control': 'private, no-store' },
	})

// Wraps a Route Handler with the cross-cutting HTTP concerns shared by every
// /api route: guest session cookie, same-origin check for mutations, JSON body
// parsing with a size limit, and mapping errors to { error } responses.
export function route<P = Record<string, never>>(
	handler: (input: HandlerInput<P>) => Promise<NextResponse>,
) {
	return async (request: NextRequest, context?: { params: Promise<P> }) => {
		// A missing or malformed cookie starts a new guest session.
		const sessionId =
			parseSessionId(request.cookies.get(SESSION_COOKIE)?.value) ?? randomUUID()
		try {
			if (request.method !== 'GET') assertSameOrigin(request)
			const body = await readJsonBody(request)
			const response = await handler({
				sessionId,
				body,
				params: (await context?.params) as P,
			})
			response.cookies.set(SESSION_COOKIE, sessionId, {
				httpOnly: true,
				sameSite: 'lax',
				secure: isHttps(request),
				path: '/',
				maxAge: 86400,
			})
			return response
		} catch (error) {
			const { status, message } = toApiError(error)
			return NextResponse.json(
				{ error: message },
				{ status, headers: { 'Cache-Control': 'no-store' } },
			)
		}
	}
}

// Behind a TLS-terminating proxy the request URL is http, so trust the
// forwarded protocol as well.
const isHttps = (request: NextRequest) =>
	request.nextUrl.protocol === 'https:' ||
	request.headers.get('x-forwarded-proto') === 'https'

// Rejects cross-site mutations. Proxies must preserve Host and X-Forwarded-Proto.
function assertSameOrigin(request: NextRequest) {
	const origin = request.headers.get('origin')
	const protocol =
		request.headers.get('x-forwarded-proto') ??
		request.nextUrl.protocol.slice(0, -1)
	const expectedOrigin = `${protocol}://${request.headers.get('host') ?? request.nextUrl.host}`
	if (origin && origin !== expectedOrigin)
		throw new ApiError('Cross-origin request rejected', 403)
}

async function readJsonBody(request: NextRequest): Promise<unknown> {
	if (request.method === 'GET' || request.method === 'HEAD') return {}
	const raw = await request.text()
	if (raw.length > MAX_BODY_LENGTH) throw new ApiError('Request too large', 413)
	if (!raw) return {}
	try {
		return JSON.parse(raw)
	} catch {
		throw new ApiError('Invalid JSON', 400)
	}
}
