import type { RequestHandler, Response } from 'express'
import { z } from 'zod'
import { HttpError } from '../errors.js'

const sessionIdSchema = z.string().uuid()

export const requireSession: RequestHandler = (req, res, next) => {
	const parsed = sessionIdSchema.safeParse(req.get('x-session-id'))
	if (!parsed.success)
		throw new HttpError(400, 'Missing or invalid X-Session-Id header')
	res.locals.sessionId = parsed.data.toLowerCase()
	next()
}

export const sessionIdOf = (res: Response): string => res.locals.sessionId
