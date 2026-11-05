import { createHash, timingSafeEqual } from 'node:crypto'
import type { RequestHandler } from 'express'
import { HttpError } from '../errors.js'

const digest = (value: string) => createHash('sha256').update(value).digest()

// Requires X-Internal-Token when a token is configured. Hashing first gives
// equal-length buffers, so the comparison is constant-time.
export function requireInternalToken(
	token: string | undefined,
): RequestHandler {
	if (!token) return (_req, _res, next) => next()
	const expected = digest(token)
	return (req, _res, next) => {
		const provided = req.get('x-internal-token')
		if (!provided || !timingSafeEqual(digest(provided), expected))
			throw new HttpError(401, 'Unauthorized')
		next()
	}
}
