import { ApiError } from '@/server/api/errors'
import { route } from '@/app/api/_lib/route'

// Fallback for /api paths without a Route Handler: a JSON 404 instead of the
// HTML not-found page.
const notFound = route<{ segments: string[] }>(async () => {
	throw new ApiError('Endpoint not found', 404)
})

export { notFound as GET, notFound as POST, notFound as DELETE }
