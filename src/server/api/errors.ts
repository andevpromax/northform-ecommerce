import { z } from 'zod'

// The single error type of the API layer: an HTTP status plus a message that is
// safe to show to the client. Services and the HTTP client throw it; Route
// Handlers map it with toApiError().
export class ApiError extends Error {
	constructor(
		message: string,
		public status = 400,
	) {
		super(message)
	}
}

export type ApiErrorBody = { status: number; message: string }

// Unknown errors never expose details to the client.
export function toApiError(error: unknown): ApiErrorBody {
	if (error instanceof ApiError)
		return { status: error.status, message: error.message }
	if (error instanceof z.ZodError)
		return { status: 400, message: 'Invalid request' }
	console.error(error)
	return { status: 500, message: 'Unexpected server error' }
}
