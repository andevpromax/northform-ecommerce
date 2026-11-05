import type { ErrorRequestHandler } from 'express'
import { z } from 'zod'
import { HttpError } from '../errors.js'
import { Prisma } from '../generated/prisma/client.js'

type BodyParserError = Error & { type?: string; status?: number }

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
	if (error instanceof HttpError) {
		res.status(error.status).json({ error: error.message })
		return
	}
	if (error instanceof z.ZodError) {
		res.status(400).json({
			error: 'Invalid request',
			details: error.issues.map((issue) => ({
				path: issue.path.join('.'),
				message: issue.message,
			})),
		})
		return
	}
	const { type } = error as BodyParserError
	if (type === 'entity.parse.failed') {
		res.status(400).json({ error: 'Invalid JSON' })
		return
	}
	if (type === 'entity.too.large') {
		res.status(413).json({ error: 'Request too large' })
		return
	}
	if (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		error.code === 'P2002'
	) {
		res.status(409).json({ error: 'Conflicting request' })
		return
	}
	// Log the error itself only: never request headers, which carry tokens.
	console.error(error)
	res.status(500).json({ error: 'Unexpected server error' })
}
